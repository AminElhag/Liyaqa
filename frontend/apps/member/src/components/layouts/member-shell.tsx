"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  User,
  CreditCard,
  Calendar,
  Receipt,
  Wallet,
  Bell,
  QrCode,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronLeft,
  FileCheck,
} from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@liyaqa/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { ScrollArea } from "@liyaqa/shared/components/ui/scroll-area";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { LanguageToggle } from "@liyaqa/shared/components/ui/language-toggle";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { getInitials } from "@liyaqa/shared/utils";
import { PortalSwitcher } from "@liyaqa/shared/components/auth/portal-switcher";

const memberNavItems = [
  { href: "/member/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/member/profile", labelKey: "profile", icon: User },
  { href: "/member/subscriptions", labelKey: "subscription", icon: CreditCard },
  { href: "/member/bookings", labelKey: "bookings", icon: Calendar },
  { href: "/member/agreements", labelKey: "agreements", icon: FileCheck },
  { href: "/member/payments", labelKey: "payments", icon: Receipt },
  { href: "/member/payment-methods", labelKey: "paymentMethods", icon: Wallet },
  { href: "/member/qr", labelKey: "qrCode", icon: QrCode },
  { href: "/member/notifications", labelKey: "notifications", icon: Bell },
];

interface MemberShellProps {
  children: React.ReactNode;
}

export function MemberShell({ children }: MemberShellProps) {
  const t = useTranslations("member.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (href: string) => {
    const localePath = `/${locale}${href}`;
    return pathname === localePath || pathname.startsWith(`${localePath}/`);
  };

  return (
    <div className="min-h-screen bg-background">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 z-50 h-full border-e border-neutral-800 transition-all duration-300",
          "bg-neutral-900 dark:bg-neutral-950",
          sidebarCollapsed ? "w-16" : "w-64",
          mobileMenuOpen ? "start-0" : "-start-64 lg:start-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-800">
          {!sidebarCollapsed && (
            <Link
              href={`/${locale}/member/dashboard`}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="font-semibold text-lg text-white">
                Liyaqa
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href={`/${locale}/member/dashboard`} className="mx-auto">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">L</span>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="p-2 space-y-1">
            {memberNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="flex-1">{t(item.labelKey)}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ms-16" : "lg:ms-64"
        )}
      >
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b dark:border-neutral-800 flex items-center justify-between px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <PortalSwitcher />

            <Link href={`/${locale}/member/notifications`}>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
            </Link>

            <LanguageToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
                      {getInitials(
                        locale === "ar"
                          ? user?.displayName?.ar || user?.displayName?.en
                          : user?.displayName?.en
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block text-sm">
                    {locale === "ar"
                      ? user?.displayName?.ar || user?.displayName?.en
                      : user?.displayName?.en}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/member/profile`}>
                    <User className="me-2 h-4 w-4" />
                    {locale === "ar" ? "الملف الشخصي" : "Profile"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/member/settings`}>
                    <Settings className="me-2 h-4 w-4" />
                    {locale === "ar" ? "الإعدادات" : "Settings"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-danger">
                  <LogOut className="me-2 h-4 w-4" />
                  {locale === "ar" ? "تسجيل الخروج" : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
