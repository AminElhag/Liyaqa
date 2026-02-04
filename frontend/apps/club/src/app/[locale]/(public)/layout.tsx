"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Globe, Menu, X } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";

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
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold">
              L
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Liyaqa
            </span>
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
            <Link href={`/${locale}/login`}>
              <Button variant="ghost" size="sm">
                {isRtl ? "تسجيل الدخول" : "Login"}
              </Button>
            </Link>
            <Link href={`/${locale}/signup`}>
              <Button size="sm">
                {isRtl ? "ابدأ مجاناً" : "Start Free Trial"}
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
            <Link href={`/${locale}/login`} onClick={() => setIsMobileMenuOpen(false)} className="block">
              <Button variant="ghost" className="w-full justify-start">
                {isRtl ? "تسجيل الدخول" : "Login"}
              </Button>
            </Link>
            <Link href={`/${locale}/signup`} onClick={() => setIsMobileMenuOpen(false)} className="block">
              <Button className="w-full">
                {isRtl ? "ابدأ مجاناً" : "Start Free Trial"}
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-slate-50 dark:bg-slate-900 py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">{isRtl ? "الشركة" : "Company"}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">{isRtl ? "عن لياقة" : "About"}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{isRtl ? "وظائف" : "Careers"}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{isRtl ? "اتصل بنا" : "Contact"}</Link></li>
              </ul>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">{isRtl ? "المنتج" : "Product"}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href={`/${locale}/pricing`} className="hover:text-foreground">{isRtl ? "الأسعار" : "Pricing"}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{isRtl ? "المميزات" : "Features"}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{isRtl ? "التكاملات" : "Integrations"}</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4">{isRtl ? "الموارد" : "Resources"}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">{isRtl ? "المدونة" : "Blog"}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{isRtl ? "مركز المساعدة" : "Help Center"}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{isRtl ? "واجهة برمجة التطبيقات" : "API Docs"}</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">{isRtl ? "القانوني" : "Legal"}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">{isRtl ? "الخصوصية" : "Privacy"}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{isRtl ? "الشروط" : "Terms"}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Liyaqa. {isRtl ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
