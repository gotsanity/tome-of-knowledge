import { test, expect } from "@playwright/test";

test.describe("table of contents accordion", () => {
  test("first section is open by default; others are closed", async ({
    page,
  }) => {
    await page.goto("/contents");

    const buttons = page.locator(
      '[data-contents-section] button[aria-expanded]',
    );
    const count = await buttons.count();
    expect(count).toBeGreaterThan(1);

    await expect(buttons.nth(0)).toHaveAttribute("aria-expanded", "true");
    await expect(buttons.nth(1)).toHaveAttribute("aria-expanded", "false");
  });

  test("clicking another section opens it and closes the previous one", async ({
    page,
  }) => {
    await page.goto("/contents");

    const buttons = page.locator(
      '[data-contents-section] button[aria-expanded]',
    );
    await buttons.nth(1).click();

    await expect(buttons.nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(buttons.nth(0)).toHaveAttribute("aria-expanded", "false");
  });

  test("only one section is ever open at a time", async ({ page }) => {
    await page.goto("/contents");

    const buttons = page.locator(
      '[data-contents-section] button[aria-expanded]',
    );
    const count = await buttons.count();

    // Click through each section and verify exactly one is expanded.
    for (let i = 0; i < count; i++) {
      await buttons.nth(i).click();
      // Give the animation a moment to settle — state flips synchronously
      // but the test should not race animation frames.
      await page.waitForTimeout(50);
      const expandedCount = await page
        .locator('[data-contents-section] button[aria-expanded="true"]')
        .count();
      expect(expandedCount).toBe(1);
    }
  });
});
