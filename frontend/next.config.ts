import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Enable standalone output for Docker deployment
  output: "standalone",

  // Skip static generation errors during build
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },

  // Exclude prototype directory from builds
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/prototype/**"],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
