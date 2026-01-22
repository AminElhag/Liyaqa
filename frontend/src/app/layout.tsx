import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liyaqa - Gym Management System",
  description: "Modern gym and fitness center management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
