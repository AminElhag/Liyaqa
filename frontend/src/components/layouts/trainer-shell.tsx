"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Calendar,
  Bell,
  Award,
  UserCircle,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
}

// Trainer navigation items
const trainerNavItems: NavItem[] = [
  { href: "/trainer/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/trainer/clients", labelKey: "clients", icon: Users },
  { href: "/trainer/earnings", labelKey: "earnings", icon: DollarSign },
  { href: "/trainer/schedule", labelKey: "schedule", icon: Calendar },
  { href: "/trainer/notifications", labelKey: "notifications", icon: Bell },
  { href: "/trainer/certifications", labelKey: "certifications", icon: Award },
  { href: "/trainer/profile", labelKey: "profile", icon: UserCircle },
];

interface TrainerShellProps {
  children: React.ReactNode;
  unreadCount?: number;
}

export function TrainerShell({ children, unreadCount = 0 }: TrainerShellProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const {
    sidebarCollapsed,
    toggleSidebarCollapse,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useUIStore();

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
            <Link href={`/${locale}/trainer/dashboard`} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="font-semibold text-lg bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
                Liyaqa
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href={`/${locale}/trainer/dashboard`} className="mx-auto">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">L</span>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapse}
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
            {trainerNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const showBadge = item.labelKey === "notifications" && unreadCount > 0;

              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:translate-x-0.5"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="flex-1">{t(item.labelKey)}</span>
                  )}
                  {showBadge && !sidebarCollapsed && (
                    <Badge
                      variant="destructive"
                      className="h-5 min-w-[20px] rounded-full px-1.5 text-xs"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                  {showBadge && sidebarCollapsed && (
                    <div className="absolute top-1 end-1 h-2 w-2 rounded-full bg-destructive" />
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
            <LanguageToggle />

            {/* Notifications bell (mobile) */}
            <Link href={`/${locale}/trainer/notifications`}>
              <Button variant="ghost" size="icon" className="relative lg:hidden">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 end-1 h-2 w-2 rounded-full bg-destructive" />
                )}
              </Button>
            </Link>

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
                  <Link href={`/${locale}/trainer/profile`}>
                    <Settings className="me-2 h-4 w-4" />
                    {t("settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-danger">
                  <LogOut className="me-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
