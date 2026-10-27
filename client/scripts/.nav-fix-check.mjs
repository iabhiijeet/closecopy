import { chromium } from "@playwright/test";

const email = process.argv[2];
const password = process.argv[3];
const browser = await chromium.launch({ headless: true });
const results = [];

async function homeState(page, label) {
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  results.push({
    label,
    url: page.url(),
    dashboardLinks: await page.locator('header a[href="/workspaces"]:visible').count(),
    signInLinks: await page.locator('header a[href="/login"]:visible').count(),
    registerLinks: await page.locator('header a[href="/register"]:visible').count(),
    logoHref: await page.locator("header a").first().getAttribute("href"),
  });
}

try {
  const loggedOut = await browser.newContext();
  const loggedOutPage = await loggedOut.newPage();
  await homeState(loggedOutPage, "logged-out-desktop");
  await loggedOut.close();

  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await desktop.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/workspaces", { timeout: 30000 });

  await homeState(page, "logged-in-desktop");
  await page.locator('header a[href="/workspaces"]:visible').first().click();
  await page.waitForURL("**/workspaces", { timeout: 30000 });
  results.push({ label: "dashboard-click", url: page.url() });

  await homeState(page, "logged-in-desktop-again");
  await page.locator('header a[aria-label="Go to dashboard"]').click();
  await page.waitForURL("**/workspaces", { timeout: 30000 });
  results.push({ label: "logo-click", url: page.url() });
  results.push({ label: "desktop-errors", errors });

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  const mobileErrors = [];
  mobilePage.on("pageerror", (error) => mobileErrors.push(`pageerror: ${error.message}`));
  mobilePage.on("console", (message) => {
    if (message.type() === "error") mobileErrors.push(`console: ${message.text()}`);
  });
  await mobilePage.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await mobilePage.getByRole("textbox", { name: "Email" }).fill(email);
  await mobilePage.getByLabel("Password").fill(password);
  await mobilePage.getByRole("button", { name: "Sign in", exact: true }).click();
  await mobilePage.waitForURL("**/workspaces", { timeout: 30000 });
  await mobilePage.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await mobilePage.getByRole("button", { name: "Open navigation" }).click();
  await mobilePage.waitForTimeout(500);
  const mobileDashboard = mobilePage.getByRole("link", { name: /Dashboard/i });
  results.push({
    label: "logged-in-mobile",
    dashboardLinks: await mobileDashboard.count(),
    signInLinks: await mobilePage.getByRole("link", { name: "Sign in", exact: true }).count(),
    registerLinks: await mobilePage.getByRole("link", { name: /Get started/i }).count(),
  });
  await mobileDashboard.first().click();
  await mobilePage.waitForURL("**/workspaces", { timeout: 30000 });
  results.push({ label: "mobile-dashboard-click", url: mobilePage.url() });
  results.push({ label: "mobile-errors", errors: mobileErrors });
  await mobile.close();

  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
