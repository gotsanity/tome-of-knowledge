import { test, expect } from "@playwright/test";

const GM_USERNAME = process.env.GM_USERNAME ?? "";
const GM_PASSWORD = process.env.GM_PASSWORD ?? "";
const HAS_GM_CREDS = GM_USERNAME.length > 0 && GM_PASSWORD.length > 0;

test.describe("gm companion reveal", () => {
  test("anonymous user does not see the GM Notes panel on a node with a companion", async ({
    page,
  }) => {
    await page.goto("/node/calytrix-blackwood");
    await expect(
      page.getByRole("heading", { name: /GM Notes/i }),
    ).toHaveCount(0);
  });

  test("anonymous user hitting the companion slug directly gets a 404", async ({
    page,
  }) => {
    const response = await page.goto("/node/calytrix-blackwood-gm-notes");
    expect(response?.status()).toBe(404);
  });

  test.describe("as GM", () => {
    test.skip(
      !HAS_GM_CREDS,
      "GM_USERNAME and GM_PASSWORD env vars required for GM tests",
    );

    test("GM viewing the parent sees the GM Notes panel", async ({ page }) => {
      // Sign in via the credentials provider directly
      await page.goto("/api/auth/csrf");
      const csrfBody = await page.textContent("pre");
      const csrfToken = JSON.parse(csrfBody ?? "{}").csrfToken as string;

      await page.request.post("/api/auth/callback/credentials", {
        form: {
          username: GM_USERNAME,
          password: GM_PASSWORD,
          csrfToken,
          redirect: "false",
        },
      });

      await page.goto("/node/calytrix-blackwood");
      await expect(
        page.getByRole("heading", { name: /GM Notes/i }),
      ).toBeVisible();
      await expect(page.getByText(/Secrets/i).first()).toBeVisible();
    });

    test("GM hitting the companion slug directly gets the page", async ({
      page,
    }) => {
      await page.goto("/api/auth/csrf");
      const csrfBody = await page.textContent("pre");
      const csrfToken = JSON.parse(csrfBody ?? "{}").csrfToken as string;

      await page.request.post("/api/auth/callback/credentials", {
        form: {
          username: GM_USERNAME,
          password: GM_PASSWORD,
          csrfToken,
          redirect: "false",
        },
      });

      const response = await page.goto("/node/calytrix-blackwood-gm-notes");
      expect(response?.status()).toBe(200);
    });
  });
});
