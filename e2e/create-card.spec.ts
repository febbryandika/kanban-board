import { test, expect } from "@playwright/test";

import {
  addCard,
  columnLocator,
  createBoard,
  uniqueName,
} from "./helpers/factories";

test("a member can add a card to a column", async ({ page }) => {
  await createBoard(page, uniqueName("Cards"));

  const title = uniqueName("Buy milk");
  await addCard(page, "To Do", title);

  await expect(
    columnLocator(page, "To Do").locator(`[data-card-title="${title}"]`),
  ).toBeVisible();
});
