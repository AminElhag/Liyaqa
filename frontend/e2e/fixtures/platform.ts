import { test as base, expect, Page, Locator } from "@playwright/test";
import { AuthHelper, testUsers } from "./auth";

/**
 * Common platform selectors
 */
export const selectors = {
  // Navigation
  sidebar: '[data-testid="platform-sidebar"]',
  sidebarNav: (name: string) => `[data-testid="nav-${name}"]`,
  breadcrumb: '[data-testid="breadcrumb"]',

  // Loading states
  loadingOverlay: ".loading-overlay",
  skeleton: '[data-testid="skeleton"]',
  spinner: '[data-testid="spinner"]',

  // Tables
  dataTable: '[data-testid="data-table"]',
  tableRow: "tbody tr",
  tableSearch: '[data-testid="table-search"]',
  tableFilter: '[data-testid="table-filter"]',
  tablePagination: '[data-testid="pagination"]',

  // Forms
  formSubmit: 'button[type="submit"]',
  formCancel: '[data-testid="cancel-button"]',
  formError: '[data-testid="form-error"]',

  // Dialogs
  dialog: '[role="dialog"]',
  dialogClose: '[data-testid="dialog-close"]',
  confirmDialog: '[data-testid="confirm-dialog"]',
  confirmButton: '[data-testid="confirm-button"]',

  // Cards
  statCard: '[data-testid="stat-card"]',
  card: '[data-testid="card"]',

  // Toast notifications
  toast: '[data-testid="toast"]',
  toastSuccess: '[data-testid="toast-success"]',
  toastError: '[data-testid="toast-error"]',

  // Theme
  themeToggle: '[data-testid="theme-toggle"]',
};

/**
 * Platform-specific helper functions
 */
export class PlatformHelper {
  constructor(private page: Page) {}

  /**
   * Wait for page to fully load (no skeletons or loading states)
   */
  async waitForPageLoad() {
    // Wait for any loading overlay to disappear
    await this.page.waitForSelector(selectors.loadingOverlay, { state: "hidden", timeout: 10000 }).catch(() => {});

    // Wait for skeletons to be replaced with content
    const skeletons = this.page.locator(selectors.skeleton);
    if ((await skeletons.count()) > 0) {
      await skeletons.first().waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    }

    // Wait for network to be idle
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Navigate to a platform page
   */
  async navigateTo(path: string) {
    await this.page.goto(`/en${path}`);
    await this.waitForPageLoad();
  }

  /**
   * Search in data table
   */
  async searchTable(query: string) {
    const searchInput = this.page.locator(selectors.tableSearch);
    await searchInput.fill(query);

    // Wait for debounced search to complete
    await this.page.waitForTimeout(400);
    await this.waitForPageLoad();
  }

  /**
   * Click a table row action
   */
  async clickRowAction(rowIndex: number, action: "view" | "edit" | "delete" | "activate" | "suspend") {
    const row = this.page.locator(selectors.tableRow).nth(rowIndex);
    const actionButton = row.locator(`[data-testid="action-${action}"]`);
    await actionButton.click();
  }

  /**
   * Get stat card value
   */
  async getStatCardValue(index: number): Promise<string> {
    const card = this.page.locator(selectors.statCard).nth(index);
    const value = card.locator(".text-2xl");
    return (await value.textContent()) ?? "";
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(type: "success" | "error" = "success") {
    const selector = type === "success" ? selectors.toastSuccess : selectors.toastError;
    await this.page.waitForSelector(selector, { timeout: 5000 });
  }

  /**
   * Confirm a dialog action
   */
  async confirmDialog() {
    await this.page.click(selectors.confirmButton);
  }

  /**
   * Toggle theme
   */
  async toggleTheme() {
    await this.page.click(selectors.themeToggle);
    await this.page.waitForTimeout(200); // Wait for theme transition
  }

  /**
   * Check if dark mode is active
   */
  async isDarkMode(): Promise<boolean> {
    const html = this.page.locator("html");
    const className = await html.getAttribute("class");
    return className?.includes("dark") ?? false;
  }

  /**
   * Get table row count
   */
  async getTableRowCount(): Promise<number> {
    const rows = this.page.locator(selectors.tableRow);
    return rows.count();
  }

  /**
   * Fill form field
   */
  async fillField(name: string, value: string) {
    const field = this.page.locator(`[name="${name}"]`);
    await field.fill(value);
  }

  /**
   * Select dropdown option
   */
  async selectOption(name: string, value: string) {
    await this.page.click(`[data-testid="select-${name}"]`);
    await this.page.click(`[data-value="${value}"]`);
  }

  /**
   * Submit form
   */
  async submitForm() {
    await this.page.click(selectors.formSubmit);
    await this.waitForPageLoad();
  }
}

/**
 * Extended test fixture with platform helpers
 */
export const test = base.extend<{
  platform: PlatformHelper;
  auth: AuthHelper;
}>({
  platform: async ({ page }, use) => {
    const platform = new PlatformHelper(page);
    await use(platform);
  },

  auth: async ({ page }, use) => {
    const auth = new AuthHelper(page);
    await use(auth);
  },
});

export { expect };
