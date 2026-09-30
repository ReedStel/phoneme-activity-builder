import { test, expect } from "@playwright/test";

/**
 * Observability: the dashboard reports what actually happened.
 *
 * Generating a file should increase the success counter, which shows the
 * whole loop working: the browser calls the API, the server records the
 * event in the database, and the dashboard reports it.
 *
 * Card labels are styled in capitals, so they are matched with a
 * case-insensitive pattern rather than the source text.
 */

test("the dashboard shows health, stored data and usage statistics", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Healthy", { exact: true })).toBeVisible();
  await expect(page.getByText(/files generated/i).first()).toBeVisible();
  await expect(page.getByText(/average time on page/i).first()).toBeVisible();
  await expect(page.getByText(/most used activity/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Activity over the last/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download CSV" })).toBeVisible();
});

test("/health returns 200 with database status", async ({ request }) => {
  const res = await request.get("/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.database).toBe("ok");
  expect(body.counts.activities).toBeGreaterThanOrEqual(0);
});

test("generating a file is counted by the dashboard", async ({ page, request }) => {
  const summaryUrl = "/api/metrics/summary?days=1";
  const before = await (await request.get(summaryUrl)).json();

  const activities = await (await request.get("/api/activities")).json();
  expect(activities.length).toBeGreaterThan(0);
  await request.get(`/api/activities/${activities[0].id}/generate?inline=1`);

  // The metric is written in the background, so give it a moment to land.
  await expect
    .poll(
      async () => {
        const now = await (await request.get(summaryUrl)).json();
        return now.generation.success as number;
      },
      { timeout: 15_000, message: "the generation counter should increase" }
    )
    .toBeGreaterThan(before.generation.success);

  await page.goto("/dashboard");
  await expect(page.getByText(/files generated/i).first()).toBeVisible();
});
