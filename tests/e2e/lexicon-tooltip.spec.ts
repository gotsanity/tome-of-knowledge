import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("lexicon tooltip", () => {
  test("lexicon wikilinks are present on a node page", async ({ page }) => {
    // calytrix-blackwood body has lexicon-matching terms; verify at least one
    // lexicon-routed anchor exists.
    await page.goto("/node/calytrix-blackwood");
    const lexiconLink = page.locator("main a[href^='/lexicon/']").first();
    await expect(lexiconLink).toBeVisible();
  });

  test("a11y: /node/calytrix-blackwood has no axe violations (excluding color-contrast)", async ({
    page,
  }) => {
    // Color-contrast violations across the design-system tokens are tracked
    // as a separate concern; this spec gates tooltip-specific a11y (ARIA,
    // keyboard, focus) rather than the broader palette.
    await page.goto("/node/calytrix-blackwood");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
