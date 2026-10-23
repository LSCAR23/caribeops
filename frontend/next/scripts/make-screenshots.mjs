// Regenerates docs/screenshots/*.png from the running stack (UI redesign).
// Usage: node scripts/make-screenshots.mjs [baseUrl]
// Requires the stack up: next dev, Laravel :8000, Go :8080.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
// Three levels up: scripts/ -> next/ -> frontend/ -> repo root.
const OUT = fileURLToPath(new URL("../../../docs/screenshots/", import.meta.url));

// 1440x900 keeps the framing the README table used before.
const VIEWPORT = { width: 1440, height: 900 };

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: VIEWPORT });
const page = await context.newPage();

// --- Anonymous shot first, while we genuinely have no token -------------
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await settle(page);
await snap(page, "login.png");

// --- Sign in once, then reuse the authed context for the rest -----------
await page.getByLabel("Email").fill("test@example.com");
await page.getByLabel("Password").fill("password");
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL(`${BASE}/`, { timeout: 15000 });

// Dashboard: wait for a Go KPI card, which only renders once the analytics
// island has resolved (the shell paints first, cards stream in after).
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page
  .getByText("Total businesses", { exact: true })
  .waitFor({ timeout: 20000 });
await settle(page);
await snap(page, "dashboard.png");

// Business list: wait for the first seeded business link.
await page.goto(`${BASE}/businesses`, { waitUntil: "networkidle" });
await page.getByRole("listitem").first().waitFor({ timeout: 20000 });
await settle(page);
await snap(page, "business-list.png");

// Detail needs a real seeded id, so follow the first list link.
await page.getByRole("listitem").first().getByRole("link").first().click();
await page.waitForURL(/\/businesses\/[0-9a-f-]{36}/, { timeout: 15000 });
await page.getByRole("heading", { name: /Reviews \(\d+\)/ }).waitFor({
  timeout: 20000,
});
await settle(page);
await snap(page, "business-detail.png");

// Analytics is the slowest surface (four independent Go islands). Wait for
// the donut SVG — it only exists once the category island has resolved, so
// this can't be satisfied by a stale page or by the shell alone.
await page.goto(`${BASE}/analytics`, { waitUntil: "networkidle" });
await page
  .locator('svg[viewBox="0 0 120 120"]')
  .first()
  .waitFor({ timeout: 30000 })
  .catch(() => console.log("  (donut not seen; capturing anyway)"));
await settle(page);
// Full page: the four stacked panels exceed one viewport.
await page.screenshot({ path: `${OUT}analytics.png`, fullPage: true });
console.log("captured analytics.png");

await browser.close();

async function snap(page, name) {
  await page.screenshot({ path: `${OUT}${name}` });
  console.log(`captured ${name}`);
}

// Let entrance animations settle so the captured frame is the resting
// state, not a mid-transition: the animal "emerge" runs 2s after a
// 0.1s delay (anim-fade-up is ~450ms).
async function settle(page) {
  await page.waitForTimeout(2600);
}
