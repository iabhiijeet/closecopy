import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  const forbidden = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) forbidden.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("http://localhost:3101", { waitUntil: "networkidle" });
  console.log(JSON.stringify({
    title: await page.title(),
    errors,
    forbidden,
    issueCount: await page.locator("nextjs-portal").count(),
    portalText: await page.locator("nextjs-portal").evaluateAll((elements) =>
      elements.map((element) => element.shadowRoot?.textContent?.slice(0, 300) ?? ""),
    ),
  }, null, 2));
} finally {
  await browser.close();
}
