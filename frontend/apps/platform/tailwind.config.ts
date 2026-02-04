import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../shared/src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fff4f1",
          100: "#ffe5e0",
          200: "#ffccc2",
          300: "#ffb3a3",
          400: "#ff9a82",
          500: "#FF6B4A",
          600: "#E85D3A",
          700: "#d14f2d",
          800: "#a33e23",
          900: "#7a2e19",
          DEFAULT: "#FF6B4A",
          foreground: "#ffffff",
        },
        brand: {
          primary: "#FF6B4A",
          secondary: "#E85D3A",
          tint: "#FF9A82",
          "bg-tint": "#FFE5E0",
        },
        neutral: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        success: {
          50: "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          DEFAULT: "#22c55e",
        },
        warning: {
          50: "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          DEFAULT: "#f59e0b",
        },
        danger: {
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          DEFAULT: "#ef4444",
        },
        info: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          DEFAULT: "#3b82f6",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Cairo", "sans-serif"],
        arabic: ["Cairo", "Tajawal", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "md3-xs": "4px",
        "md3-sm": "8px",
        "md3-md": "12px",
        "md3-lg": "16px",
        "md3-xl": "28px",
        "md3-full": "9999px",
      },
      boxShadow: {
        "md3-1": "0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)",
        "md3-2": "0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)",
        "md3-3": "0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)",
        "md3-4": "0px 2px 3px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)",
        "md3-5": "0px 4px 4px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)",
      },
      spacing: {
        "touch-target": "48px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "md3-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "md3-scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "md3-slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "md3-slide-down": {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "md3-expand": {
          from: { opacity: "0", transform: "scale(0.95)", maxHeight: "0" },
          to: { opacity: "1", transform: "scale(1)", maxHeight: "1000px" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "md3-fade-in": "md3-fade-in 0.2s cubic-bezier(0.2, 0, 0, 1)",
        "md3-scale-in": "md3-scale-in 0.3s cubic-bezier(0.2, 0, 0, 1)",
        "md3-slide-up": "md3-slide-up 0.3s cubic-bezier(0.2, 0, 0, 1)",
        "md3-slide-down": "md3-slide-down 0.3s cubic-bezier(0.2, 0, 0, 1)",
        "md3-expand": "md3-expand 0.3s cubic-bezier(0.2, 0, 0, 1)",
        "spin-slow": "spin 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
