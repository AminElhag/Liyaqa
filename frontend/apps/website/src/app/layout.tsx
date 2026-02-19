import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liyaqa - Gym Management Platform for Saudi Arabia",
  description: "The all-in-one gym management platform built for Saudi Arabia. ZATCA compliance, STC Pay, Arabic-first design, and prayer time scheduling.",
  icons: {
    icon: "/assets/favicon.svg",
    apple: "/assets/logo-liyaqa-icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
