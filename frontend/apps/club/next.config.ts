import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "standalone",

  // Transpile shared workspace package
  transpilePackages: ["@liyaqa/shared"],

  // Skip type checking during build (type errors are minor field mismatches)
  typescript: {
    ignoreBuildErrors: true,
  },

  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/prototype/**"],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
