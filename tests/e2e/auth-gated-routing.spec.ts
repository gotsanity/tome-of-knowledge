import { test, expect } from "@playwright/test";

/**
 * Smoke test for /node/[slug] visibility gating.
 *
 * Assumes the dev server already has the fixture vault imported. Run:
 *   docker compose exec web npx tsx scripts/import-vault.ts --path tests/fixtures/vault
 *
 * before running this spec, or rely on a separate seeding fixture once
 * phase 5 wires one into playwright.config.ts.
 */
test.describe("auth-gated routing", () => {
  test("anonymous user sees a published node", async ({ page }) => {
    await page.goto("/node/fort-ashby");
    await expect(
      page.getByRole("heading", { name: /Fort Ashby/i }),
    ).toBeVisible();
  });

  test("anonymous user hitting a draft slug gets a 404", async ({ page }) => {
    const response = await page.goto("/node/hidden-revenant");
    expect(response?.status()).toBe(404);
  });

  test("anonymous user hitting a gm-only companion slug gets a 404", async ({
    page,
  }) => {
    const response = await page.goto("/node/fort-commander-gm-notes");
    expect(response?.status()).toBe(404);
  });

  test("anonymous user hitting a non-existent slug gets a 404", async ({
    page,
  }) => {
    const response = await page.goto("/node/does-not-exist-anywhere");
    expect(response?.status()).toBe(404);
  });
});
