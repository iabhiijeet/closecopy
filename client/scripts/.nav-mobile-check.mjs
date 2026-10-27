import { chromium } from "@playwright/test";

const email = process.argv[2];
const password = process.argv[3];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const events = [];

page.on("pageerror", (error) => events.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") events.push(`console: ${message.text()}`);
});

async function report(label) {
  const url = page.url();
  const sheetOpen = await page.locator('[role="dialog"]').isVisible().catch(() => false);
  console.log(JSON.stringify({ label, url, sheetOpen }, null, 2));
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
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.waitForTimeout(500);
  await report("menu-open");
  console.log("MENU_HTML", await page.locator('[role="dialog"]').first().evaluate((el) => el.outerHTML));

  const signIn = page.getByRole("link", { name: "Sign in", exact: true });
  console.log("SIGNIN_COUNT", await signIn.count());
  if (await signIn.count()) {
    await signIn.first().click();
    await page.waitForTimeout(3000);
    await report("after-mobile-signin-click");
  }

  if (!page.url().includes("/workspaces")) {
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.waitForTimeout(500);
    const getStarted = page.getByRole("link", { name: /Get started/i });
    console.log("GETSTARTED_COUNT", await getStarted.count());
    if (await getStarted.count()) {
      await getStarted.first().click();
      await page.waitForTimeout(3000);
      await report("after-mobile-get-started-click");
    }
  }

  console.log(JSON.stringify({ events }, null, 2));
} finally {
  await browser.close();
}
