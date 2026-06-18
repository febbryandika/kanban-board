import { test, expect } from "@playwright/test";

import { columnLocator, createBoard, uniqueName } from "./helpers/factories";

test("a member can create a board and open it", async ({ page }) => {
  const name = uniqueName("Board");

  // createBoard finds the board's link in the list before opening it, so a
  // successful return already proves it appears on /boards.
  const url = await createBoard(page, name);
  expect(url).toMatch(/\/board\/[^/]+$/);

  await expect(page.getByRole("heading", { name })).toBeVisible();
  // Default columns are seeded on creation (SPEC §1).
  await expect(columnLocator(page, "To Do")).toBeVisible();
  await expect(columnLocator(page, "In Progress")).toBeVisible();
  await expect(columnLocator(page, "Done")).toBeVisible();
});
