/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 * - globalSetup: crea usuario y escribe e2e/.auth/user.json (requiere auth-service).
 * - Proyecto "chromium-guest": pruebas sin sesión (smoke, E02, E03).
 * - Proyecto "chromium-authenticated": E01 y flujos con sesión.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/results.json" }],
    [
      "./e2e/reporters/jest-json-reporter.ts",
      { outputFile: "test-results/playwright-results.json" },
    ],
  ],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      testMatch: "**/e2e/flows.spec.ts",
    },
    {
      name: "chromium-guest",
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
      },
      testMatch: "**/e2e/smoke.spec.ts",
    },
    {
      name: "chromium-guest-auth",
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
      },
      testMatch: "**/e2e/guest-auth.spec.ts",
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
