import { chromium, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const serverRequire = createRequire(new URL("../../server/package.json", import.meta.url));
serverRequire("dotenv").config({ path: fileURLToPath(new URL("../../server/.env", import.meta.url)), quiet: true });
const { Pool } = serverRequire("pg");
const base = process.env.E2E_CLIENT_URL || "http://localhost:3000";
const api = process.env.E2E_API_URL || "http://localhost:8080";
const run = Date.now().toString(36);
const email = `e2e-${run}@example.invalid`;
const otherEmail = `e2e-other-${run}@example.invalid`;
const password = `E2e!${randomBytes(18).toString("hex")}`;
const results = [];
const pageErrors = [];
const reportDir = new URL("../preview/", import.meta.url);
await mkdir(reportDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on("pageerror", (error) => pageErrors.push(error.message));
let workspaceId;
const sanitize = (value) => String(value).replace(/sk-[\w-]+/g, "[redacted key]").replace(/Bearer\s+\S+/gi, "Bearer [redacted]");

async function step(name, work) {
  console.log(`RUN ${name}`);
  try { await work(); results.push({ name, status: "passed" }); console.log(`PASS ${name}`); return true; }
  catch (error) { const message = sanitize(error.message); const status = message.includes("processing is temporarily unavailable") ? "blocked" : "failed"; results.push({ name, status, message }); console.log(`${status.toUpperCase()} ${name}: ${message}`); await page.keyboard.press("Escape").catch(() => {}); return false; }
}

async function get(path) {
  const response = await context.request.get(`${api}${path}`);
  if (!response.ok()) throw new Error(`${path}: HTTP ${response.status()}`);
  return response.json();
}

async function waitForRecord(path, predicate, timeout = 120_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const records = await get(path);
    const match = records.find(predicate);
    if (match?.status === "FAILED") throw new Error(match.metadata?.processingError || match.metadata?.error || "Processing failed");
    if (match?.status === "READY") return match;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Processing did not finish within ${timeout / 1000} seconds`);
}

try {
  const registered = await step("Register through the frontend", async () => {
    await page.goto(`${base}/register`);
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("End to End Researcher");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.waitForURL(`${base}/workspaces`, { timeout: 30_000 }).catch(async () => { throw new Error(await page.getByRole("alert").first().textContent().catch(() => "Registration did not open workspaces")); });
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  });
  if (!registered) throw new Error("Registration failed; dependent live tests could not continue.");

  await step("Create a workspace with an icon", async () => {
    await page.getByRole("button", { name: "New workspace", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Use 🧠 icon" }).click();
    await dialog.getByRole("textbox", { name: "Title", exact: true }).fill(`E2E research ${run}`);
    await dialog.getByRole("textbox", { name: /Description/ }).fill("Temporary test project");
    await dialog.getByRole("button", { name: "Create workspace", exact: true }).click();
    await page.waitForURL(/\/workspaces\/[^/?]+$/, { timeout: 30_000 });
    workspaceId = new URL(page.url()).pathname.split("/").pop();
    await expect(page.getByRole("button", { name: "Switch workspace" })).toBeVisible();
    const workspace = await get(`/api/workspaces/${workspaceId}`);
    if (workspace.icon !== "🧠") throw new Error("The chosen workspace icon was not saved");
    if (workspace.defaultModel !== "gpt-4o-mini") throw new Error("A new workspace has no valid default model");
  });
  if (!workspaceId) throw new Error("Workspace creation failed; dependent live tests could not continue.");

  await step("Reject another account's workspace access", async () => {
    const other = await browser.newContext();
    try {
      const registered = await other.request.post(`${api}/api/auth/sign-up/email`, { headers: { Origin: base }, data: { name: "Other Test User", email: otherEmail, password } });
      if (!registered.ok()) throw new Error(`Second account registration returned ${registered.status()}`);
      for (const suffix of ["", "/sources", "/conversations", "/artifacts"]) {
        const response = await other.request.get(`${api}/api/workspaces/${workspaceId}${suffix}`);
        if (response.status() !== 404) throw new Error(`Another user could access ${suffix || "the workspace"}: ${response.status()}`);
      }
    } finally { await other.close(); }
  });

  await step("Google OAuth returns the configured provider redirect", async () => {
    const response = await context.request.post(`${api}/api/auth/sign-in/social`, { headers: { Origin: base }, data: { provider: "google", callbackURL: `${base}/workspaces`, disableRedirect: true } });
    if (!response.ok()) throw new Error(`Google sign-in initialization returned ${response.status()}`);
    const body = await response.json();
    if (new URL(body.url).hostname !== "accounts.google.com") throw new Error("Google sign-in did not return a Google authorization URL");
  });

  await step("Edit workspace details", async () => {
    await page.getByRole("button", { name: "Workspace settings" }).click();
    await page.getByRole("dialog").getByRole("textbox", { name: "Title", exact: true }).fill(`E2E updated ${run}`);
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: `E2E updated ${run}` })).toBeVisible();
  });

  await step("Responsive workspace and mobile panels", async () => {
    try {
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(200);
      const sizes = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, height: innerHeight, scrollHeight: document.documentElement.scrollHeight }));
      if (sizes.scrollWidth > sizes.width + 1) throw new Error(`Horizontal overflow at ${width}px`);
      if (sizes.scrollHeight > sizes.height + 2) throw new Error(`Workspace extends beyond the viewport at ${width}px`);
      if (width < 1024) {
        await page.getByRole("tab", { name: "Sources", exact: true }).click();
        await expect(page.getByRole("button", { name: "Add", exact: true })).toBeVisible();
        await page.getByRole("tab", { name: "Artifacts", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Studio", exact: true })).toBeVisible();
        await page.getByRole("tab", { name: "Ask", exact: true }).click();
      }
      await page.screenshot({ path: fileURLToPath(new URL(`e2e-workspace-${width}.png`, reportDir)) });
    }
    } finally { await page.setViewportSize({ width: 1440, height: 1000 }); }
  });

  await step("Live chat stream and saved history on an empty workspace", async () => {
    await page.getByRole("textbox", { name: "Ask a question" }).fill("Hello. What can I do in this workspace?");
    const responsePromise = page.waitForResponse((response) => response.url().endsWith(`/api/workspaces/${workspaceId}/chat`));
    await page.getByRole("button", { name: "Send message" }).click();
    const response = await responsePromise;
    if (!response.ok()) throw new Error(`Chat returned ${response.status()}`);
    const headers = await response.allHeaders();
    if (!headers["access-control-expose-headers"]?.toLowerCase().includes("x-conversation-id")) throw new Error("The conversation header is not exposed to browser clients");
    await expect(page.getByRole("button", { name: "Copy answer" }).first()).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole("button", { name: "Send message" })).toBeVisible({ timeout: 30_000 });
    const conversations = await get(`/api/workspaces/${workspaceId}/conversations`);
    const saved = await get(`/api/workspaces/${workspaceId}/conversations/${conversations[0].id}/messages`);
    if (!saved.some((message) => message.role === "ASSISTANT" && message.content)) throw new Error("The streamed answer was not saved");
    await page.reload();
    await page.getByRole("combobox", { name: "Conversation" }).selectOption(conversations[0].id);
    await expect(page.getByRole("button", { name: "Copy answer" }).first()).toBeVisible();
  });

  const sourceReady = await step("Add and process a text source", async () => {
    await page.getByRole("button", { name: "Add", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "Source title" }).fill("Sample storage protocol");
    await dialog.getByRole("textbox", { name: "Source text" }).fill("Sample Storage Protocol. Study code CLOSECOPY-TEST. The laboratory stores study samples at 4 degrees Celsius for up to 48 hours before analysis. Each sample receives a unique barcode at collection. Researchers record collection time, storage temperature, and handling conditions. Samples are analyzed in batches of 12. The control group uses the same storage temperature and handling protocol as the treatment group. Two independent reviewers verify the recorded measurements. This is synthetic test material, not medical guidance.");
    const responsePromise = page.waitForResponse((response) => response.url().endsWith(`/api/workspaces/${workspaceId}/sources`) && response.request().method() === "POST");
    await dialog.getByRole("button", { name: "Add source", exact: true }).click();
    const response = await responsePromise;
    if (!response.ok()) { const error = await response.json(); throw new Error(error.error || `Source submission returned ${response.status()}`); }
    await expect(dialog).toHaveCount(0, { timeout: 30_000 });
    await waitForRecord(`/api/workspaces/${workspaceId}/sources`, (record) => record.title === "Sample storage protocol");
    await expect(page.getByRole("checkbox", { name: "Use Sample storage protocol in Studio" })).toBeChecked({ timeout: 15_000 });
  });

  if (sourceReady) {
    await step("Stream a cited reply and preserve conversation history", async () => {
      await page.getByRole("textbox", { name: "Ask a question" }).fill("At what temperature are the samples stored? Cite the protocol.");
      await page.getByRole("button", { name: "Send message" }).click();
      await expect(page.getByRole("button", { name: "Copy answer" }).first()).toBeVisible({ timeout: 120_000 });
      await expect(page.getByRole("button", { name: "Sample storage protocol", exact: false }).last()).toBeVisible();
      await expect(page.getByRole("button", { name: "Send message" })).toBeVisible({ timeout: 30_000 });
      const conversations = await get(`/api/workspaces/${workspaceId}/conversations`);
      if (!conversations.length) throw new Error("Conversation was not persisted");
      const messages = await get(`/api/workspaces/${workspaceId}/conversations/${conversations[0].id}/messages`);
      if (!messages.some((message) => message.role === "ASSISTANT" && message.content.includes("4"))) throw new Error("The answer was not saved with the expected source fact");
      await page.reload();
      await page.getByRole("combobox", { name: "Conversation" }).selectOption(conversations[0].id);
      await expect(page.getByRole("button", { name: "Copy answer" }).first()).toBeVisible();
    });

    for (const [type, label] of [["SUMMARY", "Summary"], ["TAKEAWAYS", "Key takeaways"], ["FLASHCARDS", "Flashcards"], ["QUIZ", "Practice quiz"], ["MINDMAP", "Mind map"], ["REPORT", "Report"]]) {
      await step(`Generate and open ${label}`, async () => {
        await page.getByRole("button", { name: new RegExp(`^${label}`) }).first().click();
        const artifact = await waitForRecord(`/api/workspaces/${workspaceId}/artifacts`, (record) => record.type === type, 180_000);
        await expect(page.getByText(artifact.title, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
        const card = page.getByRole("listitem").filter({ has: page.getByText(artifact.title, { exact: true }) });
        await card.getByRole("button", { name: "Open artifact" }).click();
        await expect(page.getByRole("dialog").getByRole("heading", { name: artifact.title })).toBeVisible();
        if (type === "QUIZ") { await page.getByRole("dialog").getByRole("button").filter({ hasText: artifact.content.questions[0].options[0] }).first().click(); await expect(page.getByText(/1 of .* answered/)).toBeVisible(); }
        if (type === "MINDMAP") await expect(page.getByRole("img", { name: /Mind map showing/ })).toBeVisible();
        const download = page.waitForEvent("download");
        await page.getByRole("dialog").getByRole("button", { name: "Download Markdown" }).click();
        if (!(await download).suggestedFilename().endsWith(".md")) throw new Error("Artifact download has the wrong format");
        await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
      });
    }
  }

  await step("Delete the test workspace through the frontend", async () => {
    await page.getByRole("button", { name: "Workspace settings" }).click();
    await page.getByRole("button", { name: "Delete workspace", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForURL(`${base}/workspaces`, { timeout: 30_000 });
    const response = await context.request.get(`${api}/api/workspaces/${workspaceId}`);
    if (response.status() !== 404) throw new Error("Deleted workspace is still accessible");
    workspaceId = undefined;
  });

  await step("Sign out, sign back in, and protect workspace routes", async () => {
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL(`${base}/login`);
    await page.goto(`${base}/workspaces`);
    await page.waitForURL(/\/login\?next=/);
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL(`${base}/workspaces`);
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  });
} catch (error) {
  results.push({ name: "Live flow", status: "failed", message: sanitize(error.message) });
} finally {
  if (workspaceId) await context.request.delete(`${api}/api/workspaces/${workspaceId}`).catch(() => {});
  await browser.close();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10_000 });
  try { await pool.query('DELETE FROM "user" WHERE email = ANY($1::text[]) AND email LIKE $2', [[email, otherEmail], "e2e-%@example.invalid"]); }
  catch { results.push({ name: "Test account cleanup", status: "failed", message: "Could not remove the temporary test account" }); }
  finally { await pool.end(); }
  if (pageErrors.length) results.push({ name: "Browser runtime errors", status: "failed", messages: pageErrors.map(sanitize) });
  await writeFile(new URL("e2e-report.json", reportDir), JSON.stringify({ run, results }, null, 2));
  console.log(JSON.stringify({ passed: results.filter((result) => result.status === "passed").length, failed: results.filter((result) => result.status === "failed").length, blocked: results.filter((result) => result.status === "blocked").length }));
  if (results.some((result) => result.status !== "passed")) process.exitCode = 1;
}
