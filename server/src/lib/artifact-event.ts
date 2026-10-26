import { inngest } from "../inngest/client.js";

/**
 * Enqueues asynchronous learning-artifact generation via Inngest.
 *
 * @param input - Artifact id to generate
 * @returns Resolves when the event is accepted by Inngest
 */
export async function enqueueArtifactGeneration(input: {
    artifactId: string;
}) {
    await inngest.send({
        name: "artifact/generate",
        data: input,
    });
}
