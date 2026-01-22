import { Page, Locator, expect } from "@playwright/test";

/**
 * Page object for Platform Login page
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly languageToggle: Locator;
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password"]');
    this.languageToggle = page.locator('[data-testid="language-toggle"]');
    this.themeToggle = page.locator('[data-testid="theme-toggle"]');
  }

  /**
   * Navigate to login page
   */
  async goto(locale: "en" | "ar" = "en") {
    await this.page.goto(`/${locale}/platform-login`);
  }

  /**
   * Fill login form
   */
  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit login form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  /**
   * Verify error message is displayed
   */
  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  /**
   * Verify successful login redirect
   */
  async expectDashboardRedirect() {
    await this.page.waitForURL(/\/platform-dashboard/);
    await expect(this.page).toHaveURL(/\/platform-dashboard/);
  }

  /**
   * Switch language
   */
  async switchLanguage() {
    await this.languageToggle.click();
  }

  /**
   * Toggle theme
   */
  async toggleTheme() {
    await this.themeToggle.click();
  }

  /**
   * Navigate to forgot password
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }
}
