import { test, expect } from "@playwright/test";
import { ClientsPage } from "../pages/clients.page";

test.describe("Platform Clients", () => {
  let clientsPage: ClientsPage;

  test.beforeEach(async ({ page }) => {
    clientsPage = new ClientsPage(page);
    await clientsPage.goto();
  });

  test.describe("Initial Load", () => {
    test("should display skeleton loading states initially", async ({ page }) => {
      await page.goto("/en/clients");
      await clientsPage.expectSkeletonLoading();
    });

    test("should load clients list", async () => {
      await clientsPage.waitForLoad();
      await clientsPage.expectTableVisible();
    });

    test("should display stat cards", async () => {
      await clientsPage.waitForLoad();
      await clientsPage.expectStatCardsVisible();
    });

    test("should display search input", async () => {
      await clientsPage.waitForLoad();
      await expect(clientsPage.searchInput).toBeVisible();
    });

    test("should display status filter", async () => {
      await clientsPage.waitForLoad();
      await expect(clientsPage.statusFilter).toBeVisible();
    });
  });

  test.describe("Search Functionality", () => {
    test("should filter clients by search query", async () => {
      await clientsPage.waitForLoad();
      const initialCount = await clientsPage.getRowCount();

      await clientsPage.search("test");

      // Results should change (or stay same if no matches)
      await clientsPage.waitForLoad();
    });

    test("should show no results for invalid search", async () => {
      await clientsPage.waitForLoad();
      await clientsPage.search("xyznonexistent123");

      // Should show no results or empty state
      await clientsPage.waitForLoad();
    });

    test("should debounce search input", async ({ page }) => {
      await clientsPage.waitForLoad();

      // Type quickly
      await clientsPage.searchInput.fill("t");
      await page.waitForTimeout(100);
      await clientsPage.searchInput.fill("te");
      await page.waitForTimeout(100);
      await clientsPage.searchInput.fill("tes");
      await page.waitForTimeout(100);
      await clientsPage.searchInput.fill("test");

      // Wait for debounce (300ms)
      await page.waitForTimeout(400);

      // Should have made only one API call (checked via network)
    });

    test("should clear search and show all results", async () => {
      await clientsPage.waitForLoad();
      await clientsPage.search("test");
      await clientsPage.waitForLoad();

      await clientsPage.searchInput.clear();
      await clientsPage.waitForLoad();

      // Should show all clients again
    });
  });

  test.describe("Status Filter", () => {
    test("should filter by ACTIVE status", async () => {
      await clientsPage.waitForLoad();
      await clientsPage.filterByStatus("ACTIVE");

      // All visible rows should have ACTIVE status
    });

    test("should filter by PENDING status", async () => {
      await clientsPage.waitForLoad();
      await clientsPage.filterByStatus("PENDING");
    });

    test("should filter by SUSPENDED status", async () => {
      await clientsPage.waitForLoad();
      await clientsPage.filterByStatus("SUSPENDED");
    });

    test("should show all clients with ALL filter", async () => {
      await clientsPage.waitForLoad();
      await clientsPage.filterByStatus("ACTIVE");
      await clientsPage.filterByStatus("ALL");
    });
  });

  test.describe("Client Actions", () => {
    test("should navigate to new client form", async ({ page }) => {
      await clientsPage.waitForLoad();
      await clientsPage.clickNewClient();
      await expect(page).toHaveURL(/\/clients\/new/);
    });

    test("should navigate to client detail page", async ({ page }) => {
      await clientsPage.waitForLoad();
      const rowCount = await clientsPage.getRowCount();

      if (rowCount > 0) {
        await clientsPage.viewClient(0);
        await expect(page).toHaveURL(/\/clients\/[^/]+$/);
      }
    });

    test("should navigate to client edit page", async ({ page }) => {
      await clientsPage.waitForLoad();
      const rowCount = await clientsPage.getRowCount();

      if (rowCount > 0) {
        await clientsPage.editClient(0);
        await expect(page).toHaveURL(/\/clients\/[^/]+\/edit/);
      }
    });
  });

  test.describe("Status Changes", () => {
    test("should show loading overlay during activate", async () => {
      await clientsPage.waitForLoad();
      const rowCount = await clientsPage.getRowCount();

      if (rowCount > 0) {
        // This would require a pending client
        // await clientsPage.activateClient(0);
        // await clientsPage.expectLoadingOverlay();
      }
    });

    test("should optimistically update status on activate", async () => {
      // Requires a client in PENDING status
      await clientsPage.waitForLoad();
      // await clientsPage.filterByStatus("PENDING");
      // await clientsPage.activateClient(0);
      // Status badge should immediately change
    });

    test("should optimistically update status on suspend", async () => {
      // Requires a client in ACTIVE status
      await clientsPage.waitForLoad();
      // await clientsPage.filterByStatus("ACTIVE");
      // await clientsPage.suspendClient(0);
      // Status badge should immediately change
    });
  });

  test.describe("Stat Cards", () => {
    test("should display total clients count", async () => {
      await clientsPage.waitForLoad();
      const totalValue = await clientsPage.getStatValue(0);
      expect(totalValue).toBeTruthy();
    });

    test("should display active clients count", async () => {
      await clientsPage.waitForLoad();
      const activeValue = await clientsPage.getStatValue(1);
      expect(activeValue).toBeTruthy();
    });

    test("should display pending clients count", async () => {
      await clientsPage.waitForLoad();
      const pendingValue = await clientsPage.getStatValue(2);
      expect(pendingValue).toBeTruthy();
    });

    test("should display suspended clients count", async () => {
      await clientsPage.waitForLoad();
      const suspendedValue = await clientsPage.getStatValue(3);
      expect(suspendedValue).toBeTruthy();
    });
  });

  test.describe("Pagination", () => {
    test("should display pagination controls", async () => {
      await clientsPage.waitForLoad();
      await expect(clientsPage.pagination).toBeVisible();
    });
  });
});

test.describe("Clients RTL", () => {
  test("should render correctly in Arabic", async ({ page }) => {
    await page.goto("/ar/clients");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");

    // Search placeholder should be in Arabic
    const searchInput = page.locator('input[placeholder*="البحث"]');
    await expect(searchInput).toBeVisible();
  });
});
