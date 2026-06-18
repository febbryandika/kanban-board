import { test, expect } from "@playwright/test";

import { columnLocator, createBoard, uniqueName } from "./helpers/factories";

// Mock the AI route so the test is deterministic and needs no OpenAI key/quota.
const generated = {
  title: "Set up CI pipeline",
  description: "Automate linting, type-checking and tests on every push.",
  acceptanceCriteria: ["Runs on pull requests", "Fails on lint errors"],
};

test("the AI generator pre-fills the card form for review", async ({ page }) => {
  await page.route("**/api/ai/card-generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(generated),
    });
  });

  await createBoard(page, uniqueName("AI"));

  const column = columnLocator(page, "To Do");
  await column.getByRole("button", { name: "Add a card" }).click();
  await column.getByTestId("card-title-input").fill("rough idea about ci");
  await column.getByRole("button", { name: "Generate" }).click();

  // Title is replaced with the generated one...
  await expect(column.getByTestId("card-title-input")).toHaveValue(
    generated.title,
  );
  // ...and the description is pre-filled with the AI text + the AC checklist.
  const description = column.getByTestId("card-description-input");
  await expect(description).toBeVisible();
  await expect(description).toHaveValue(/Automate linting/);
  await expect(description).toHaveValue(/Runs on pull requests/);
});
