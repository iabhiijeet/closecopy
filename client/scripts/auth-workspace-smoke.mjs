import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (error) => errors.push(`${width}px: ${error.message}`));
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Welcome back" }).waitFor();
    if (width === 375) {
      await page.getByRole("textbox", { name: "Email" }).fill("missing-user@example.com");
      await page.getByLabel("Password").fill("incorrect-password");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.getByRole("alert").waitFor();
    }
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
      errors.push(`${width}px: login overflows horizontally`);
    }
    await page.goto("http://localhost:3000/register", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Start your workspace" }).waitFor();
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
      errors.push(`${width}px: registration overflows horizontally`);
    }
    await page.goto("http://localhost:3000/workspaces", { waitUntil: "networkidle" });
    await page.waitForURL(/\/login\?next=/);
    await page.close();
  }
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (error) => errors.push(`${width}px workspace: ${error.message}`));
    await page.route("http://localhost:8080/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      const data = path.endsWith("/get-session") ? { user: { id: "user-1", name: "Researcher", email: "test@example.com" }, session: { id: "session-1", expiresAt: "2030-01-01" } }
        : path === "/api/workspaces" && route.request().method() === "POST" ? { id: "workspace-2", title: "New research", description: null, icon: "🧠", defaultModel: "gpt-4o-mini", createdAt: "2026-01-01", updatedAt: "2026-01-01" }
        : path === "/api/workspaces" ? [{ id: "workspace-1", title: "Immunotherapy papers", description: "A reading project", icon: null, defaultModel: "gpt-4o-mini", createdAt: "2026-01-01", updatedAt: "2026-01-01" }]
        : path === "/api/workspaces/workspace-2" ? { id: "workspace-2", title: "New research", description: null, icon: "🧠", defaultModel: "gpt-4o-mini", createdAt: "2026-01-01", updatedAt: "2026-01-01" }
        : path === "/api/workspaces/workspace-1" ? { id: "workspace-1", title: "Immunotherapy papers", description: "A reading project", icon: null, defaultModel: "gpt-4o-mini", createdAt: "2026-01-01", updatedAt: "2026-01-01" }
        : path.endsWith("/artifacts") && width === 768 ? [{ id: "artifact-1", title: "Key findings", type: "TAKEAWAYS", status: "READY", content: { items: ["The first finding", "The second finding"] }, createdAt: "2026-01-01" }]
        : [];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data), headers: { "Access-Control-Allow-Origin": "http://localhost:3000", "Access-Control-Allow-Credentials": "true" } });
    });
    await page.goto("http://localhost:3000/workspaces", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /Welcome back/ }).waitFor();
    await page.getByRole("button", { name: "New workspace", exact: true }).click();
    await page.getByRole("dialog").getByRole("heading", { name: "Create a workspace" }).waitFor();
    if (width === 1440) await page.screenshot({ path: "preview/create-workspace-1440.png", fullPage: true });
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    if (width === 768) {
      await page.getByRole("button", { name: "New workspace", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Use 🧠 icon" }).click();
      await page.getByRole("dialog").getByRole("textbox", { name: "Title" }).fill("New research");
      await page.getByRole("dialog").getByRole("button", { name: "Create workspace" }).click();
      await page.waitForURL("**/workspaces/workspace-2");
      await page.goto("http://localhost:3000/workspaces", { waitUntil: "networkidle" });
    }
    if (width === 1440) await page.screenshot({ path: "preview/library-1440.png", fullPage: true });
    await page.getByRole("textbox", { name: "Search workspaces" }).fill("Immunotherapy");
    await page.getByRole("link", { name: /Immunotherapy papers/ }).click();
    await page.waitForURL("**/workspaces/workspace-1");
    await page.getByRole("button", { name: "Switch workspace" }).waitFor();
    await page.getByText("Ask about your sources").waitFor();
    if (width < 1024) {
      await page.getByRole("tab", { name: "Sources" }).click();
      await page.getByRole("button", { name: "Add", exact: true }).click();
      await page.getByRole("textbox", { name: "Source title" }).waitFor();
      await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
      await page.getByRole("tab", { name: "Artifacts" }).click();
      await page.getByRole("heading", { name: "Studio" }).waitFor();
      if (width === 768) {
        await page.getByRole("button", { name: "Open artifact" }).click();
        await page.getByRole("dialog").getByText("The first finding").waitFor();
        await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
      }
      await page.getByRole("tab", { name: "Ask" }).click();
    }
    if (width === 375 || width === 1440) await page.screenshot({ path: `preview/workspace-${width}.png`, fullPage: true });
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
      errors.push(`${width}px: workspace overflows horizontally`);
    }
    await page.close();
  }
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("Auth and workspace pages rendered without errors or overflow at 375, 768 and 1440px; workspace creation, panel switching, artifact viewing, and unauthenticated redirects passed.");
} finally {
  await browser.close();
}
