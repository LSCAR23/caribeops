import { expect, test } from "@playwright/test";

// Spec's user flow, read-only after login (D6-26): login → dashboard →
// businesses → business details. Needs a provisioned account in the
// dev DB (one-liner in the plan); the spec itself mutates nothing.
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test("login transitions through dashboard and businesses to a detail page", async ({
  page,
}) => {
  test.skip(!email || !password, "E2E_EMAIL and E2E_PASSWORD are required");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email as string);
  await page.getByLabel("Password").fill(password as string);
  await page.getByRole("button", { name: "Log in" }).click();

  // 1–2. Authenticated area: the dashboard renders its Laravel card.
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "Tourism Operations & Analytics" }),
  ).toBeVisible();

  // 3. Businesses list shows seeded rows.
  // Scoped to the Primary nav: since D7-01 the dashboard also has the hero
  // "View businesses" CTA and the "What data is available" inline link, and
  // getByRole name matching is case-insensitive substring — the unscoped
  // locator resolved to 3 elements (strict-mode violation). The contract
  // stays "the Businesses nav link"; only the scope got precise.
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Businesses" })
    .click();
  await expect(page).toHaveURL("/businesses");
  const firstLink = page.getByRole("listitem").first().getByRole("link");
  await expect(firstLink).toBeVisible();
  const businessName = ((await firstLink.textContent()) ?? "").trim();

  // 4. Detail page for that business with its reviews section.
  await firstLink.click();
  await expect(page).toHaveURL(/\/businesses\/.+/);
  await expect(
    page.getByRole("heading", { name: businessName }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Reviews \(\d+\)/ }),
  ).toBeVisible();
});
