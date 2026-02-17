import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liyaqa - Trainer Portal",
  description: "Trainer portal for managing classes, sessions, and clients",
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
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
