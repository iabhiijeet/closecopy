import { deleteCloudinaryAsset } from "../lib/cloudinary.js";
import { deleteWorkspaceVectors, isPineconeConfigured } from "../lib/pinecone.js";
import {
    findSourceAssetsByWorkspaceId,
    type SourceAssetRecord,
} from "../repository/source.repository.js";
import {
    deleteWorkspace,
    updateWorkspace,
    createWorkspace,
    findWorkspaceByIdandUserId,
    findWorkspaceByUser,
    type typeWorkspace,
} from "../repository/workspace.repository.js";

import { NotFoundError } from "../types/app-error.js";
import { createWorkspaceSchema, updateWorkspaceSchema } from "../validators/workspace.validator.js";


export function listWorkspaceByUserId(userId: string) {
    return findWorkspaceByUser(userId);
}

export async function getWorkspaceByIdForUser(
    workspaceId: string,
    userId: string,
): Promise<typeWorkspace> {
    const workspace = await findWorkspaceByIdandUserId(workspaceId, userId);

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    return workspace;
}


export function createWorkspaceForUser(
    userId: string,
    input: createWorkspaceSchema,
) {
    return createWorkspace(userId, input);
}


export async function updateWorkspaceForUser(
    workspaceId: string,
    userId: string,
    input: updateWorkspaceSchema,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);
    return updateWorkspace(workspaceId, input);
}

function getSourceMetadata(source: SourceAssetRecord) {
    return source.metadata &&
        typeof source.metadata === "object" &&
        !Array.isArray(source.metadata)
        ? (source.metadata as Record<string, unknown>)
        : {};
}

async function cleanupWorkspaceAssets(workspaceId: string) {
    const sources = await findSourceAssetsByWorkspaceId(workspaceId);

    if (isPineconeConfigured()) {
        try {
            await deleteWorkspaceVectors(workspaceId);
        } catch (error) {
            console.error("Failed to delete Pinecone namespace:", error);
        }
    }

    const results = await Promise.allSettled(
        sources.map((source) => {
            const metadata = getSourceMetadata(source);
            const publicId =
                typeof metadata.publicId === "string"
                    ? metadata.publicId
                    : undefined;

            if (!publicId) {
                return Promise.resolve();
            }

            const resourceType =
                metadata.resourceType === "image" ? "image" : "raw";

            return deleteCloudinaryAsset(publicId, resourceType);
        }),
    );

    for (const result of results) {
        if (result.status === "rejected") {
            console.error("Failed to delete workspace source asset:", result.reason);
        }
    }
}

export async function deleteWorkspaceForUser(
    workspaceId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    await cleanupWorkspaceAssets(workspaceId);

    // Delete exactly once. Cascades remove sources, conversations, and artifacts.
    await deleteWorkspace(workspaceId);
}
