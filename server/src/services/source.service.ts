import type { Prisma } from "../generated/prisma/client.js";
import { deleteCloudinaryAsset, uploadPdfToCloudinary } from "../lib/cloudinary.js";
import { scrapeWebsite } from "../lib/firecrawl.js";
import { extractPdfFromBuffer } from "../lib/pdf.js";
import { enqueueSourceProcessing } from "../lib/source-event.js";
import { fetchYoutubeTranscript } from "../lib/youtube.js";
import {
    createSourceRecord,
    deleteSourceRecord,
    findSourceByIdAndWorkspaceId,
    findSourcesByWorkspaceId,
    updateSourceRecord,
    type SourceRecord,
} from "../repository/source.repository.js";
import { NotFoundError } from "../types/app-error.js";
import { CreateSourceInput, ImportWebsiteInput, ImportYoutubeInput, ListSourcesQuery } from "../validators/source.validator.js";
import {
    markSourceFailed,
    removeSourceFromIndex,
} from "./source-processing.services.js";
import { getWorkspaceByIdForUser } from "./workspace.service.js";

async function assertWorkspaceAccess(workspaceId: string, userId: string) {
    await getWorkspaceByIdForUser(workspaceId, userId);
}

function getSourceMetadata(metadata: SourceRecord["metadata"]) {
    return metadata &&
        typeof metadata === "object" &&
        !Array.isArray(metadata)
        ? { ...(metadata as Record<string, unknown>) }
        : {};
}

async function cleanupSourceAssets(source: SourceRecord) {
    try {
        await removeSourceFromIndex(source.workspaceId, source.id);
    } catch (error) {
        console.error("Failed to remove source from vector index:", error);
    }

    const metadata = getSourceMetadata(source.metadata);
    const publicId =
        typeof metadata.publicId === "string" ? metadata.publicId : undefined;

    if (!publicId) {
        return;
    }

    try {
        await deleteCloudinaryAsset(
            publicId,
            metadata.resourceType === "image" ? "image" : "raw",
        );
    } catch (error) {
        console.error("Failed to delete source asset from Cloudinary:", error);
    }
}

async function createAndProcessSource(
    data: Parameters<typeof createSourceRecord>[0],
) {
    const source = await createSourceRecord(data);

    try {
        await enqueueSourceProcessing({
            sourceId: source.id,
            workspaceId: source.workspaceId,
        });
    } catch (error) {
        await markSourceFailed(source.id, error, source.metadata);
        throw error;
    }

    return source;
}


export async function listSourcesForWorkspace(
    workspaceId: string,
    userId: string,
    filters: ListSourcesQuery = {},
) {
    await assertWorkspaceAccess(workspaceId, userId);
    return findSourcesByWorkspaceId(workspaceId, filters);
}

export async function getSourceForWorkspace(
    workspaceId: string,
    sourceId: string,
    userId: string,
): Promise<SourceRecord> {
    await assertWorkspaceAccess(workspaceId, userId);

    const source = await findSourceByIdAndWorkspaceId(sourceId, workspaceId);

    if (!source) {
        throw new NotFoundError("Source not found");
    }

    return source;
}

export async function deleteSourceForWorkspace(
    workspaceId: string,
    sourceId: string,
    userId: string,
) {
    const source = await getSourceForWorkspace(workspaceId, sourceId, userId);

    await cleanupSourceAssets(source);
    await deleteSourceRecord(sourceId);
}

export async function bulkDeleteSourcesForWorkspace(
    workspaceId: string,
    userId: string,
    sourceIds: string[],
) {
    await assertWorkspaceAccess(workspaceId, userId);

    for (const sourceId of sourceIds) {
        await deleteSourceForWorkspace(workspaceId, sourceId, userId);
    }
}

export async function createTextOrMarkdownSource(
    workspaceId: string,
    userId: string,
    input: CreateSourceInput,
) {
    await assertWorkspaceAccess(workspaceId, userId);

    return createAndProcessSource({
        workspaceId,
        type: input.type,
        title: input.title,
        content: input.content,
        status: "PENDING",
    });
}

export async function reprocessSourcesForWorkspace(
    workspaceId: string,
    userId: string,
    sourceIds?: string[],
) {
    await assertWorkspaceAccess(workspaceId, userId);

    const allSources = await findSourcesByWorkspaceId(workspaceId);
    const requestedIds = sourceIds ? [...new Set(sourceIds)] : [];
    const selected = requestedIds.length
        ? allSources.filter((source) => requestedIds.includes(source.id))
        : allSources;

    if (requestedIds.length > 0 && selected.length !== requestedIds.length) {
        throw new NotFoundError("One or more sources were not found");
    }

    for (const source of selected) {
        try {
            await removeSourceFromIndex(workspaceId, source.id);
        } catch (error) {
            console.error("Failed to clear source index before reprocess:", error);
        }

        const metadata = getSourceMetadata(source.metadata);
        delete metadata.processingError;

        await updateSourceRecord(source.id, {
            status: "PENDING",
            metadata: metadata as Prisma.InputJsonValue,
        });

        try {
            await enqueueSourceProcessing({
                sourceId: source.id,
                workspaceId,
            });
        } catch (error) {
            await markSourceFailed(source.id, error, source.metadata);
            throw error;
        }
    }

    return { sourceIds: selected.map((source) => source.id) };
}


export async function importWebsiteSource(
    workspaceId: string,
    userId: string,
    input: ImportWebsiteInput,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const scraped = await scrapeWebsite(input.url);

    return createAndProcessSource({
        workspaceId,
        type: "WEBSITE",
        title: input.title || scraped.title || input.url,
        content: scraped.markdown,
        url: scraped.sourceUrl,
        status: "PENDING",
        metadata: {
            importedFrom: scraped.sourceUrl,
        },
    });
}

export async function uploadPdfSource(
    workspaceId: string,
    userId: string,
    file: Express.Multer.File,
    title?: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const upload = await uploadPdfToCloudinary(
        file.buffer,
        file.originalname,
    );

    let content: string | null = null;
    let pageCount: number | undefined;
    let pages: string[] | undefined;

    try {
        const extracted = await extractPdfFromBuffer(file.buffer);
        content = extracted.text;
        pageCount = extracted.pageCount;
        pages = extracted.pages;
    } catch {
        // Inngest will retry extraction from Cloudinary if upload-time parse fails.
    }

    return createAndProcessSource({
        workspaceId,
        type: "PDF",
        title: title?.trim() || file.originalname.replace(/\.pdf$/i, ""),
        content,
        status: "PENDING",
        metadata: {
            fileUrl: upload.secureUrl,
            fileName: upload.originalFilename,
            fileSize: upload.bytes,
            publicId: upload.publicId,
            resourceType: upload.resourceType,
            pageCount,
            pages,
        },
    });
}


export async function importYoutubeSource(
    workspaceId: string,
    userId: string,
    input: ImportYoutubeInput,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const transcript = await fetchYoutubeTranscript(input.url);

    return createAndProcessSource({
        workspaceId,
        type: "YOUTUBE",
        title: input.title || `YouTube: ${transcript.videoId}`,
        content: transcript.content,
        url: input.url,
        status: "PENDING",
        metadata: {
            videoId: transcript.videoId,
        },
    });
}
