"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
import { LanguageToggle } from "@liyaqa/shared/components/ui/language-toggle";
import { ThemeToggle } from "@liyaqa/shared/components/ui/theme-toggle";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useUIStore } from "@liyaqa/shared/stores/ui-store";
import { getInitials } from "@liyaqa/shared/utils";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { PortalSwitcher } from "@liyaqa/shared/components/auth/portal-switcher";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
}

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
  const t = useTranslations("trainer");
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

  const isActive = (href: string) => {
    const localePath = `/${locale}${href}`;
    return pathname === localePath || pathname.startsWith(`${localePath}/`);
  };

  const displayName = locale === "ar"
    ? user?.displayName?.ar || user?.displayName?.en
    : user?.displayName?.en;

  return (
    <div className="min-h-screen bg-background">
      {/* Skip links for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:top-2 focus:start-2"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:top-2 focus:start-36"
      >
        Skip to navigation
      </a>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        id="navigation"
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 z-50 h-full transition-all duration-300",
          "bg-neutral-900 dark:bg-neutral-950 text-white",
          sidebarCollapsed ? "w-16" : "w-64",
          mobileMenuOpen ? "start-0" : "-start-64 lg:start-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-700 dark:border-neutral-800">
          {!sidebarCollapsed && (
            <Link href={`/${locale}/trainer/dashboard`} className="flex items-center gap-2">
              <Image
                src="/assets/logo-liyaqa-white.svg"
                alt="Liyaqa"
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href={`/${locale}/trainer/dashboard`} className="mx-auto">
              <Image
                src="/assets/logo-liyaqa-icon.svg"
                alt="Liyaqa"
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapse}
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
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
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
            <ThemeToggle />
            <LanguageToggle />

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
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {locale === "ar" ? "مدرب" : "Trainer"}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/trainer/profile`}>
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

        <main id="main-content" role="main" className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
