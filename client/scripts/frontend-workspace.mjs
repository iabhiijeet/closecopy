import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("net::ERR_ABORTED")) errors.push(message.text()); });
const workspace = { id: "test-workspace", title: "Frontend checks", description: "Synthetic fixtures", icon: "📚", defaultModel: "gpt-4o-mini", createdAt: "2026-01-01", updatedAt: "2026-01-01" };
const state = {
  session: true,
  slowChat: false,
  nextConversation: 2,
  sources: [{ id: "s1", title: "Source one", type: "TEXT", status: "READY", content: "First source", metadata: {} }, { id: "s2", title: "Source two", type: "TEXT", status: "READY", content: "Second source with a verified passage", metadata: {} }, { id: "s3", title: "Failed source", type: "TEXT", status: "FAILED", content: "Retry me", metadata: { processingError: "Temporary processing error" } }],
  artifacts: [
    { id: "a1", title: "Reading summary", type: "SUMMARY", content: { markdown: "## Main finding\n\nA **verified** result." } },
    { id: "a2", title: "Revision cards", type: "FLASHCARDS", content: { cards: [{ front: "What is the result?", back: "A verified finding." }] } },
    { id: "a3", title: "Practice questions", type: "QUIZ", content: { questions: [{ question: "Which answer is correct?", options: ["First", "Second"], correctIndex: 1, explanation: "The second option matches the source." }] } },
    { id: "a4", title: "Concept connections", type: "MINDMAP", content: { nodes: [{ id: "n1", label: "Topic" }, { id: "n2", label: "Finding" }], edges: [{ source: "n1", target: "n2" }] } },
    { id: "a5", title: "Research report", type: "REPORT", content: { markdown: "## Results\n\nThe study supports the finding." } },
  ].map((artifact) => ({ ...artifact, status: "READY", createdAt: "2026-01-01" })),
  conversations: [{ id: "c1", title: "Earlier conversation", updatedAt: "2026-01-01" }],
  messages: { c1: [{ id: "old-message", role: "ASSISTANT", content: "Earlier saved answer", citations: [] }] },
  generation: null,
};

await page.route("http://localhost:8080/api/**", async (route) => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  const method = request.method();
  const body = method === "POST" || method === "PATCH" ? request.postDataJSON() : null;
  let data;
  if (path.endsWith("/get-session")) data = state.session ? { user: { id: "u1", name: "Test Researcher", email: "test@example.invalid" }, session: { id: "session1", expiresAt: "2030-01-01" } } : null;
  else if (path === "/api/workspaces") data = [workspace];
  else if (path === "/api/workspaces/test-workspace") data = workspace;
  else if (path.endsWith("/sources/reprocess")) { state.sources = state.sources.map((source) => body.sourceIds.includes(source.id) ? { ...source, status: "READY", metadata: {} } : source); data = { sourceIds: body.sourceIds }; }
  else if (path.endsWith("/sources")) {
    if (method === "POST") { const source = { id: "s4", ...body, status: "READY", metadata: {} }; state.sources.unshift(source); data = source; }
    else data = state.sources;
  }
  else if (/\/sources\/[^/]+$/.test(path) && method === "DELETE") { state.sources = state.sources.filter((source) => source.id !== path.split("/").pop()); }
  else if (path.endsWith("/artifacts")) {
    if (method === "POST") { state.generation = body; const artifact = { id: "generated", title: "Generated summary", type: body.type, status: "READY", content: { markdown: "Generated from the selected sources." }, createdAt: "2026-01-01" }; state.artifacts.unshift(artifact); data = artifact; }
    else data = state.artifacts;
  }
  else if (/\/artifacts\/[^/]+$/.test(path) && method === "DELETE") { state.artifacts = state.artifacts.filter((artifact) => artifact.id !== path.split("/").pop()); }
  else if (path.endsWith("/conversations")) {
    if (method === "POST") { const conversation = { id: `c${state.nextConversation++}`, title: "New question", updatedAt: "2026-01-01" }; state.conversations.unshift(conversation); state.messages[conversation.id] = []; data = conversation; }
    else data = state.conversations;
  }
  else if (path.endsWith("/messages")) data = state.messages[path.split("/").at(-2)] ?? [];
  else if (/\/conversations\/[^/]+$/.test(path) && method === "DELETE") { state.conversations = state.conversations.filter((conversation) => conversation.id !== path.split("/").pop()); }
  else if (path.endsWith("/chat")) {
    const id = body.conversationId;
    state.messages[id].push({ id: `user-${Date.now()}`, role: "USER", content: body.messages.at(-1).parts[0].text, citations: [] });
    if (state.slowChat) { await new Promise((resolve) => setTimeout(resolve, 2000)); await route.fulfill({ status: 200, contentType: "text/event-stream", body: "data: [DONE]\n\n" }).catch(() => {}); return; }
    state.messages[id].push({ id: `assistant-${Date.now()}`, role: "ASSISTANT", content: "## Answer\n\nThe **verified passage** supports this result. [1]", citations: [{ sourceId: "s2", sourceTitle: "Source two", page: 4, excerpt: "Second source with a verified passage" }] });
    await route.fulfill({ status: 200, contentType: "text/event-stream", headers: { "Access-Control-Allow-Origin": "http://localhost:3000", "Access-Control-Allow-Credentials": "true", "Access-Control-Expose-Headers": "X-Conversation-Id", "X-Conversation-Id": id }, body: `data: ${JSON.stringify({ type: "text-delta", delta: state.messages[id].at(-1).content })}\n\ndata: [DONE]\n\n` }); return;
  }
  else throw new Error(`Unexpected fixture request: ${method} ${path}`);
  await route.fulfill({ status: data === undefined ? 204 : 200, contentType: "application/json", body: data === undefined ? undefined : JSON.stringify(data), headers: { "Access-Control-Allow-Origin": "http://localhost:3000", "Access-Control-Allow-Credentials": "true" } });
});

try {
  await page.goto("http://localhost:3000/workspaces/test-workspace");
  await expect(page.getByRole("button", { name: "Switch workspace" })).toBeVisible();
  await page.getByRole("checkbox", { name: "Use Source one in Studio" }).uncheck();
  await page.getByRole("button", { name: /^Summary A concise/ }).click();
  await expect(page.getByText("Generated summary", { exact: true })).toBeVisible();
  assert.deepEqual(state.generation.sourceIds, ["s2"]);
  console.log("PASS selected-source artifact generation");

  await page.getByRole("button", { name: "Retry processing" }).click();
  await expect(page.getByRole("checkbox", { name: "Use Failed source in Studio" })).toBeEnabled();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("textbox", { name: "Source title" }).fill("Added note");
  await page.getByRole("textbox", { name: "Source text" }).fill("New synthetic note");
  await page.getByRole("button", { name: "Add source", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Use Added note in Studio" })).toBeChecked();
  await page.getByRole("button", { name: "Delete source Source one" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Use Source one in Studio" })).toHaveCount(0);
  console.log("PASS source adding, retrying and deleting");

  const chat = page.getByRole("region", { name: "Chat", exact: true });
  await page.getByRole("textbox", { name: "Ask a question" }).fill("Find the key result");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(chat.getByRole("button", { name: "Copy answer" })).toBeVisible();
  await expect(chat.getByRole("heading", { name: "Answer", exact: true })).toBeVisible();
  await chat.getByRole("button", { name: "Citation 1", exact: true }).click();
  await expect(page.getByText("Second source with a verified passage", { exact: true }).first()).toBeVisible();
  await page.getByRole("combobox", { name: "Conversation" }).selectOption("c1");
  await expect(chat.getByText("Earlier saved answer")).toBeVisible();
  await page.getByRole("button", { name: "Delete conversation" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Conversation" })).toHaveValue("");
  console.log("PASS streamed chat, citation passages and saved conversation deletion");

  state.slowChat = true;
  await page.getByRole("textbox", { name: "Ask a question" }).fill("A canceled request");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByRole("button", { name: "Stop response" }).click();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
  assert.deepEqual(await chat.getByRole("alert").allTextContents(), []);
  console.log("PASS response cancellation");

  for (const title of ["Reading summary", "Revision cards", "Practice questions", "Concept connections", "Research report"]) {
    const card = page.getByRole("listitem").filter({ has: page.getByText(title, { exact: true }) });
    await card.getByRole("button", { name: "Open artifact" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: title, exact: true })).toBeVisible();
    if (title === "Reading summary") await expect(dialog.getByRole("heading", { name: "Main finding", exact: true })).toBeVisible();
    if (title === "Revision cards") { await dialog.getByText("What is the result?", { exact: false }).click(); await expect(dialog.getByText("A verified finding.", { exact: true })).toBeVisible(); }
    if (title === "Practice questions") { await dialog.getByRole("button", { name: "Second", exact: true }).click(); await expect(dialog.getByText("Correct.", { exact: true })).toBeVisible(); await dialog.getByRole("button", { name: "Restart quiz" }).click(); await expect(dialog.getByText("0 of 1 answered")).toBeVisible(); }
    if (title === "Concept connections") await expect(dialog.getByRole("img", { name: /Mind map showing/ })).toBeVisible();
    const download = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download Markdown" }).click();
    assert.ok((await download).suggestedFilename().endsWith(".md"));
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
  }
  await page.getByRole("button", { name: "Delete artifact Reading summary" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Reading summary", { exact: true })).toHaveCount(0);
  console.log("PASS artifact readers, flashcards, quizzes, mind-map edges, exports and deletion");
  assert.deepEqual(errors, []);
  console.log("PASS frontend interaction suite with no browser runtime errors");
} finally { await browser.close(); }
