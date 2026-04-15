import { test, expect } from "@playwright/test";

test.describe("lexicon index page", () => {
  test("lists every lexicon term and links to its detail page", async ({
    page,
  }) => {
    await page.goto("/lexicon");

    await expect(
      page.getByRole("heading", { level: 1, name: /lexicon/i }),
    ).toBeVisible();

    const entries = page.locator("[data-lexicon-entry]");
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);

    // Every entry links to its slug page
    const href = await entries.first().getAttribute("href");
    expect(href).toMatch(/^\/lexicon\/[a-z0-9-]+/);
  });

  test("is reachable from any page via the sidebar", async ({ page }) => {
    for (const route of ["/", "/contents", "/scribe"]) {
      await page.goto(route);
      const sidebarLink = page.locator("aside a[href='/lexicon']").first();
      await expect(sidebarLink).toBeVisible();
    }
  });

  test("sidebar lexicon nav marks itself active on /lexicon", async ({
    page,
  }) => {
    await page.goto("/lexicon");
    const sidebarLink = page.locator("aside a[href='/lexicon']").first();
    await expect(sidebarLink).toHaveClass(/border-primary/);
  });
});
