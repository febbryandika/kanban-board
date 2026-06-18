import { test, expect } from "@playwright/test";

import {
  addCard,
  columnLocator,
  createBoard,
  dragCardToColumn,
  uniqueName,
} from "./helpers/factories";

test("a card moved across columns persists after reload", async ({ page }) => {
  await createBoard(page, uniqueName("DnD"));

  const title = uniqueName("Ship it");
  await addCard(page, "To Do", title);

  await dragCardToColumn(page, title, "In Progress");

  // Optimistic: the card lands in "In Progress" immediately.
  await expect(
    columnLocator(page, "In Progress").locator(`[data-card-title="${title}"]`),
  ).toBeVisible();

  // Persisted: it stays there after a full reload (refetch from the server).
  await page.reload();
  await expect(
    columnLocator(page, "In Progress").locator(`[data-card-title="${title}"]`),
  ).toBeVisible();
  await expect(
    columnLocator(page, "To Do").locator(`[data-card-title="${title}"]`),
  ).toHaveCount(0);
});
