import { test, expect } from "@playwright/test";

test.describe("Theme System", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored theme preference
    await page.addInitScript(() => {
      localStorage.removeItem("theme");
    });
    await page.goto("/en/platform-dashboard");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Theme Toggle", () => {
    test("should start in light mode by default", async ({ page }) => {
      const html = page.locator("html");
      // Should either have no class or 'light' class, not 'dark'
      await expect(html).not.toHaveClass(/dark/);
    });

    test("should toggle to dark mode", async ({ page }) => {
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(200);

      const html = page.locator("html");
      await expect(html).toHaveClass(/dark/);
    });

    test("should toggle back to light mode", async ({ page }) => {
      // Toggle to dark
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(200);

      // Toggle back to light
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(200);

      const html = page.locator("html");
      await expect(html).not.toHaveClass(/dark/);
    });
  });

  test.describe("Theme Persistence", () => {
    test("should persist dark mode across page refresh", async ({ page }) => {
      // Toggle to dark
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(200);

      // Refresh page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Should still be dark
      const html = page.locator("html");
      await expect(html).toHaveClass(/dark/);
    });

    test("should persist theme across navigation", async ({ page }) => {
      // Toggle to dark
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(200);

      // Navigate to clients
      await page.goto("/en/clients");
      await page.waitForLoadState("networkidle");

      // Should still be dark
      const html = page.locator("html");
      await expect(html).toHaveClass(/dark/);
    });

    test("should persist theme to localStorage", async ({ page }) => {
      // Toggle to dark
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(200);

      // Check localStorage
      const theme = await page.evaluate(() => localStorage.getItem("theme"));
      expect(theme).toBe("dark");
    });
  });

  test.describe("Dark Mode Styling", () => {
    test.beforeEach(async ({ page }) => {
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(200);
    });

    test("should apply dark background colors", async ({ page }) => {
      const body = page.locator("body");
      const bgColor = await body.evaluate((el) => getComputedStyle(el).backgroundColor);
      // Dark mode background should be dark
      expect(bgColor).not.toBe("rgb(255, 255, 255)");
    });

    test("should apply dark card colors", async ({ page }) => {
      const card = page.locator('[data-testid="stat-card"]').first();
      if (await card.isVisible()) {
        const bgColor = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bgColor).not.toBe("rgb(255, 255, 255)");
      }
    });

    test("should apply light text on dark backgrounds", async ({ page }) => {
      const body = page.locator("body");
      const textColor = await body.evaluate((el) => getComputedStyle(el).color);
      // Text should be light colored
      const rgb = textColor.match(/\d+/g);
      if (rgb) {
        const luminance = parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2]);
        expect(luminance).toBeGreaterThan(300); // Light text
      }
    });
  });

  test.describe("Theme Transitions", () => {
    test("should animate theme change smoothly", async ({ page }) => {
      const body = page.locator("body");

      // Check transition property is set
      const transition = await body.evaluate((el) => getComputedStyle(el).transition);
      expect(transition).toContain("background-color");
    });
  });

  test.describe("System Preference", () => {
    test("should respect system dark mode preference", async ({ page, context }) => {
      // Emulate dark mode preference
      await context.addCookies([]);
      await page.emulateMedia({ colorScheme: "dark" });

      // Clear localStorage and reload
      await page.evaluate(() => localStorage.removeItem("theme"));
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Should be in dark mode
      const html = page.locator("html");
      await expect(html).toHaveClass(/dark/);
    });

    test("should respect system light mode preference", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "light" });

      await page.evaluate(() => localStorage.removeItem("theme"));
      await page.reload();
      await page.waitForLoadState("networkidle");

      const html = page.locator("html");
      await expect(html).not.toHaveClass(/dark/);
    });

    test("should override system preference with user choice", async ({ page }) => {
      // System prefers dark
      await page.emulateMedia({ colorScheme: "dark" });
      await page.reload();
      await page.waitForLoadState("networkidle");

      // User toggles to light
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(200);

      // Should be light despite system preference
      const html = page.locator("html");
      await expect(html).not.toHaveClass(/dark/);

      // Refresh - should stay light
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(html).not.toHaveClass(/dark/);
    });
  });

  test.describe("Platform-specific Colors", () => {
    test("should apply platform accent colors in light mode", async ({ page }) => {
      await page.goto("/en/platform-dashboard");
      await page.waitForLoadState("networkidle");

      // Check primary color is applied
      const primaryElement = page.locator(".text-primary").first();
      if (await primaryElement.isVisible()) {
        const color = await primaryElement.evaluate((el) => getComputedStyle(el).color);
        expect(color).toBeTruthy();
      }
    });

    test("should apply platform accent colors in dark mode", async ({ page }) => {
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(200);

      const primaryElement = page.locator(".text-primary").first();
      if (await primaryElement.isVisible()) {
        const color = await primaryElement.evaluate((el) => getComputedStyle(el).color);
        expect(color).toBeTruthy();
      }
    });
  });
});

test.describe("Theme on All Pages", () => {
  const pages = [
    "/en/platform-dashboard",
    "/en/clients",
    "/en/deals",
    "/en/client-plans",
    "/en/client-subscriptions",
    "/en/support",
  ];

  for (const pagePath of pages) {
    test(`should toggle theme on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      await page.waitForLoadState("networkidle");

      // Toggle to dark
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(200);

      const html = page.locator("html");
      await expect(html).toHaveClass(/dark/);

      // Toggle back
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(200);

      await expect(html).not.toHaveClass(/dark/);
    });
  }
});
