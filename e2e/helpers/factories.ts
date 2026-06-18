import { expect, type Locator, type Page } from "@playwright/test";

export type TestUser = { name: string; email: string; password: string };

/**
 * A collision-free name. Tests share one account and the board list accumulates,
 * so names must be unique even across parallel workers/`--repeat-each` runs that
 * may execute in the same millisecond — hence the random suffix, not just a timestamp.
 */
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A fresh, collision-free user per run (unique email → no DB cleanup needed). */
export function uniqueUser(): TestUser {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    name: `E2E User ${token}`,
    email: `e2e+${token}@example.com`,
    password: "password1234",
  };
}

/** Sign up via the UI. Better Auth creates a session on success → lands on /boards. */
export async function signUp(page: Page, user: TestUser): Promise<void> {
  await page.goto("/signup");
  await page.locator("#name").fill(user.name);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/boards");
}

/** Sign in via the UI → lands on /boards. */
export async function signIn(page: Page, user: TestUser): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/boards");
}

/** Sign out from the boards page → lands on /login. */
export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login");
}

/** Create a board (seeds To Do / In Progress / Done) and open it. Returns the board URL. */
export async function createBoard(page: Page, name: string): Promise<string> {
  await page.goto("/boards");
  // The "New board" affordance is a Button rendered as a link → role "button".
  await page.getByRole("button", { name: "New board" }).click();
  await page.waitForURL("**/boards/new");
  await page.locator('input[name="name"]').fill(name);
  await page.getByRole("button", { name: "Create board" }).click();
  await page.waitForURL("**/boards");
  await page.getByRole("link", { name, exact: true }).click();
  await page.waitForURL(/\/board\/[^/]+$/);
  return page.url();
}

export function columnLocator(page: Page, columnName: string): Locator {
  return page.locator(
    `[data-testid="board-column"][data-column-name="${columnName}"]`,
  );
}

export function cardLocator(page: Page, title: string): Locator {
  return page.locator(`[data-testid="card"][data-card-title="${title}"]`);
}

/**
 * Add a card to a named column via that column's inline "Add a card" form.
 *
 * Creation is optimistic: the card first appears with a temporary id and only
 * gets its real id after the POST settles and the board refetches. We wait for
 * both so callers (notably the drag test) operate on a persisted card rather
 * than racing the temp → real swap.
 */
export async function addCard(
  page: Page,
  columnName: string,
  title: string,
): Promise<void> {
  const column = columnLocator(page, columnName);
  await column.getByRole("button", { name: "Add a card" }).click();
  await column.getByTestId("card-title-input").fill(title);

  const created = page.waitForResponse(
    (r) => r.url().endsWith("/api/cards") && r.request().method() === "POST",
  );
  const reconciled = page.waitForResponse(
    (r) => /\/api\/boards\//.test(r.url()) && r.request().method() === "GET",
  );
  await column.getByRole("button", { name: "Add card" }).click();
  await created;
  await reconciled;

  await expect(column.locator(`[data-card-title="${title}"]`)).toBeVisible();
}

/**
 * Drag a card into another column. dnd-kit's PointerSensor needs the pointer to
 * move past a 6px activation threshold and then track its way to the target, so
 * a single `dragTo` won't do — we drive the mouse manually in steps and wait for
 * the optimistic PATCH /api/cards/:id to confirm the move was sent.
 */
export async function dragCardToColumn(
  page: Page,
  cardTitle: string,
  targetColumnName: string,
): Promise<void> {
  const cardBox = await cardLocator(page, cardTitle).boundingBox();
  const targetBox = await columnLocator(page, targetColumnName).boundingBox();
  if (!cardBox || !targetBox) {
    throw new Error("dragCardToColumn: could not resolve element boxes");
  }

  const start = {
    x: cardBox.x + cardBox.width / 2,
    y: cardBox.y + cardBox.height / 2,
  };
  const end = {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2,
  };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 12, start.y, { steps: 5 }); // cross activation threshold
  await page.mouse.move(end.x, end.y, { steps: 15 }); // glide to the target column
  await page.mouse.move(end.x, end.y); // settle

  const moved = page.waitForResponse(
    (r) => r.url().includes("/api/cards/") && r.request().method() === "PATCH",
  );
  await page.mouse.up();
  await moved;
}
