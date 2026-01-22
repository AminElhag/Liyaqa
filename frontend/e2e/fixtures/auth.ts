import { test as base, expect, Page } from "@playwright/test";

/**
 * Platform user credentials for E2E testing
 */
export interface TestUser {
  email: string;
  password: string;
  role: "PLATFORM_ADMIN" | "SALES_REP" | "SUPPORT_REP";
}

/**
 * Test users for different roles
 */
export const testUsers: Record<string, TestUser> = {
  platformAdmin: {
    email: process.env.TEST_PLATFORM_ADMIN_EMAIL || "admin@liyaqa.com",
    password: process.env.TEST_PLATFORM_ADMIN_PASSWORD || "Test1234!",
    role: "PLATFORM_ADMIN",
  },
  salesRep: {
    email: process.env.TEST_SALES_REP_EMAIL || "sales@liyaqa.com",
    password: process.env.TEST_SALES_REP_PASSWORD || "Test1234!",
    role: "SALES_REP",
  },
  supportRep: {
    email: process.env.TEST_SUPPORT_REP_EMAIL || "support@liyaqa.com",
    password: process.env.TEST_SUPPORT_REP_PASSWORD || "Test1234!",
    role: "SUPPORT_REP",
  },
};

/**
 * Authentication helper functions
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login as a platform user
   */
  async login(user: TestUser) {
    await this.page.goto("/en/platform-login");

    // Wait for the login form to be visible
    await this.page.waitForSelector('input[type="email"]');

    // Fill in credentials
    await this.page.fill('input[type="email"]', user.email);
    await this.page.fill('input[type="password"]', user.password);

    // Click login button
    await this.page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await this.page.waitForURL(/\/en\/platform-dashboard|\/ar\/platform-dashboard/);
  }

  /**
   * Logout from the platform
   */
  async logout() {
    // Click user menu
    await this.page.click('[data-testid="user-menu"]');

    // Click logout button
    await this.page.click('[data-testid="logout-button"]');

    // Wait for redirect to login
    await this.page.waitForURL(/\/platform-login/);
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Extended test fixture with auth helpers
 */
export const test = base.extend<{
  auth: AuthHelper;
  loginAsPlatformAdmin: () => Promise<void>;
  loginAsSalesRep: () => Promise<void>;
  loginAsSupportRep: () => Promise<void>;
}>({
  auth: async ({ page }, use) => {
    const auth = new AuthHelper(page);
    await use(auth);
  },

  loginAsPlatformAdmin: async ({ auth }, use) => {
    await use(async () => {
      await auth.login(testUsers.platformAdmin);
    });
  },

  loginAsSalesRep: async ({ auth }, use) => {
    await use(async () => {
      await auth.login(testUsers.salesRep);
    });
  },

  loginAsSupportRep: async ({ auth }, use) => {
    await use(async () => {
      await auth.login(testUsers.supportRep);
    });
  },
});

export { expect };
