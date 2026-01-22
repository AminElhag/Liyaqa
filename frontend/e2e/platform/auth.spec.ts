import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { testUsers } from "../fixtures/auth";

test.describe("Platform Authentication", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.describe("Login Flow", () => {
    test("should display login form", async () => {
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
    });

    test("should show error for invalid credentials", async () => {
      await loginPage.login("invalid@example.com", "wrongpassword");
      await loginPage.expectError();
    });

    test("should show error for empty fields", async () => {
      await loginPage.submit();
      // Form validation should prevent submission
      await expect(loginPage.page).toHaveURL(/\/platform-login/);
    });

    test("should login successfully with valid credentials", async () => {
      await loginPage.login(testUsers.platformAdmin.email, testUsers.platformAdmin.password);
      await loginPage.expectDashboardRedirect();
    });

    test("should redirect to dashboard if already authenticated", async ({ page }) => {
      // Login first
      await loginPage.login(testUsers.platformAdmin.email, testUsers.platformAdmin.password);
      await loginPage.expectDashboardRedirect();

      // Try to access login page again
      await page.goto("/en/platform-login");

      // Should redirect back to dashboard
      await expect(page).toHaveURL(/\/platform-dashboard/);
    });
  });

  test.describe("Logout Flow", () => {
    test("should logout successfully", async ({ page }) => {
      // Login first
      await loginPage.login(testUsers.platformAdmin.email, testUsers.platformAdmin.password);
      await loginPage.expectDashboardRedirect();

      // Click user menu and logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Should redirect to login
      await expect(page).toHaveURL(/\/platform-login/);
    });

    test("should clear session on logout", async ({ page }) => {
      // Login
      await loginPage.login(testUsers.platformAdmin.email, testUsers.platformAdmin.password);
      await loginPage.expectDashboardRedirect();

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Try to access protected page
      await page.goto("/en/clients");

      // Should redirect to login
      await expect(page).toHaveURL(/\/platform-login/);
    });
  });

  test.describe("Language Toggle", () => {
    test("should switch to Arabic locale", async ({ page }) => {
      await loginPage.switchLanguage();
      await expect(page).toHaveURL(/\/ar\/platform-login/);
    });
  });

  test.describe("Theme Toggle", () => {
    test("should toggle dark mode", async ({ page }) => {
      await loginPage.toggleTheme();
      const html = page.locator("html");
      await expect(html).toHaveClass(/dark/);
    });

    test("should persist theme preference", async ({ page }) => {
      // Toggle to dark mode
      await loginPage.toggleTheme();
      await expect(page.locator("html")).toHaveClass(/dark/);

      // Reload page
      await page.reload();

      // Should still be dark mode
      await expect(page.locator("html")).toHaveClass(/dark/);
    });
  });

  test.describe("Role-based Access", () => {
    test("sales rep should access deals page", async ({ page }) => {
      await loginPage.login(testUsers.salesRep.email, testUsers.salesRep.password);
      await page.goto("/en/deals");
      await expect(page).toHaveURL(/\/deals/);
    });

    test("support rep should access support page", async ({ page }) => {
      await loginPage.login(testUsers.supportRep.email, testUsers.supportRep.password);
      await page.goto("/en/support");
      await expect(page).toHaveURL(/\/support/);
    });
  });
});
