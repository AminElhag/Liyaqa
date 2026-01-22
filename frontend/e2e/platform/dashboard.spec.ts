import { test, expect } from "@playwright/test";
import { DashboardPage } from "../pages/dashboard.page";

test.describe("Platform Dashboard", () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.goto();
  });

  test.describe("Initial Load", () => {
    test("should display skeleton loading states initially", async ({ page }) => {
      // Navigate without waiting
      await page.goto("/en/platform-dashboard");

      // Should show skeletons immediately
      await dashboard.expectSkeletonLoading();
    });

    test("should load all dashboard components", async () => {
      await dashboard.waitForLoad();

      await dashboard.expectStatCardsVisible();
      await dashboard.expectChartsVisible();
      await dashboard.expectActivityFeedVisible();
    });

    test("should display page title", async () => {
      await dashboard.waitForLoad();
      await dashboard.expectTitle("en");
    });
  });

  test.describe("Stat Cards", () => {
    test("should display 4 stat cards", async () => {
      await dashboard.waitForLoad();
      await dashboard.expectStatCardsVisible();
    });

    test("should show numeric values in stat cards", async () => {
      await dashboard.waitForLoad();

      for (let i = 0; i < 4; i++) {
        const value = await dashboard.getStatValue(i);
        expect(value).toBeTruthy();
      }
    });

    test("should navigate to clients on clients card click", async ({ page }) => {
      await dashboard.waitForLoad();
      await dashboard.clickStatCard("clients");
      await expect(page).toHaveURL(/\/clients/);
    });

    test("should navigate to deals on deals card click", async ({ page }) => {
      await dashboard.waitForLoad();
      await dashboard.clickStatCard("deals");
      await expect(page).toHaveURL(/\/deals/);
    });
  });

  test.describe("Charts", () => {
    test("should render client growth chart", async () => {
      await dashboard.waitForLoad();
      await expect(dashboard.clientGrowthChart).toBeVisible();
    });

    test("should render revenue chart", async () => {
      await dashboard.waitForLoad();
      await expect(dashboard.revenueChart).toBeVisible();
    });
  });

  test.describe("Activity Feed", () => {
    test("should display recent activity", async () => {
      await dashboard.waitForLoad();
      await expect(dashboard.recentActivityFeed).toBeVisible();
    });
  });

  test.describe("Top Clients Table", () => {
    test("should display top clients table", async () => {
      await dashboard.waitForLoad();
      await expect(dashboard.topClientsTable).toBeVisible();
    });
  });

  test.describe("Responsiveness", () => {
    test("should adapt to mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Stat cards should still be visible
      await dashboard.expectStatCardsVisible();
    });

    test("should adapt to tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await dashboard.goto();
      await dashboard.waitForLoad();

      await dashboard.expectStatCardsVisible();
      await dashboard.expectChartsVisible();
    });
  });
});

test.describe("Dashboard RTL", () => {
  test("should render correctly in Arabic", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto("ar");
    await dashboard.waitForLoad();

    // Check page direction
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");

    // Check title
    await dashboard.expectTitle("ar");
  });
});
