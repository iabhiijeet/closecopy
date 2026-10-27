import "../src/lib/env.js";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import prisma from "../src/lib/db.js";
import { getPineconeClient, getPineconeIndexName, deleteWorkspaceVectors } from "../src/lib/pinecone.js";
import { extractSourceContent, chunkSourceContent, embedAndIndexSource, markSourceProcessing } from "../src/services/source-processing.services.js";
import { findSourceById } from "../src/repository/source.repository.js";
import { findChunksBySourceId } from "../src/repository/source-chunk.repository.js";
import { retrieveWorkspaceContext } from "../src/lib/rag/retrieve.js";
import { processArtifactById } from "../src/services/artifact.service.js";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const id = randomUUID();
const results: { name: string; status: string; message?: string }[] = [];
let workspaceId: string | undefined;
let indexTouched = false;
async function check(name: string, work: () => Promise<void>) {
    console.log(`RUN ${name}`);
    try { await work(); results.push({ name, status: "passed" }); console.log(`PASS ${name}`); return true; }
    catch (error) { const message = String(error instanceof Error ? error.message : error).replace(/sk-[\w-]+/g, "[redacted key]"); results.push({ name, status: "failed", message }); console.log(`FAIL ${name}: ${message}`); return false; }
}

try {
    await prisma.user.create({ data: { id, email: `e2e-processors-${id}@example.invalid`, name: "Processor Test", emailVerified: false, updatedAt: new Date() } });
    const workspace = await prisma.workspace.create({ data: { userId: id, title: "Temporary processor integration test", defaultModel: "gpt-4o-mini" } });
    workspaceId = workspace.id;
    const source = await prisma.source.create({ data: { workspaceId, type: "TEXT", title: "Synthetic laboratory protocol", content: "Samples are stored at 4 degrees Celsius for 48 hours before analysis. Each sample receives a unique barcode. Two independent reviewers check the measurements. Samples are processed in batches of twelve. The control and treatment groups follow identical handling protocols. This is synthetic test material." } });
    await check("Source extraction and chunk persistence", async () => {
        await markSourceProcessing(source.id);
        const extracted = await extractSourceContent(source.id);
        assert.ok(extracted.text.includes("4 degrees"));
        await chunkSourceContent(source.id, extracted.text, extracted.pages);
        assert.ok((await findChunksBySourceId(source.id)).length > 0);
    });
    await check("OpenAI embedding, Pinecone indexing and retrieval", async () => {
        await getPineconeClient().describeIndex(getPineconeIndexName());
        const current = await findSourceById(source.id);
        assert.ok(current);
        indexTouched = true;
        await embedAndIndexSource(current, await findChunksBySourceId(source.id));
        let found = false;
        for (let attempt = 0; attempt < 8 && !found; attempt++) {
            const chunks = await retrieveWorkspaceContext(workspace.id, "At what temperature are samples stored?");
            found = chunks.some((chunk) => chunk.sourceId === source.id && chunk.text.includes("4 degrees"));
            if (!found) await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        assert.ok(found, "The test source was not retrieved");
    });
    // Artifact tests use an isolated, validated text fixture independently of vector availability.
    await prisma.source.update({ where: { id: source.id }, data: { status: "READY" } });
    const inference = !process.argv.includes("--vectors-only") && await check("Live chat model inference", async () => {
        const result = await generateText({ model: openai("gpt-4o-mini"), prompt: `Use only this protocol: ${source.content}\nAt what temperature are samples stored? Answer with the number and unit.`, maxOutputTokens: 100, maxRetries: 0 });
        assert.ok(result.text.includes("4"));
    });
    if (inference) {
        for (const type of ["SUMMARY", "TAKEAWAYS", "FLASHCARDS", "QUIZ", "MINDMAP", "REPORT"] as const) {
            await check(`Live ${type.toLowerCase()} generation and persistence`, async () => {
                const artifact = await prisma.learningArtifact.create({ data: { workspaceId: workspace.id, type, title: `Test ${type}`, sourceIds: [source.id], status: "PENDING" } });
                const ready = await processArtifactById(artifact.id);
                assert.equal(ready.status, "READY");
                assert.ok(ready.content);
                const content = ready.content as Record<string, unknown>;
                if (type === "SUMMARY" || type === "REPORT") assert.equal(typeof content.markdown, "string");
                if (type === "QUIZ") assert.ok(Array.isArray(content.questions));
                if (type === "FLASHCARDS") assert.ok(Array.isArray(content.cards));
                if (type === "MINDMAP") assert.ok(Array.isArray(content.nodes) && Array.isArray(content.edges));
                if (type === "TAKEAWAYS") assert.ok(Array.isArray(content.items));
            });
        }
    }
} catch (error) {
    results.push({ name: "Processor setup", status: "failed", message: error instanceof Error ? error.message : String(error) });
} finally {
    if (workspaceId && indexTouched) await deleteWorkspaceVectors(workspaceId).catch(() => {});
    await prisma.user.deleteMany({ where: { id, email: `e2e-processors-${id}@example.invalid` } }).catch(() => {});
    await prisma.$disconnect();
    const reportDirectory = new URL("../../client/preview/", import.meta.url);
    await mkdir(reportDirectory, { recursive: true });
    await writeFile(new URL("backend-processor-report.json", reportDirectory), JSON.stringify({ results }, null, 2));
    console.log(JSON.stringify({ passed: results.filter((result) => result.status === "passed").length, failed: results.filter((result) => result.status === "failed").length }));
    if (results.some((result) => result.status === "failed")) process.exitCode = 1;
}
