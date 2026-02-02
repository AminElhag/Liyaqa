import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liyaqa - Gym Management System",
  description: "Modern gym and fitness center management platform",
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
  return children;
}
