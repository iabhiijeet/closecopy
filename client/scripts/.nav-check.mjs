import { chromium } from "@playwright/test";

const email = process.argv[2];
const password = process.argv[3];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const events = [];

page.on("pageerror", (error) => events.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") events.push(`console: ${message.text()}`);
});
page.on("response", (response) => {
  const url = response.url();
  if (url.includes("/api/auth/") || url.includes("/api/workspaces")) {
    events.push(`response: ${response.status()} ${url}`);
  }
});

async function report(label) {
  const alert = await page.getByRole("alert").textContent().catch(() => null);
  console.log(JSON.stringify({ label, url: page.url(), alert }, null, 2));
}

try {
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/workspaces", { timeout: 30000 });
  await report("after-login");

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await report("home");
  const header = await page.locator("header").first().evaluate((el) => el.outerHTML);
  console.log("HEADER_HTML", header);

  await page.locator('a[href="/login"]:visible').first().click();
  await page.waitForTimeout(3000);
  await report("after-home-signin-click");

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.locator('a[href="/register"]:visible').first().click();
  await page.waitForTimeout(3000);
  await report("after-home-get-started-click");

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.goBack({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await report("after-browser-back-from-home");

  console.log(JSON.stringify({ events }, null, 2));
} finally {
  await browser.close();
}
