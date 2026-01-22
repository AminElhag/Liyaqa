import { test as setup, expect } from "@playwright/test";
import { testUsers } from "./fixtures/auth";

const AUTH_FILE = "e2e/.auth/platform-admin.json";

/**
 * Setup authentication state for tests.
 * This runs before all other tests and saves the authenticated state.
 */
setup("authenticate as platform admin", async ({ page }) => {
  // Navigate to platform login
  await page.goto("/en/platform-login");

  // Fill in credentials
  await page.fill('input[type="email"]', testUsers.platformAdmin.email);
  await page.fill('input[type="password"]', testUsers.platformAdmin.password);

  // Submit login form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/platform-dashboard/, { timeout: 30000 });

  // Verify we're logged in
  await expect(page).toHaveURL(/\/platform-dashboard/);

  // Save authentication state
  await page.context().storageState({ path: AUTH_FILE });
});

/**
 * Setup authentication for sales rep
 */
setup("authenticate as sales rep", async ({ page }) => {
  const authFile = "e2e/.auth/sales-rep.json";

  await page.goto("/en/platform-login");
  await page.fill('input[type="email"]', testUsers.salesRep.email);
  await page.fill('input[type="password"]', testUsers.salesRep.password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/platform-dashboard/, { timeout: 30000 });
  await page.context().storageState({ path: authFile });
});

/**
 * Setup authentication for support rep
 */
setup("authenticate as support rep", async ({ page }) => {
  const authFile = "e2e/.auth/support-rep.json";

  await page.goto("/en/platform-login");
  await page.fill('input[type="email"]', testUsers.supportRep.email);
  await page.fill('input[type="password"]', testUsers.supportRep.password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/platform-dashboard/, { timeout: 30000 });
  await page.context().storageState({ path: authFile });
});
