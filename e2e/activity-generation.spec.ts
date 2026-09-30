import { test, expect } from "@playwright/test";

/**
 * User use case: turning a stored activity into a playable file.
 *
 * The first test drives the builder in the browser and catches the download.
 * The second checks the file the server produced actually contains the
 * stored activity, which is what proves the output is built from the
 * database rather than from whatever is on screen.
 */

test("a saved Wordle can be generated from the builder", async ({ page }) => {
  await page.goto("/wordle");
  await expect(page.getByRole("heading", { name: "Saved Wordle activities" })).toBeVisible();

  await page.getByRole("button", { name: "Load" }).first().click();
  await expect(page.getByText(/Saved as activity #/)).toBeVisible();

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Generate HTML" }).click(),
  ]).then(([d]) => d);

  expect(download.suggestedFilename()).toMatch(/\.html$/);
});

test("the generated file is built from the stored activity", async ({ request }) => {
  const listResponse = await request.get("/api/activities?type=WORDLE");
  expect(listResponse.ok()).toBeTruthy();
  const activities = await listResponse.json();
  expect(activities.length).toBeGreaterThan(0);

  const activity = activities[0];
  const generated = await request.get(`/api/activities/${activity.id}/generate?inline=1`);
  expect(generated.status()).toBe(200);

  const html = await generated.text();
  expect(html).toContain("<!DOCTYPE html>");
  expect(html).toContain(activity.title);
  // The words stored against the activity appear in the playable file.
  expect(html).toContain(activity.words[0].english);
});

test("a broken activity reports a clear error instead of a crash", async ({ request }) => {
  const missing = await request.get("/api/activities/999999/generate");
  expect(missing.status()).toBe(404);
  const body = await missing.json();
  expect(body.error).toMatch(/not found/i);
});
