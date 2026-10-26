import { chromium } from "@playwright/test";
import { expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.SMOKE_PORT || 3100);
const base = process.env.SMOKE_URL || "http://127.0.0.1:" + port;
let server;
let browser;
const runtimeErrors = [];
const externalRequests = [];
async function ready() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(base);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("Preview server did not start");
}
function watch(page) {
  page.on("pageerror", (e) => runtimeErrors.push(e.message));
  page.on("request", (r) => {
    if (!/^(http:\/\/(127\.0\.0\.1|localhost)|data:|blob:)/.test(r.url()))
      externalRequests.push(r.url());
  });
}
async function noOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
}
try {
  await mkdir(path.join(root, "preview"), { recursive: true });
  if (!process.env.SMOKE_URL) {
    server = spawn(
      process.execPath,
      [
        path.join(root, "node_modules/next/dist/bin/next"),
        "start",
        "--port",
        String(port),
      ],
      { cwd: root, windowsHide: true, stdio: "pipe" },
    );
    server.stdout.on("data", (b) => process.stdout.write(b));
    server.stderr.on("data", (b) => process.stderr.write(b));
  }
  await ready();
  browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  watch(desktop);
  await desktop.goto(base, { waitUntil: "networkidle" });
  await expect(desktop.getByRole("heading", { level: 1 })).toHaveAccessibleName(
    "Your knowledge, put to work.",
  );
  await expect(desktop.locator("body")).toHaveCSS(
    "background-color",
    "rgb(250, 248, 244)",
  );
  await desktop
    .getByRole("button", { name: "Toggle light and dark mode" })
    .first()
    .click();
  await expect(desktop.locator("body")).toHaveCSS(
    "background-color",
    "rgb(15, 20, 18)",
  );
  await desktop
    .getByRole("button", { name: "Toggle light and dark mode" })
    .first()
    .click();
  await expect(
    desktop
      .locator("#home")
      .getByText("Mind map · 6 connections", { exact: true }),
  ).toBeVisible({ timeout: 18000 });
  await noOverflow(desktop);
  await desktop.screenshot({
    path: path.join(root, "preview/closecopy-desktop.png"),
  });
  // All artifact types render and their Tabs remain keyboard accessible.
  const section = desktop.locator("#artifacts");
  await section.scrollIntoViewIfNeeded();
  const labels = [
    "Summary",
    "Study Guide",
    "Quiz",
    "Flashcards",
    "Mind Map",
    "Report",
    "Timeline",
    "Slide Outline",
  ];
  for (const label of labels) {
    await section.getByRole("tab", { name: label, exact: true }).click();
    await expect(section.getByRole("tabpanel")).toBeVisible();
    await expect(
      section.getByRole("tab", { name: label, exact: true }),
    ).toHaveAttribute("aria-selected", "true");
  }
  // Quiz: an incorrect answer, a correct answer, final score, and reset.
  await section.getByRole("tab", { name: "Quiz", exact: true }).click();
  await section
    .getByText("Waiting for a moment of inspiration", { exact: true })
    .click();
  await expect(section.getByRole("status")).toContainText("remember");
  await section.getByRole("button", { name: "Next question" }).click();
  await section
    .getByText("To get feedback before investing heavily", { exact: true })
    .click();
  await expect(section.getByRole("status")).toContainText("Exactly right");
  await section.getByRole("button", { name: "Next question" }).click();
  await section
    .getByText("Explore a variety of possibilities", { exact: true })
    .click();
  await section.getByRole("button", { name: "See your results" }).click();
  await expect(
    section.getByText("You got 2 of 3 right.", { exact: false }),
  ).toBeVisible();
  await section.getByRole("button", { name: "Try again" }).click();
  // Flashcard flip and carousel navigation.
  await section.getByRole("tab", { name: "Flashcards", exact: true }).click();
  await section
    .getByRole("button", { name: "Reveal answer", exact: true })
    .first()
    .click();
  await expect(
    section.getByRole("button", { name: "Show question", exact: true }).first(),
  ).toHaveAttribute("aria-pressed", "true");
  await section
    .getByRole("button", { name: "Next slide", exact: true })
    .click();
  // Keyboard movement updates a mind-map connector.
  await section.getByRole("tab", { name: "Mind Map", exact: true }).click();
  const node = section.getByRole("button", { name: /Collect\. Drag/ });
  await node.focus();
  const before = await section
    .locator('svg[viewBox="0 0 100 100"] path')
    .first()
    .getAttribute("d");
  await node.press("ArrowRight");
  await expect
    .poll(() =>
      section
        .locator('svg[viewBox="0 0 100 100"] path')
        .first()
        .getAttribute("d"),
    )
    .not.toBe(before);
  await expect(
    section.getByRole("button", { name: /Constraints\. Drag/ }).locator(".."),
  ).toHaveCSS("opacity", "1");
  await desktop.screenshot({
    path: path.join(root, "preview/closecopy-artifacts.png"),
  });
  // Source selection and mock generation.
  await section.getByRole("button", { name: "Generate", exact: true }).click();
  const dialog = desktop.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("checkbox").nth(2).uncheck();
  await dialog.getByRole("button", { name: "Timeline", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Create artifact", exact: true })
    .click();
  await expect(dialog).toBeHidden({ timeout: 10000 });
  await expect(
    section.getByRole("tab", { name: "Timeline", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  // Actual Markdown download.
  await section.getByRole("button", { name: "Export artifact" }).click();
  const downloadPromise = desktop.waitForEvent("download");
  await desktop.getByRole("menuitem", { name: /Markdown/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("closecopy-timeline.md");
  // Playground chat + generated quiz.
  const playground = desktop.locator("#playground");
  await playground.scrollIntoViewIfNeeded();
  await playground
    .getByRole("button", { name: "Summarize chapter 3", exact: false })
    .click();
  await expect(playground.getByRole("status")).toContainText("Sample answers", {
    timeout: 10000,
  });
  await expect(
    playground.getByText("Chapter 3 explores", { exact: false }),
  ).toBeVisible();
  await playground
    .getByRole("button", {
      name: "Make a quiz from these sources",
      exact: false,
    })
    .click();
  await expect(
    playground.getByRole("button", { name: "Open artifact" }),
  ).toBeVisible({ timeout: 10000 });
  await playground.getByRole("button", { name: "Open artifact" }).click();
  await expect(
    desktop
      .getByRole("dialog")
      .getByText("Which practice is most likely", { exact: false }),
  ).toBeVisible();
  await desktop
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  // Local file metadata appears; no backend/upload requests are allowed.
  await playground.getByLabel("Choose local demo sources").setInputFiles({
    name: "local-notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Local demo file."),
  });
  await expect(
    playground.getByText("local-notes.txt", { exact: true }),
  ).toBeVisible();
  // Billing switch, FAQ, and mock newsletter.
  const pricing = desktop.locator("#pricing");
  await pricing.getByRole("button", { name: /Yearly/ }).click();
  await expect(
    pricing.getByText("$180 billed annually", { exact: true }),
  ).toBeVisible();
  const faq = desktop.locator("#faq");
  await faq
    .getByRole("button", { name: "What is an artifact?", exact: true })
    .click();
  await expect(
    faq.getByText("An artifact is something", { exact: false }),
  ).toBeVisible();
  await desktop
    .getByLabel("Newsletter email address")
    .fill("curious@example.com");
  await desktop.getByRole("button", { name: "Join the newsletter" }).click();
  await expect(desktop.getByLabel("Newsletter email address")).toHaveValue("");
  // Capture the full page after interaction checks.
  for (const id of [
    "features",
    "artifacts",
    "how-it-works",
    "playground",
    "pricing",
    "faq",
  ]) {
    await desktop.locator("#" + id).scrollIntoViewIfNeeded();
    await desktop.waitForTimeout(700);
  }
  await desktop.screenshot({
    path: path.join(root, "preview/closecopy-full-page.png"),
    fullPage: true,
  });
  // Mobile + reduced-motion: drawer, tabs, generation-free instant chat, no overflow.
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  watch(mobile);
  await mobile.goto(base, { waitUntil: "networkidle" });
  await expect(mobile.getByRole("heading", { level: 1 })).toHaveCSS(
    "opacity",
    "1",
  );
  await mobile.waitForTimeout(1300);
  await noOverflow(mobile);
  await mobile.screenshot({
    path: path.join(root, "preview/closecopy-mobile.png"),
  });
  await mobile.getByRole("button", { name: "Open navigation" }).click();
  await expect(mobile.getByRole("dialog")).toBeVisible();
  await mobile
    .getByRole("dialog")
    .getByRole("link", { name: "Artifacts", exact: true })
    .click();
  await expect(mobile.getByRole("dialog")).toBeHidden();
  const mobileArtifacts = mobile.locator("#artifacts");
  await mobileArtifacts
    .getByRole("tab", { name: "Slide Outline", exact: true })
    .click();
  await noOverflow(mobile);
  const mobilePg = mobile.locator("#playground");
  await mobilePg.scrollIntoViewIfNeeded();
  await mobilePg.getByRole("tab", { name: "Sources", exact: true }).click();
  await expect(
    mobilePg.getByText("The Creative Mind.pdf", { exact: true }),
  ).toBeVisible();
  await mobilePg.getByRole("tab", { name: "Chat", exact: true }).click();
  await mobilePg
    .getByRole("button", {
      name: "Make a quiz from these sources",
      exact: false,
    })
    .click();
  await expect(mobilePg.getByRole("status")).toContainText("Sample answers", {
    timeout: 5000,
  });
  await mobilePg.getByRole("tab", { name: /Artifacts/ }).click();
  await expect(
    mobilePg.getByRole("button", { name: "Open artifact" }),
  ).toBeVisible();
  await mobile.screenshot({
    path: path.join(root, "preview/closecopy-mobile-playground.png"),
  });
  await noOverflow(mobile);
  await mobile.setViewportSize({ width: 320, height: 740 });
  await noOverflow(mobile);
  expect(runtimeErrors).toEqual([]);
  expect(externalRequests).toEqual([]);
  console.log(
    "PASS: desktop, mobile, reduced motion, all 8 artifacts, quiz score/reset, flashcards, connected mind-map movement, source-selection generation, Markdown export, streamed chat, local file picker, pricing, FAQ, newsletter, no overflow, no runtime errors, and no external/API requests.",
  );
} finally {
  await browser?.close();
  server?.kill();
}
