import type { Prisma } from "../generated/prisma/client.js";
import { CHAT_MODEL } from "../lib/ai-config.js";
import { enqueueArtifactGeneration } from "../lib/artifact-event.js";
import {
    createArtifactRecord,
    deleteArtifactRecord,
    findArtifactById,
    findArtifactByIdAndWorkspaceId,
    findArtifactsByWorkspaceId,
    updateArtifactRecord,
    type ArtifactRecord,
} from "../repository/artifact.repository.js";
import { NotFoundError } from "../types/app-error.js";
import type { CreateArtifactInput } from "../validators/artifact.validator.js";
import {
    gatherSourceContext,
    generateArtifactContent,
} from "./artifact-generation.service.js";
import { getWorkspaceByIdForUser } from "./workspace.service.js";

const ARTIFACT_TITLES: Record<ArtifactRecord["type"], string> = {
    SUMMARY: "Summary",
    TAKEAWAYS: "Key takeaways",
    FLASHCARDS: "Flashcards",
    QUIZ: "Quiz",
    MINDMAP: "Mind map",
    REPORT: "Report",
};

function getMetadata(metadata: ArtifactRecord["metadata"]) {
    return metadata &&
        typeof metadata === "object" &&
        !Array.isArray(metadata)
        ? { ...(metadata as Record<string, unknown>) }
        : {};
}

/**
 * Lists learning artifacts for a workspace after verifying ownership.
 */
export async function listArtifactsForWorkspace(
    workspaceId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);
    return findArtifactsByWorkspaceId(workspaceId);
}

/**
 * Loads one artifact from a workspace after verifying ownership.
 */
export async function getArtifactForWorkspace(
    workspaceId: string,
    artifactId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const artifact = await findArtifactByIdAndWorkspaceId(
        artifactId,
        workspaceId,
    );

    if (!artifact) {
        throw new NotFoundError("Artifact not found");
    }

    return artifact;
}

/**
 * Creates an artifact row and queues asynchronous generation.
 *
 * Source context is gathered up front so invalid or unprocessed source ids are
 * rejected before a PENDING artifact is persisted.
 */
export async function createArtifactForWorkspace(
    workspaceId: string,
    userId: string,
    input: CreateArtifactInput,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const context = await gatherSourceContext(workspaceId, input.sourceIds);
    const title = input.title?.trim() || ARTIFACT_TITLES[input.type];

    const artifact = await createArtifactRecord({
        workspaceId,
        type: input.type,
        title,
        sourceIds: context.sourceIds,
        status: "PENDING",
    });

    try {
        await enqueueArtifactGeneration({ artifactId: artifact.id });
    } catch (error) {
        await updateArtifactRecord(artifact.id, {
            status: "FAILED",
            metadata: {
                ...getMetadata(artifact.metadata),
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to enqueue artifact generation",
            },
        });
        throw error;
    }

    return artifact;
}

/**
 * Deletes an artifact after verifying it belongs to the workspace.
 */
export async function deleteArtifactForWorkspace(
    workspaceId: string,
    artifactId: string,
    userId: string,
) {
    await getArtifactForWorkspace(workspaceId, artifactId, userId);
    await deleteArtifactRecord(artifactId);
}

/**
 * Generates a learning artifact from its workspace sources.
 *
 * The artifact is marked `PROCESSING` while generation runs and `READY` on
 * success. Failures are persisted as `FAILED` before the error is rethrown so
 * Inngest can retry the job.
 *
 * @param artifactId - Learning artifact id
 * @returns Updated artifact record
 */
export async function processArtifactById(artifactId: string) {
    const artifact = await findArtifactById(artifactId);

    if (!artifact) {
        throw new NotFoundError(`Learning artifact ${artifactId} not found`);
    }

    await updateArtifactRecord(artifactId, { status: "PROCESSING" });

    try {
        const context = await gatherSourceContext(
            artifact.workspaceId,
            artifact.sourceIds,
        );
        const content = await generateArtifactContent(
            artifact.type,
            context.text,
        );

        if (!content) {
            throw new Error("Artifact generation returned no content");
        }

        return await updateArtifactRecord(artifactId, {
            status: "READY",
            content: content as Prisma.InputJsonValue,
            metadata: {
                ...getMetadata(artifact.metadata),
                generatedAt: new Date().toISOString(),
                model: CHAT_MODEL,
            },
        });
    } catch (error) {
        await updateArtifactRecord(artifactId, {
            status: "FAILED",
            metadata: {
                ...getMetadata(artifact.metadata),
                error:
                    error instanceof Error
                        ? error.message
                        : "Artifact generation failed",
            },
        });

        throw error;
    }
}
