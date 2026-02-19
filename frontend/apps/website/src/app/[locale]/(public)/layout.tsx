"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Globe, Menu, X } from "lucide-react";
import { cn } from "@liyaqa/shared/lib/utils";

/**
 * Public layout for unauthenticated pages like landing, pricing and signup.
 * Includes a responsive navigation header with logo and login link.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const isRtl = locale === "ar";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Build the alternate locale path by replacing the locale prefix
  const alternateLocalePath = pathname.replace(`/${locale}`, `/${locale === "ar" ? "en" : "ar"}`);

  const navItems = [
    { href: `/${locale}#features`, label: isRtl ? "المميزات" : "Features" },
    { href: `/${locale}/pricing`, label: isRtl ? "الأسعار" : "Pricing" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <Image
              src="/assets/logo-liyaqa-primary.svg"
              alt="Liyaqa"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className={cn("hidden md:flex items-center gap-4", isRtl && "flex-row-reverse")}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" size="sm">
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link href={`/${locale}/contact`}>
              <Button size="sm">
                {isRtl ? "تواصل معنا" : "Contact Us"}
              </Button>
            </Link>
            {/* Language Switcher */}
            <Link href={alternateLocalePath || `/${locale === "ar" ? "en" : "ar"}`}>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Globe className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link href={alternateLocalePath || `/${locale === "ar" ? "en" : "ar"}`}>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Globe className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-9 w-9"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white dark:bg-slate-950 px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block"
              >
                <Button variant="ghost" className="w-full justify-start">
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link href={`/${locale}/contact`} onClick={() => setIsMobileMenuOpen(false)} className="block">
              <Button className="w-full">
                {isRtl ? "تواصل معنا" : "Contact Us"}
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-slate-50 dark:bg-slate-900 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {isRtl ? "تواصل معنا" : "Contact us"}{" "}
            <a href="mailto:liyaqasaas@gmail.com" className="text-primary hover:underline">
              liyaqasaas@gmail.com
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Liyaqa. {isRtl ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
        </div>
      </footer>
    </div>
  );
}
