import { test, expect } from "@playwright/test";
import fs from "node:fs";

type OtherBoard = { boardId: string; url: string };

function readOtherBoard(): OtherBoard {
  return JSON.parse(
    fs.readFileSync("e2e/.auth/other.json", "utf8"),
  ) as OtherBoard;
}

test.describe("non-member access", () => {
  test("a signed-in user cannot view a board they don't belong to", async ({
    page,
  }) => {
    const { boardId } = readOtherBoard();
    await page.goto(`/board/${boardId}`);

    // The board API returns 403 → the client shows the access-denied state.
    await expect(page.getByText(/don.t have access to this board/i)).toBeVisible();
  });
});

test.describe("unauthenticated access", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("an anonymous visitor is redirected to login", async ({ page }) => {
    await page.goto("/boards");
    await expect(page).toHaveURL(/\/login/);
  });
});
