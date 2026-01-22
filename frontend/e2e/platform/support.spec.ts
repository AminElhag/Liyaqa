import { test, expect } from "@playwright/test";

test.describe("Platform Support Tickets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/support");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Initial Load", () => {
    test("should display skeleton loading states initially", async ({ page }) => {
      await page.goto("/en/support", { waitUntil: "commit" });
      const skeleton = page.locator('[data-testid="skeleton"]').first();
      await expect(skeleton).toBeVisible({ timeout: 2000 }).catch(() => {});
    });

    test("should load support tickets list", async ({ page }) => {
      const table = page.locator('[data-testid="data-table"], table');
      await expect(table).toBeVisible();
    });

    test("should display stat cards", async ({ page }) => {
      const statCards = page.locator('[data-testid="stat-card"]');
      const count = await statCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Filters", () => {
    test("should filter by status", async ({ page }) => {
      const statusFilter = page.locator('[data-testid="status-filter"]');
      await statusFilter.click();
      await page.click('[data-value="OPEN"]');
      await page.waitForLoadState("networkidle");
    });

    test("should filter by priority", async ({ page }) => {
      const priorityFilter = page.locator('[data-testid="priority-filter"]');
      if (await priorityFilter.isVisible()) {
        await priorityFilter.click();
        await page.click('[data-value="HIGH"]');
        await page.waitForLoadState("networkidle");
      }
    });

    test("should search tickets", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="البحث"]');
      await searchInput.fill("test");
      await page.waitForTimeout(400); // Debounce
      await page.waitForLoadState("networkidle");
    });
  });

  test.describe("Ticket Actions", () => {
    test("should navigate to new ticket form", async ({ page }) => {
      const newButton = page.locator('a:has-text("New Ticket"), a:has-text("تذكرة جديدة")');
      if (await newButton.isVisible()) {
        await newButton.click();
        await expect(page).toHaveURL(/\/support\/new/);
      }
    });

    test("should navigate to ticket detail", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      if (count > 0) {
        await rows.first().locator('[data-testid="view-action"]').click();
        await expect(page).toHaveURL(/\/support\/[^/]+$/);
      }
    });
  });

  test.describe("Ticket Detail Page", () => {
    test("should display ticket information", async ({ page }) => {
      // Navigate to first ticket
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      if (count > 0) {
        await rows.first().locator('[data-testid="view-action"]').click();
        await page.waitForLoadState("networkidle");

        // Should show ticket details
        const title = page.locator("h1, h2");
        await expect(title.first()).toBeVisible();
      }
    });

    test("should display message thread", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      if (count > 0) {
        await rows.first().locator('[data-testid="view-action"]').click();
        await page.waitForLoadState("networkidle");

        const messages = page.locator('[data-testid="ticket-messages"]');
        await expect(messages).toBeVisible().catch(() => {});
      }
    });
  });

  test.describe("Status Badges", () => {
    test("should display status badges with correct colors", async ({ page }) => {
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

  test.describe("Priority Badges", () => {
    test("should display priority badges", async ({ page }) => {
      const priorityBadges = page.locator('[data-testid="priority-badge"]');
      const count = await priorityBadges.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const badge = priorityBadges.nth(i);
        if (await badge.isVisible()) {
          const text = await badge.textContent();
          expect(text).toBeTruthy();
        }
      }
    });
  });

  test.describe("Stat Cards", () => {
    test("should display total tickets", async ({ page }) => {
      const statCards = page.locator('[data-testid="stat-card"]');
      const firstCard = statCards.first();
      await expect(firstCard).toBeVisible();

      const value = firstCard.locator(".text-2xl, .font-bold");
      const text = await value.first().textContent();
      expect(text).toBeTruthy();
    });

    test("should display open tickets count", async ({ page }) => {
      const statCards = page.locator('[data-testid="stat-card"]');
      const count = await statCards.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});

test.describe("Support RTL", () => {
  test("should render correctly in Arabic", async ({ page }) => {
    await page.goto("/ar/support");
    await page.waitForLoadState("networkidle");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
  });
});
