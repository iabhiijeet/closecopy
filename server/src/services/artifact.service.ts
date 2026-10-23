import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { CHAT_MODEL } from "../lib/ai-config.js";
import prisma from "../lib/db.js";
import { findChunksBySourceId } from "../repository/source-chunk.repository.js";

const MAX_CONTEXT_CHUNKS = 40;

const ARTIFACT_INSTRUCTIONS: Record<string, string> = {
    SUMMARY:
        "Write a structured summary with a short overview, the main ideas, and key details.",
    TAKEAWAYS:
        "Write 5-10 concise, actionable key takeaways as a numbered list.",
    FLASHCARDS:
        "Create 8-12 flashcards. Format each as `Q: ...` followed by `A: ...`.",
    QUIZ:
        "Create a quiz with 8-10 questions. Include the correct answer after each question.",
    MINDMAP:
        "Describe a mind map as a nested outline with the central topic first.",
    REPORT:
        "Write a structured report with headings, findings, and a conclusion.",
};

/**
 * Generates a learning artifact from the source chunks attached to it.
 *
 * The artifact is marked `PROCESSING` while generation runs and `READY` on
 * success. Failures are persisted as `FAILED` before the error is rethrown so
 * Inngest can retry the job.
 *
 * @param artifactId - Learning artifact id
 * @returns Updated artifact record
 */
export async function processArtifactById(artifactId: string) {
    const artifact = await prisma.learningArtifact.findUnique({
        where: { id: artifactId },
    });

    if (!artifact) {
        throw new Error(`Learning artifact ${artifactId} not found`);
    }

    await prisma.learningArtifact.update({
        where: { id: artifactId },
        data: { status: "PROCESSING" },
    });

    try {
        const chunkGroups = await Promise.all(
            artifact.sourceIds.map((sourceId) =>
                findChunksBySourceId(sourceId),
            ),
        );
        const context = chunkGroups
            .flat()
            .slice(0, MAX_CONTEXT_CHUNKS)
            .map((chunk) => chunk.content)
            .join("\n\n");

        if (!context.trim()) {
            throw new Error(
                `Artifact ${artifactId} has no indexed source content`,
            );
        }

        const instruction =
            ARTIFACT_INSTRUCTIONS[artifact.type] ??
            "Produce a clear, well-structured learning artifact.";

        const { text } = await generateText({
            model: openai(CHAT_MODEL),
            system: [
                "You create learning artifacts from a user's workspace sources.",
                "Use only the supplied context. Do not invent facts or citations.",
                instruction,
            ].join("\n"),
            prompt: `Artifact title: ${artifact.title}\n\nSource content:\n${context}`,
        });

        return await prisma.learningArtifact.update({
            where: { id: artifactId },
            data: {
                status: "READY",
                content: { text: text.trim() },
                metadata: {
                    ...(artifact.metadata &&
                    typeof artifact.metadata === "object" &&
                    !Array.isArray(artifact.metadata)
                        ? artifact.metadata
                        : {}),
                    generatedAt: new Date().toISOString(),
                    model: CHAT_MODEL,
                },
            },
        });
    } catch (error) {
        await prisma.learningArtifact.update({
            where: { id: artifactId },
            data: {
                status: "FAILED",
                metadata: {
                    ...(artifact.metadata &&
                    typeof artifact.metadata === "object" &&
                    !Array.isArray(artifact.metadata)
                        ? artifact.metadata
                        : {}),
                    error:
                        error instanceof Error
                            ? error.message
                            : "Artifact generation failed",
                },
            },
        });

        throw error;
    }
}
