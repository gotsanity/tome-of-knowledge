import { test, expect } from "@playwright/test";

async function firstCategoryType(page: import("@playwright/test").Page) {
  const handle = await page
    .locator('[data-testid^="sidenav-category-"]')
    .first()
    .getAttribute("data-testid");
  if (!handle) throw new Error("no sidebar categories rendered");
  return handle.replace("sidenav-category-", "");
}

test.describe("sidebar table of contents", () => {
  test("sub-tree is hidden on non-contents pages", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('[data-testid^="sidenav-category-"]'),
    ).toHaveCount(0);
  });

  test("shows category sub-items when Contents is the active page", async ({
    page,
  }) => {
    await page.goto("/contents");
    const first = page.locator('[data-testid^="sidenav-category-"]').first();
    await expect(first).toBeVisible();
    const href = await first.getAttribute("href");
    expect(href).toMatch(/^\/contents#/);
  });

  test("clicking a category scrolls to the matching section", async ({
    page,
  }) => {
    await page.goto("/contents");
    const type = await firstCategoryType(page);
    await page.getByTestId(`sidenav-category-${type}`).click();
    await page.waitForURL(`**/contents#${type}`);
    const heading = page.locator(`section#${type}`);
    await expect(heading).toBeInViewport();
  });

  test("node page shows TOC expanded with current node marked active", async ({
    page,
  }) => {
    await page.goto("/contents");
    const firstNode = page.locator('[data-testid^="sidenav-node-"]').first();
    await page.locator('[data-testid^="sidenav-category-"]').first().scrollIntoViewIfNeeded();
    const slug = (await firstNode.getAttribute("data-testid"))?.replace(
      "sidenav-node-",
      "",
    );
    expect(slug).toBeTruthy();
    await page.goto(`/node/${slug}`);
    // Contents is the active top-level nav item on node pages
    await expect(page.locator('a[href="/contents"]')).toHaveClass(/text-primary/);
    // Subtree is visible and this node is the aria-current="page"
    const current = page.getByTestId(`sidenav-node-${slug}`);
    await expect(current).toBeVisible();
    await expect(current).toHaveAttribute("aria-current", "page");
  });

  test("clicking a nested node loads that node page", async ({ page }) => {
    await page.goto("/contents");
    const type = await firstCategoryType(page);
    await page.locator(`section#${type}`).scrollIntoViewIfNeeded();
    const firstNode = page.locator('[data-testid^="sidenav-node-"]').first();
    await expect(firstNode).toBeVisible();
    const slug = (await firstNode.getAttribute("data-testid"))?.replace(
      "sidenav-node-",
      "",
    );
    expect(slug).toBeTruthy();
    await firstNode.click();
    await page.waitForURL(`**/node/${slug}`);
  });

  test("collapse preference persists across reload for anonymous users", async ({
    page,
  }) => {
    await page.goto("/contents");
    await page.evaluate(() =>
      window.localStorage.removeItem("tome:nav:contents-expanded"),
    );
    await page.reload();
    const first = page.locator('[data-testid^="sidenav-category-"]').first();
    await expect(first).toBeVisible();
    await page.getByRole("button", { name: /hide index/i }).click();
    await expect(first).toBeHidden();
    await page.reload();
    await expect(
      page.locator('[data-testid^="sidenav-category-"]').first(),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: /show index/i }),
    ).toBeVisible();
  });
});
