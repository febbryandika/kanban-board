import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { createBoard, signUp, uniqueName, uniqueUser } from "./helpers/factories";

const authFile = "e2e/.auth/user.json";
const otherFile = "e2e/.auth/other.json";

/** Sign up the primary user once and persist its session for every other test. */
setup("authenticate primary user", async ({ page }) => {
  const user = uniqueUser();
  await signUp(page, user);
  await expect(page).toHaveURL(/\/boards$/);
  await page.context().storageState({ path: authFile });
});

/**
 * Seed a board owned by a *different* user so the unauthorized test has a board
 * the primary user is not a member of. That user's session is discarded; only
 * the board id is written to disk.
 */
setup("seed a board owned by another user", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  try {
    await signUp(page, uniqueUser());
    const url = await createBoard(page, uniqueName("Other Board"));
    const boardId = url.split("/board/")[1];
    fs.mkdirSync(path.dirname(otherFile), { recursive: true });
    fs.writeFileSync(otherFile, JSON.stringify({ boardId, url }));
  } finally {
    await context.close();
  }
});
