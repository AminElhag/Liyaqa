import type { Config } from "tailwindcss";
// Re-use the club app's tailwind config as base
import clubConfig from "../club/tailwind.config";

const config: Config = {
  ...clubConfig,
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../shared/src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
