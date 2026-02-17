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
  return (
    <html suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=location.pathname.split('/')[1];if(l==='ar'){document.documentElement.lang='ar';document.documentElement.dir='rtl'}else{document.documentElement.lang=l||'en';document.documentElement.dir='ltr'}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
