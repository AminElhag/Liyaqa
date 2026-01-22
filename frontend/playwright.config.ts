import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

/**
 * Playwright configuration for Liyaqa B2B Platform E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Limit parallel workers on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter configuration */
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["list"], ["github"]]
    : [["html", { open: "never" }], ["list"]],

  /* Global test timeout */
  timeout: 30000,

  /* Expect timeout */
  expect: {
    timeout: 5000,
  },

  /* Shared settings for all projects */
  use: {
    /* Base URL for the app */
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video on failure */
    video: "retain-on-failure",

    /* Default viewport */
    viewport: { width: 1280, height: 720 },

    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,

    /* Default locale */
    locale: "en-US",
  },

  /* Configure projects for different scenarios */
  projects: [
    /* Setup project for authentication */
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    /* Desktop Chrome tests - most common browser */
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/platform-admin.json",
      },
      dependencies: ["setup"],
    },

    /* Desktop Firefox tests */
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        storageState: "e2e/.auth/platform-admin.json",
      },
      dependencies: ["setup"],
    },

    /* Mobile viewport tests */
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        storageState: "e2e/.auth/platform-admin.json",
      },
      dependencies: ["setup"],
    },

    /* RTL (Arabic) locale tests */
    {
      name: "rtl",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/platform-admin.json",
        locale: "ar-SA",
      },
      dependencies: ["setup"],
      testMatch: /.*\.rtl\.spec\.ts/,
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
