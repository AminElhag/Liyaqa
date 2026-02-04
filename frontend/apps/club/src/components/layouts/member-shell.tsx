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
import { useUnreadNotificationCount } from "@liyaqa/shared/queries/use-member-portal";
import { getInitials } from "@liyaqa/shared/utils";

// Member navigation items
const memberNavItems = [
  { href: "/member/dashboard", labelKey: "home.welcome", icon: LayoutDashboard },
  { href: "/member/profile", labelKey: "profile.title", icon: User },
  { href: "/member/subscriptions", labelKey: "home.mySubscription", icon: CreditCard },
  { href: "/member/bookings", labelKey: "bookings.title", icon: Calendar },
  { href: "/member/agreements", labelKey: "agreements.title", icon: FileCheck },
  { href: "/member/payments", labelKey: "invoices.title", icon: Receipt },
  { href: "/member/payment-methods", labelKey: "paymentMethods.title", icon: Wallet },
  { href: "/member/qr", labelKey: "qr.title", icon: QrCode },
  { href: "/member/notifications", labelKey: "notifications.title", icon: Bell },
];

interface MemberShellProps {
  children: React.ReactNode;
}

export function MemberShell({ children }: MemberShellProps) {
  const t = useTranslations("member");
  const locale = useLocale();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.unreadCount ?? 0;

  const handleLogout = async () => {
    await logout();
  };

  // Check if a nav item is active
  const isActive = (href: string) => {
    const localePath = `/${locale}${href}`;
    return pathname === localePath || pathname.startsWith(`${localePath}/`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 z-50 h-full border-e shadow-sm transition-all duration-300",
          "bg-gradient-to-b from-white to-neutral-50/80",
          sidebarCollapsed ? "w-16" : "w-64",
          mobileMenuOpen ? "start-0" : "-start-64 lg:start-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b bg-white">
          {!sidebarCollapsed && (
            <Link
              href={`/${locale}/member/dashboard`}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="font-semibold text-lg bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
                Liyaqa
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href={`/${locale}/member/dashboard`} className="mx-auto">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">L</span>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex"
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
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="p-2 space-y-1">
            {memberNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isNotifications = item.href.includes("notifications");

              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "text-neutral-600 hover:bg-neutral-100 hover:translate-x-0.5"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="flex-1">{t(item.labelKey)}</span>
                  )}
                  {!sidebarCollapsed && isNotifications && unreadCount > 0 && (
                    <Badge
                      variant={active ? "secondary" : "destructive"}
                      className="h-5 min-w-[20px] px-1.5"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ms-16" : "lg:ms-64"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-sm border-b flex items-center justify-between px-4 lg:px-6">
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
            {/* Notification bell with badge */}
            <Link href={`/${locale}/member/notifications`}>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 h-4 min-w-[16px] px-1 bg-danger text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>

            <LanguageToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700">
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
                    {t("profile.title")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/member/settings`}>
                    <Settings className="me-2 h-4 w-4" />
                    {t("settings.title")}
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

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
