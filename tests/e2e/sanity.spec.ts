import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Tome of Knowledge/i);
});

test("Explore Records hero button routes to the Table of Contents", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /explore records/i }).click();
  await page.waitForURL("**/contents");
  await expect(page).toHaveURL(/\/contents$/);
});

test("Scroll to Descend anchor brings the Library section into view", async ({
  page,
}) => {
  await page.goto("/");
  const library = page.locator("section#library");
  await expect(library).not.toBeInViewport();
  await page.getByRole("link", { name: /scroll to the library section/i }).click();
  await expect(page).toHaveURL(/#library$/);
  await expect(library).toBeInViewport();
});
