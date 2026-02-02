import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "e2e", "tests"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules",
        "e2e",
        "tests",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/**",
        "**/*.spec.{ts,tsx}",
        "**/*.test.{ts,tsx}",
        "**/app/**/layout.tsx",
        "**/app/**/page.tsx",
        "**/middleware.ts",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
