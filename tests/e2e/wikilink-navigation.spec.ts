import { test, expect } from "@playwright/test";

test.describe("wikilink navigation", () => {
  test("click a [[slug]] in body prose and land on /node/<slug>", async ({
    page,
  }) => {
    await page.goto("/node/fort-commander");
    const link = page.locator("main a[href='/node/fort-ashby']").first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL("**/node/fort-ashby");
    await expect(
      page.getByRole("heading", { name: /Fort Ashby/i }),
    ).toBeVisible();
  });

  test("a wikilink to an unknown slug routes to /node/<slug> and 404s", async ({
    page,
  }) => {
    // Happy path: navigation itself works. 404 content check covered elsewhere.
    const response = await page.goto("/node/definitely-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
