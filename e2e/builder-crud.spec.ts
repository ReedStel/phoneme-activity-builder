import { test, expect } from "@playwright/test";

/**
 * Builder use case: a teacher manages a word list.
 *
 * This walks the whole CRUD cycle through the interface, including the
 * server rejecting a duplicate, and checks the data is still there after a
 * reload (so it is coming from the database, not from React state).
 */
test("a teacher can create, read, update and delete a word list", async ({ page }) => {
  const listName = `Playwright list ${Date.now().toString().slice(-6)}`;
  const key = {
    ch: "/tʃ/ CH (as in chin)",
    i: "/ɪ/ I (as in bid)",
    n: "/n/ N (as in nose)",
    s: "/s/ S (as in sun)",
  };

  await page.goto("/word-lists");

  // CREATE the list
  await page.getByRole("button", { name: "+ New list" }).click();
  await page.getByLabel("List name").fill(listName);
  await page.getByRole("button", { name: "Create list" }).click();
  await expect(page.getByRole("heading", { name: listName })).toBeVisible();

  // CREATE a word with the phoneme keyboard
  await page.getByLabel(/English spelling/).fill("chin");
  for (const name of [key.ch, key.i, key.n]) {
    await page.getByRole("button", { name }).click();
  }
  await page.getByRole("button", { name: "Add word", exact: true }).click();
  await expect(page.getByRole("cell", { name: "chin", exact: true })).toBeVisible();

  // The server refuses a duplicate spelling and says why
  await page.getByLabel(/English spelling/).fill("chin");
  for (const name of [key.ch, key.i, key.n]) {
    await page.getByRole("button", { name }).click();
  }
  await page.getByRole("button", { name: "Add word", exact: true }).click();
  await expect(page.getByText(/already/i).first()).toBeVisible();

  // UPDATE the word: chin becomes chins
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel(/English spelling/).fill("chins");
  await page.getByRole("button", { name: key.s }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("cell", { name: "chins", exact: true })).toBeVisible();

  // READ it back from the database after a full reload
  await page.reload();
  await page.getByRole("button", { name: listName }).click();
  await expect(page.getByRole("cell", { name: "chins", exact: true })).toBeVisible();

  // DELETE the word
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByRole("cell", { name: "chins", exact: true })).toHaveCount(0);

  // DELETE the list, leaving the database as it was found
  await page.getByRole("button", { name: "Delete list" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByRole("heading", { name: listName })).toHaveCount(0);
});
