import { Page, Locator, expect } from "@playwright/test";

/**
 * Page object for Platform Dashboard page
 */
export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly statCards: Locator;
  readonly clientsCard: Locator;
  readonly revenueCard: Locator;
  readonly dealsCard: Locator;
  readonly healthCard: Locator;
  readonly clientGrowthChart: Locator;
  readonly revenueChart: Locator;
  readonly topClientsTable: Locator;
  readonly recentActivityFeed: Locator;
  readonly loadingSkeleton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("h1");
    this.statCards = page.locator('[data-testid="stat-card"]');
    this.clientsCard = page.locator('[data-testid="clients-stat"]');
    this.revenueCard = page.locator('[data-testid="revenue-stat"]');
    this.dealsCard = page.locator('[data-testid="deals-stat"]');
    this.healthCard = page.locator('[data-testid="health-stat"]');
    this.clientGrowthChart = page.locator('[data-testid="client-growth-chart"]');
    this.revenueChart = page.locator('[data-testid="revenue-chart"]');
    this.topClientsTable = page.locator('[data-testid="top-clients-table"]');
    this.recentActivityFeed = page.locator('[data-testid="recent-activity"]');
    this.loadingSkeleton = page.locator('[data-testid="skeleton"]');
  }

  /**
   * Navigate to dashboard
   */
  async goto(locale: "en" | "ar" = "en") {
    await this.page.goto(`/${locale}/platform-dashboard`);
  }

  /**
   * Wait for dashboard to fully load
   */
  async waitForLoad() {
    // Wait for skeletons to disappear
    await this.loadingSkeleton.first().waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Verify all stat cards are visible
   */
  async expectStatCardsVisible() {
    await expect(this.statCards).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(this.statCards.nth(i)).toBeVisible();
    }
  }

  /**
   * Get stat card value by index
   */
  async getStatValue(index: number): Promise<string> {
    const card = this.statCards.nth(index);
    const value = card.locator(".text-2xl");
    return (await value.textContent()) || "";
  }

  /**
   * Verify charts are rendered
   */
  async expectChartsVisible() {
    await expect(this.clientGrowthChart).toBeVisible();
    await expect(this.revenueChart).toBeVisible();
  }

  /**
   * Verify activity feed is visible
   */
  async expectActivityFeedVisible() {
    await expect(this.recentActivityFeed).toBeVisible();
  }

  /**
   * Click on a stat card to navigate
   */
  async clickStatCard(type: "clients" | "revenue" | "deals" | "health") {
    const card = this.page.locator(`[data-testid="${type}-stat"]`);
    await card.click();
  }

  /**
   * Verify skeleton loading state shows initially
   */
  async expectSkeletonLoading() {
    await expect(this.loadingSkeleton.first()).toBeVisible({ timeout: 2000 });
  }

  /**
   * Verify dashboard title based on locale
   */
  async expectTitle(locale: "en" | "ar") {
    const expectedTitle = locale === "ar" ? "لوحة التحكم" : "Dashboard";
    await expect(this.pageTitle).toContainText(expectedTitle);
  }
}
