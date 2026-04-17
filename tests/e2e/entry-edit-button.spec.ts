import { test, expect } from "@playwright/test";

test.describe("entry page edit button", () => {
  test("edit button lives in the marginalia header, not a bottom-right fixed FAB", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/entry");

    const editLink = page.locator("a[aria-label='Edit this entry']");
    await expect(editLink).toBeVisible();

    // It must be inside the marginalia card, in the header row next to the
    // "Marginalia" heading — not a floating FAB anywhere else on the page.
    const marginaliaHeader = page
      .locator("h4", { hasText: "Marginalia" })
      .first();
    const container = marginaliaHeader.locator(
      "xpath=ancestor::*[self::div][1]",
    );
    await expect(container.locator("a[aria-label='Edit this entry']")).toHaveCount(
      1,
    );

    // And the old bottom-right FAB pattern must be gone.
    const fabs = await page
      .locator("a[aria-label='Edit this entry'].fixed")
      .count();
    expect(fabs).toBe(0);
  });

  test("edit button links to the subject-aware scribe route", async ({
    page,
  }) => {
    await page.goto("/entry");
    const editLink = page.locator("a[aria-label='Edit this entry']");
    const href = await editLink.getAttribute("href");
    // Shape: /scribe/<kind>/<slug>. The demo entry points to a node subject.
    expect(href).toMatch(/^\/scribe\/(node|page)\/[^/]+$/);
  });
});
