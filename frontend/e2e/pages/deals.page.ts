import { Page, Locator, expect } from "@playwright/test";

/**
 * Page object for Deals/Pipeline management pages
 */
export class DealsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newDealButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly viewToggle: Locator;
  readonly tableView: Locator;
  readonly kanbanView: Locator;
  readonly dataTable: Locator;
  readonly tableRows: Locator;
  readonly kanbanBoard: Locator;
  readonly kanbanColumns: Locator;
  readonly kanbanCards: Locator;
  readonly statCards: Locator;
  readonly loadingSkeleton: Locator;
  readonly loadingOverlay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("h1");
    this.newDealButton = page.locator('[data-testid="new-deal-button"], a:has-text("New Deal")');
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="البحث"]');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.viewToggle = page.locator('[data-testid="view-toggle"]');
    this.tableView = page.locator('[data-testid="table-view"]');
    this.kanbanView = page.locator('[data-testid="kanban-view"]');
    this.dataTable = page.locator('[data-testid="data-table"], table');
    this.tableRows = page.locator("tbody tr");
    this.kanbanBoard = page.locator('[data-testid="kanban-board"]');
    this.kanbanColumns = page.locator('[data-testid="kanban-column"]');
    this.kanbanCards = page.locator('[data-testid="kanban-card"]');
    this.statCards = page.locator('[data-testid="stat-card"]');
    this.loadingSkeleton = page.locator('[data-testid="skeleton"]');
    this.loadingOverlay = page.locator(".loading-overlay");
  }

  /**
   * Navigate to deals list
   */
  async goto(locale: "en" | "ar" = "en") {
    await this.page.goto(`/${locale}/deals`);
  }

  /**
   * Wait for page to fully load
   */
  async waitForLoad() {
    await this.loadingSkeleton.first().waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Search for deals
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(400);
    await this.waitForLoad();
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: string) {
    await this.statusFilter.click();
    await this.page.click(`[data-value="${status}"]`);
    await this.waitForLoad();
  }

  /**
   * Switch to table view
   */
  async switchToTableView() {
    await this.tableView.click();
    await this.waitForLoad();
  }

  /**
   * Switch to kanban view
   */
  async switchToKanbanView() {
    await this.kanbanView.click();
    await this.waitForLoad();
  }

  /**
   * Click new deal button
   */
  async clickNewDeal() {
    await this.newDealButton.click();
    await this.page.waitForURL(/\/deals\/new/);
  }

  /**
   * View deal from table
   */
  async viewDeal(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    await row.locator('[data-testid="view-action"]').click();
    await this.page.waitForURL(/\/deals\/[^/]+$/);
  }

  /**
   * Get kanban column count
   */
  async getKanbanColumnCount(): Promise<number> {
    return this.kanbanColumns.count();
  }

  /**
   * Get cards in a kanban column
   */
  async getCardsInColumn(columnIndex: number): Promise<number> {
    const column = this.kanbanColumns.nth(columnIndex);
    return column.locator('[data-testid="kanban-card"]').count();
  }

  /**
   * Drag card to another column (stage change)
   */
  async dragCardToColumn(cardIndex: number, targetColumnIndex: number) {
    const card = this.kanbanCards.nth(cardIndex);
    const targetColumn = this.kanbanColumns.nth(targetColumnIndex);

    await card.dragTo(targetColumn);
    await this.page.waitForTimeout(500);
  }

  /**
   * Click on a kanban card to view
   */
  async clickKanbanCard(cardIndex: number) {
    await this.kanbanCards.nth(cardIndex).click();
    await this.page.waitForURL(/\/deals\/[^/]+$/);
  }

  /**
   * Advance deal to next stage
   */
  async advanceDeal(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    await row.locator('[data-testid="advance-action"]').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Convert deal to client
   */
  async convertDeal(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    await row.locator('[data-testid="convert-action"]').click();

    // Wait for convert dialog
    await this.page.waitForSelector('[role="dialog"]');
  }

  /**
   * Mark deal as lost
   */
  async loseDeal(rowIndex: number, reason: string) {
    const row = this.tableRows.nth(rowIndex);
    await row.locator('[data-testid="lose-action"]').click();

    // Fill in reason
    await this.page.fill('[name="reason"]', reason);
    await this.page.click('[data-testid="confirm-button"]');

    await this.page.waitForTimeout(500);
  }

  /**
   * Get row count in table view
   */
  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  /**
   * Verify stat cards are visible
   */
  async expectStatCardsVisible() {
    const count = await this.statCards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(this.statCards.nth(i)).toBeVisible();
    }
  }

  /**
   * Verify kanban board is visible
   */
  async expectKanbanVisible() {
    await expect(this.kanbanBoard).toBeVisible();
    const columns = await this.getKanbanColumnCount();
    expect(columns).toBeGreaterThan(0);
  }

  /**
   * Verify table is visible
   */
  async expectTableVisible() {
    await expect(this.dataTable).toBeVisible();
  }
}
