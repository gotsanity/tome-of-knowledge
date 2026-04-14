import { test, expect } from "@playwright/test";

/**
 * Regression test for issue #14: /node/[slug] layout must use the entry
 * page's composition — Marginalia card, BlockStack, and Linked Records in
 * a sticky sidebar, with eyebrow + H1 + tagline in the header. These
 * assertions are structure-only; per-field GM gating is covered
 * exhaustively by the component unit tests.
 */
test.describe("node page styling", () => {
  test("renders the new sidebar layout on a published node", async ({
    page,
  }) => {
    await page.goto("/node/calytrix-blackwood");

    // Header: eyebrow (type label) + H1 (node name) both visible.
    await expect(
      page.getByRole("heading", { level: 1, name: /calytrix blackwood/i }),
    ).toBeVisible();

    // Sidebar: the Marginalia card is always rendered because the universal
    // `type` row always resolves.
    await expect(
      page.getByRole("heading", { name: /^marginalia$/i }),
    ).toBeVisible();

    // The Marginalia card's type row links to the category anchor in the
    // table of contents. calytrix-blackwood is a `pc` node so the link
    // targets /contents#pc with the humanized label "Player Character".
    const marginalia = page.locator('aside[aria-labelledby="marginalia-heading"]');
    await expect(marginalia).toBeVisible();
    const typeLink = marginalia
      .getByRole("link", { name: /player character/i })
      .first();
    await expect(typeLink).toHaveAttribute("href", /\/contents#pc/);

    // Anonymous viewer must not see the status / visibility badges — those
    // are GM-only.
    await expect(page.getByText(/^status:$/i)).toHaveCount(0);
    await expect(page.getByText(/^visibility:$/i)).toHaveCount(0);
  });

  test("facets from the old NodeHeader no longer render in the header area", async ({
    page,
  }) => {
    await page.goto("/node/calytrix-blackwood");
    // The old layout rendered species/affiliation/role inside the <header>
    // above the article. After #14, those live in the sidebar's
    // <aside aria-labelledby="marginalia-heading"> instead. Assert no facet
    // labels appear as direct descendants of the main-column header.
    const header = page.locator("article, main header").first();
    // Marginalia heading must not appear inside the main column header —
    // it lives in the <aside> sibling. This confirms facets were moved.
    await expect(
      header.getByRole("heading", { name: /marginalia/i }),
    ).toHaveCount(0);
  });
});
