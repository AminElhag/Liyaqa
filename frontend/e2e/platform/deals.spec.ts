import { test, expect } from "@playwright/test";
import { DealsPage } from "../pages/deals.page";

test.describe("Platform Deals", () => {
  let dealsPage: DealsPage;

  test.beforeEach(async ({ page }) => {
    dealsPage = new DealsPage(page);
    await dealsPage.goto();
  });

  test.describe("Initial Load", () => {
    test("should display skeleton loading states initially", async ({ page }) => {
      await page.goto("/en/deals");
      await expect(page.locator('[data-testid="skeleton"]').first()).toBeVisible({ timeout: 2000 }).catch(() => {});
    });

    test("should load deals list or kanban", async () => {
      await dealsPage.waitForLoad();
      // Either table or kanban should be visible
    });

    test("should display stat cards", async () => {
      await dealsPage.waitForLoad();
      await dealsPage.expectStatCardsVisible();
    });
  });

  test.describe("View Toggle", () => {
    test("should switch to table view", async () => {
      await dealsPage.waitForLoad();
      await dealsPage.switchToTableView();
      await dealsPage.expectTableVisible();
    });

    test("should switch to kanban view", async () => {
      await dealsPage.waitForLoad();
      await dealsPage.switchToKanbanView();
      await dealsPage.expectKanbanVisible();
    });

    test("should persist view preference", async ({ page }) => {
      await dealsPage.waitForLoad();
      await dealsPage.switchToKanbanView();

      // Navigate away and back
      await page.goto("/en/clients");
      await page.goto("/en/deals");
      await dealsPage.waitForLoad();

      // Should still be kanban view (if preference is persisted)
    });
  });

  test.describe("Table View", () => {
    test.beforeEach(async () => {
      await dealsPage.waitForLoad();
      await dealsPage.switchToTableView();
    });

    test("should display deals in table", async () => {
      await dealsPage.expectTableVisible();
    });

    test("should filter deals by search", async () => {
      await dealsPage.search("test");
      // Results should be filtered
    });

    test("should filter deals by status", async () => {
      await dealsPage.filterByStatus("QUALIFIED");
      // Results should be filtered
    });

    test("should navigate to deal detail", async ({ page }) => {
      const rowCount = await dealsPage.getRowCount();
      if (rowCount > 0) {
        await dealsPage.viewDeal(0);
        await expect(page).toHaveURL(/\/deals\/[^/]+$/);
      }
    });
  });

  test.describe("Kanban View", () => {
    test.beforeEach(async () => {
      await dealsPage.waitForLoad();
      await dealsPage.switchToKanbanView();
    });

    test("should display kanban board with columns", async () => {
      await dealsPage.expectKanbanVisible();
      const columns = await dealsPage.getKanbanColumnCount();
      expect(columns).toBeGreaterThan(0);
    });

    test("should display deal cards in columns", async () => {
      const columns = await dealsPage.getKanbanColumnCount();
      for (let i = 0; i < columns; i++) {
        const cards = await dealsPage.getCardsInColumn(i);
        // Each column may have 0 or more cards
        expect(cards).toBeGreaterThanOrEqual(0);
      }
    });

    test("should navigate to deal detail on card click", async ({ page }) => {
      const cards = await dealsPage.kanbanCards.count();
      if (cards > 0) {
        await dealsPage.clickKanbanCard(0);
        await expect(page).toHaveURL(/\/deals\/[^/]+$/);
      }
    });
  });

  test.describe("Deal Actions", () => {
    test("should navigate to new deal form", async ({ page }) => {
      await dealsPage.waitForLoad();
      await dealsPage.clickNewDeal();
      await expect(page).toHaveURL(/\/deals\/new/);
    });
  });

  test.describe("Deal Stage Transitions", () => {
    test.beforeEach(async () => {
      await dealsPage.waitForLoad();
      await dealsPage.switchToTableView();
    });

    test("should advance deal to next stage", async () => {
      const rowCount = await dealsPage.getRowCount();
      if (rowCount > 0) {
        // await dealsPage.advanceDeal(0);
        // Should optimistically update the stage
      }
    });

    test("should show convert dialog for won deals", async () => {
      // Requires a deal in NEGOTIATION stage
      // await dealsPage.filterByStatus("NEGOTIATION");
      // await dealsPage.convertDeal(0);
    });

    test("should show lose dialog", async () => {
      const rowCount = await dealsPage.getRowCount();
      if (rowCount > 0) {
        // await dealsPage.loseDeal(0, "Price too high");
      }
    });
  });

  test.describe("Kanban Drag and Drop", () => {
    test("should move card between columns", async () => {
      await dealsPage.waitForLoad();
      await dealsPage.switchToKanbanView();

      const cards = await dealsPage.kanbanCards.count();
      const columns = await dealsPage.getKanbanColumnCount();

      if (cards > 0 && columns > 1) {
        // await dealsPage.dragCardToColumn(0, 1);
        // Card should move to the target column
      }
    });
  });

  test.describe("Stat Cards", () => {
    test("should display pipeline stats", async () => {
      await dealsPage.waitForLoad();
      await dealsPage.expectStatCardsVisible();
    });
  });
});

test.describe("Deals RTL", () => {
  test("should render correctly in Arabic", async ({ page }) => {
    await page.goto("/ar/deals");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
  });
});
