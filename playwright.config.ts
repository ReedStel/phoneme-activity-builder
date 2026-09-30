import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests (Assessment 3).
 *
 * The tests run against a real server and a real database, so they are kept
 * sequential: the builder test creates, edits and deletes its own list, and
 * parallel writes to one SQLite file would make the results unreliable.
 *
 * Run with:  npm run test:e2e        (starts the dev server if needed)
 *            npm run test:e2e:report (opens the HTML report)
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "reports/playwright" }]],
  outputDir: "reports/playwright-artifacts",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/health",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
