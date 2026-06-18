import { test, expect } from "@playwright/test";

import { signIn, signOut, signUp, uniqueUser } from "./helpers/factories";

// The login flow must run unauthenticated, so drop the shared session.
test.use({ storageState: { cookies: [], origins: [] } });

test("a user can sign up, sign out, and sign back in", async ({ page }) => {
  const user = uniqueUser();

  await signUp(page, user);
  await expect(page.getByRole("heading", { name: "Boards" })).toBeVisible();

  await signOut(page);
  await expect(page).toHaveURL(/\/login$/);

  await signIn(page, user);
  await expect(page).toHaveURL(/\/boards$/);
  await expect(page.getByRole("heading", { name: "Boards" })).toBeVisible();
});
