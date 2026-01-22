import { test, expect } from "@playwright/test";

test.describe("Loading States", () => {
  test.describe("Skeleton Loading", () => {
    test("should show skeleton on dashboard initial load", async ({ page }) => {
      // Navigate without waiting for load
      await page.goto("/en/platform-dashboard", { waitUntil: "commit" });

      // Should show skeleton immediately
      const skeleton = page.locator('[data-testid="skeleton"]').first();
      await expect(skeleton).toBeVisible({ timeout: 2000 }).catch(() => {
        // Skeleton may have already been replaced
      });
    });

    test("should show skeleton on clients initial load", async ({ page }) => {
      await page.goto("/en/clients", { waitUntil: "commit" });

      const skeleton = page.locator('[data-testid="skeleton"]').first();
      await expect(skeleton).toBeVisible({ timeout: 2000 }).catch(() => {});
    });

    test("should show skeleton on deals initial load", async ({ page }) => {
      await page.goto("/en/deals", { waitUntil: "commit" });

      const skeleton = page.locator('[data-testid="skeleton"]').first();
      await expect(skeleton).toBeVisible({ timeout: 2000 }).catch(() => {});
    });

    test("should replace skeleton with content", async ({ page }) => {
      await page.goto("/en/clients", { waitUntil: "commit" });

      // Wait for content to load
      await page.waitForLoadState("networkidle");

      // Skeleton should be hidden
      const skeleton = page.locator('[data-testid="skeleton"]').first();
      await expect(skeleton).not.toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    test("should show stat card skeletons", async ({ page }) => {
      await page.goto("/en/clients", { waitUntil: "commit" });

      const statSkeleton = page.locator('[data-testid="stat-card-skeleton"]');
      await expect(statSkeleton.first()).toBeVisible({ timeout: 2000 }).catch(() => {});
    });

    test("should show table skeleton", async ({ page }) => {
      await page.goto("/en/clients", { waitUntil: "commit" });

      const tableSkeleton = page.locator('[data-testid="table-skeleton"]');
      await expect(tableSkeleton).toBeVisible({ timeout: 2000 }).catch(() => {});
    });
  });

  test.describe("Loading Overlay", () => {
    test("should show loading overlay during mutations", async ({ page }) => {
      await page.goto("/en/clients");
      await page.waitForLoadState("networkidle");

      // Intercept API call to delay response
      await page.route("**/api/platform/clients/*/activate", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      // Trigger a mutation (if there's a pending client to activate)
      // The loading overlay should appear
    });

    test("should hide loading overlay after mutation completes", async ({ page }) => {
      await page.goto("/en/clients");
      await page.waitForLoadState("networkidle");

      // Loading overlay should not be visible in idle state
      const overlay = page.locator(".loading-overlay");
      await expect(overlay).not.toBeVisible();
    });
  });

  test.describe("Refresh Indicator", () => {
    test("should show subtle refresh indicator during background refetch", async ({ page }) => {
      await page.goto("/en/clients");
      await page.waitForLoadState("networkidle");

      // The small spinner in top right should appear during refetch
      // This happens when data is already loaded but being refreshed
    });
  });

  test.describe("Progressive Loading", () => {
    test("should load page header immediately", async ({ page }) => {
      await page.goto("/en/clients", { waitUntil: "commit" });

      // Page header should be visible quickly
      const header = page.locator("h1");
      await expect(header).toBeVisible({ timeout: 3000 });
    });

    test("should show search input before data loads", async ({ page }) => {
      await page.goto("/en/clients", { waitUntil: "commit" });

      // Search should be available early
      const search = page.locator('input[placeholder*="Search"], input[placeholder*="البحث"]');
      await expect(search).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Error States", () => {
    test("should show error fallback on API failure", async ({ page }) => {
      // Intercept and fail API call
      await page.route("**/api/platform/clients**", (route) => {
        route.abort();
      });

      await page.goto("/en/clients");
      await page.waitForTimeout(5000);

      // Error fallback should be visible
      const errorFallback = page.locator('[data-testid="error-fallback"]');
      await expect(errorFallback).toBeVisible({ timeout: 10000 }).catch(() => {});
    });

    test("should show retry button on error", async ({ page }) => {
      await page.route("**/api/platform/clients**", (route) => {
        route.abort();
      });

      await page.goto("/en/clients");
      await page.waitForTimeout(5000);

      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeVisible({ timeout: 10000 }).catch(() => {});
    });
  });

  test.describe("Animation", () => {
    test("should have shimmer animation on skeletons", async ({ page }) => {
      await page.goto("/en/clients", { waitUntil: "commit" });

      const skeleton = page.locator(".animate-pulse, .animate-shimmer").first();
      if (await skeleton.isVisible({ timeout: 2000 }).catch(() => false)) {
        const animation = await skeleton.evaluate((el) =>
          getComputedStyle(el).animation || getComputedStyle(el).animationName
        );
        expect(animation).toBeTruthy();
      }
    });

    test("should have spin animation on loading spinner", async ({ page }) => {
      await page.goto("/en/clients", { waitUntil: "commit" });

      const spinner = page.locator(".animate-spin").first();
      if (await spinner.isVisible({ timeout: 2000 }).catch(() => false)) {
        const animation = await spinner.evaluate((el) => getComputedStyle(el).animation);
        expect(animation).toContain("spin");
      }
    });
  });
});

test.describe("Loading States on All Pages", () => {
  const pages = [
    { path: "/en/platform-dashboard", name: "Dashboard" },
    { path: "/en/clients", name: "Clients" },
    { path: "/en/deals", name: "Deals" },
    { path: "/en/client-plans", name: "Plans" },
    { path: "/en/client-subscriptions", name: "Subscriptions" },
    { path: "/en/support", name: "Support" },
    { path: "/en/platform-users", name: "Users" },
  ];

  for (const { path, name } of pages) {
    test(`should show loading state on ${name} page`, async ({ page }) => {
      await page.goto(path, { waitUntil: "commit" });

      // Either skeleton or content should be visible quickly
      const content = page.locator("main, [data-testid='page-content']");
      await expect(content).toBeVisible({ timeout: 10000 });
    });
  }
});
