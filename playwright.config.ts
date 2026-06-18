import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration. Tests run locally (and on demand) against a dev server;
 * CI stays lightweight (lint · typecheck · Vitest) and does not run this suite.
 *
 * A `setup` project signs up the primary user once and saves its session to
 * `e2e/.auth/user.json`; every real test reuses that storageState so we never
 * re-authenticate (which would trip Better Auth's sign-in rate limit).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Generous timeouts absorb Next dev's on-demand route compilation on first hit.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    navigationTimeout: 30_000,
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
