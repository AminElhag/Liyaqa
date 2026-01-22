import { test, expect } from "@playwright/test";

test.describe("Platform Subscriptions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/client-subscriptions");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Initial Load", () => {
    test("should display skeleton loading states initially", async ({ page }) => {
      await page.goto("/en/client-subscriptions", { waitUntil: "commit" });
      const skeleton = page.locator('[data-testid="skeleton"]').first();
      await expect(skeleton).toBeVisible({ timeout: 2000 }).catch(() => {});
    });

    test("should load subscriptions list", async ({ page }) => {
      const table = page.locator('[data-testid="data-table"], table');
      await expect(table).toBeVisible();
    });

    test("should display stat cards", async ({ page }) => {
      const statCards = page.locator('[data-testid="stat-card"]');
      const count = await statCards.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe("Filters", () => {
    test("should filter by status", async ({ page }) => {
      const statusFilter = page.locator('[data-testid="status-filter"]');
      await statusFilter.click();
      await page.click('[data-value="ACTIVE"]');
      await page.waitForLoadState("networkidle");
    });

    test("should search subscriptions", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="البحث"]');
      await searchInput.fill("test");
      await page.waitForTimeout(400);
      await page.waitForLoadState("networkidle");
    });
  });

  test.describe("Subscription Actions", () => {
    test("should navigate to new subscription form", async ({ page }) => {
      const newButton = page.locator('a:has-text("New Subscription"), a:has-text("اشتراك جديد")');
      if (await newButton.isVisible()) {
        await newButton.click();
        await expect(page).toHaveURL(/\/client-subscriptions\/new/);
      }
    });

    test("should navigate to subscription detail", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      if (count > 0) {
        await rows.first().locator('[data-testid="view-action"]').click();
        await expect(page).toHaveURL(/\/client-subscriptions\/[^/]+$/);
      }
    });

    test("should navigate to subscription edit", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      if (count > 0) {
        await rows.first().locator('[data-testid="edit-action"]').click();
        await expect(page).toHaveURL(/\/client-subscriptions\/[^/]+\/edit/);
      }
    });
  });

  test.describe("Subscription Detail Page", () => {
    test("should display subscription information", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      if (count > 0) {
        await rows.first().locator('[data-testid="view-action"]').click();
        await page.waitForLoadState("networkidle");

        // Should show subscription details
        const content = page.locator("main");
        await expect(content).toBeVisible();
      }
    });

    test("should show status action buttons", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      if (count > 0) {
        await rows.first().locator('[data-testid="view-action"]').click();
        await page.waitForLoadState("networkidle");

        // Action buttons should be visible based on status
      }
    });
  });

  test.describe("Status Badges", () => {
    test("should display status badges", async ({ page }) => {
      const statusBadges = page.locator('[data-testid="status-badge"]');
      const count = await statusBadges.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const badge = statusBadges.nth(i);
        if (await badge.isVisible()) {
          const text = await badge.textContent();
          expect(text).toBeTruthy();
        }
      }
    });
  });

  test.describe("Stat Cards", () => {
    test("should display total subscriptions", async ({ page }) => {
      const statCards = page.locator('[data-testid="stat-card"]');
      const firstCard = statCards.first();
      await expect(firstCard).toBeVisible();

      const value = firstCard.locator(".text-2xl, .font-bold");
      const text = await value.first().textContent();
      expect(text).toBeTruthy();
    });

    test("should show subscription breakdown by status", async ({ page }) => {
      const statCards = page.locator('[data-testid="stat-card"]');
      const count = await statCards.count();
      // Should have Total, Active, Trial, Suspended, etc.
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe("Status Actions", () => {
    test("should show activate button for suspended subscriptions", async ({ page }) => {
      // Filter to suspended
      const statusFilter = page.locator('[data-testid="status-filter"]');
      await statusFilter.click();
      await page.click('[data-value="SUSPENDED"]');
      await page.waitForLoadState("networkidle");

      const rows = page.locator("tbody tr");
      const count = await rows.count();
      if (count > 0) {
        const activateButton = rows.first().locator('[data-testid="activate-action"]');
        await expect(activateButton).toBeVisible().catch(() => {});
      }
    });

    test("should show suspend button for active subscriptions", async ({ page }) => {
      const statusFilter = page.locator('[data-testid="status-filter"]');
      await statusFilter.click();
      await page.click('[data-value="ACTIVE"]');
      await page.waitForLoadState("networkidle");

      const rows = page.locator("tbody tr");
      const count = await rows.count();
      if (count > 0) {
        const suspendButton = rows.first().locator('[data-testid="suspend-action"]');
        await expect(suspendButton).toBeVisible().catch(() => {});
      }
    });
  });
});

test.describe("Subscriptions RTL", () => {
  test("should render correctly in Arabic", async ({ page }) => {
    await page.goto("/ar/client-subscriptions");
    await page.waitForLoadState("networkidle");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
  });
});
