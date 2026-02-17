import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liyaqa - Member Portal",
  description: "Member portal for managing your membership, bookings, and subscriptions",
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
