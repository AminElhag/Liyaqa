import { Page, Locator, expect } from "@playwright/test";

/**
 * Page object for Clients list and management pages
 */
export class ClientsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newClientButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly dataTable: Locator;
  readonly tableRows: Locator;
  readonly statCards: Locator;
  readonly totalClientsCard: Locator;
  readonly activeClientsCard: Locator;
  readonly pendingClientsCard: Locator;
  readonly suspendedClientsCard: Locator;
  readonly loadingSkeleton: Locator;
  readonly loadingOverlay: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("h1");
    this.newClientButton = page.locator('[data-testid="new-client-button"], a:has-text("New Client")');
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="البحث"]');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.dataTable = page.locator('[data-testid="data-table"], table');
    this.tableRows = page.locator("tbody tr");
    this.statCards = page.locator('[data-testid="stat-card"]');
    this.totalClientsCard = this.statCards.nth(0);
    this.activeClientsCard = this.statCards.nth(1);
    this.pendingClientsCard = this.statCards.nth(2);
    this.suspendedClientsCard = this.statCards.nth(3);
    this.loadingSkeleton = page.locator('[data-testid="skeleton"]');
    this.loadingOverlay = page.locator(".loading-overlay");
    this.pagination = page.locator('[data-testid="pagination"]');
  }

  /**
   * Navigate to clients list
   */
  async goto(locale: "en" | "ar" = "en") {
    await this.page.goto(`/${locale}/clients`);
  }

  /**
   * Wait for page to fully load
   */
  async waitForLoad() {
    await this.loadingSkeleton.first().waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Search for clients
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounce
    await this.page.waitForTimeout(400);
    await this.waitForLoad();
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: "ALL" | "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED") {
    await this.statusFilter.click();
    await this.page.click(`[data-value="${status}"]`);
    await this.waitForLoad();
  }

  /**
   * Click new client button
   */
  async clickNewClient() {
    await this.newClientButton.click();
    await this.page.waitForURL(/\/clients\/new/);
  }

  /**
   * Click view on a table row
   */
  async viewClient(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    await row.locator('[data-testid="view-action"]').click();
    await this.page.waitForURL(/\/clients\/[^/]+$/);
  }

  /**
   * Click edit on a table row
   */
  async editClient(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    await row.locator('[data-testid="edit-action"]').click();
    await this.page.waitForURL(/\/clients\/[^/]+\/edit/);
  }

  /**
   * Activate a client
   */
  async activateClient(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    await row.locator('[data-testid="activate-action"]').click();

    // Confirm the action
    await this.page.click('[data-testid="confirm-button"]');

    // Wait for optimistic update
    await this.page.waitForTimeout(500);
  }

  /**
   * Suspend a client
   */
  async suspendClient(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    await row.locator('[data-testid="suspend-action"]').click();

    // Confirm the action
    await this.page.click('[data-testid="confirm-button"]');

    // Wait for optimistic update
    await this.page.waitForTimeout(500);
  }

  /**
   * Get row count
   */
  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  /**
   * Verify stat cards are visible
   */
  async expectStatCardsVisible() {
    await expect(this.totalClientsCard).toBeVisible();
    await expect(this.activeClientsCard).toBeVisible();
    await expect(this.pendingClientsCard).toBeVisible();
    await expect(this.suspendedClientsCard).toBeVisible();
  }

  /**
   * Get stat card value
   */
  async getStatValue(index: number): Promise<string> {
    const card = this.statCards.nth(index);
    const value = card.locator(".text-2xl, .font-bold");
    return (await value.first().textContent()) || "";
  }

  /**
   * Verify table is visible with data
   */
  async expectTableVisible() {
    await expect(this.dataTable).toBeVisible();
  }

  /**
   * Verify skeleton loading shows initially
   */
  async expectSkeletonLoading() {
    await expect(this.loadingSkeleton.first()).toBeVisible({ timeout: 2000 });
  }

  /**
   * Verify loading overlay during mutations
   */
  async expectLoadingOverlay() {
    await expect(this.loadingOverlay).toBeVisible({ timeout: 2000 });
  }

  /**
   * Get client name from row
   */
  async getClientName(rowIndex: number): Promise<string> {
    const row = this.tableRows.nth(rowIndex);
    const nameCell = row.locator("td").first();
    return (await nameCell.textContent()) || "";
  }

  /**
   * Get client status from row
   */
  async getClientStatus(rowIndex: number): Promise<string> {
    const row = this.tableRows.nth(rowIndex);
    const statusBadge = row.locator('[data-testid="status-badge"]');
    return (await statusBadge.textContent()) || "";
  }
}
