"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  CreditCard,
  Receipt,
  Package,
  HeadphonesIcon,
  Users,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  AlertTriangle,
  Command,
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
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useImpersonationStore } from "@/stores/impersonation-store";
import { getInitials } from "@/lib/utils";
import type { UserRole } from "@/types/auth";
import {
  PlatformNotificationCenter,
  demoNotifications,
  type PlatformNotification,
} from "@/components/platform/platform-notification-center";
import {
  PlatformCommandPalette,
  useCommandPalette,
} from "@/components/platform/platform-command-palette";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  roles: UserRole[];
}

/**
 * Navigation items for the platform shell.
 * Each item specifies which roles can see it.
 */
const navItems: NavItem[] = [
  {
    href: "/platform-dashboard",
    labelKey: "dashboard",
    icon: LayoutDashboard,
    roles: ["PLATFORM_ADMIN", "SALES_REP", "MARKETING", "SUPPORT"],
  },
  {
    href: "/deals",
    labelKey: "deals",
    icon: Briefcase,
    roles: ["PLATFORM_ADMIN", "SALES_REP", "MARKETING", "SUPPORT"],
  },
  {
    href: "/clients",
    labelKey: "clients",
    icon: Building2,
    roles: ["PLATFORM_ADMIN", "SALES_REP"],
  },
  {
    href: "/client-plans",
    labelKey: "plans",
    icon: Package,
    roles: ["PLATFORM_ADMIN"],
  },
  {
    href: "/client-subscriptions",
    labelKey: "subscriptions",
    icon: CreditCard,
    roles: ["PLATFORM_ADMIN", "SALES_REP"],
  },
  {
    href: "/client-invoices",
    labelKey: "invoices",
    icon: Receipt,
    roles: ["PLATFORM_ADMIN", "SALES_REP"],
  },
  {
    href: "/platform-users",
    labelKey: "platformUsers",
    icon: Users,
    roles: ["PLATFORM_ADMIN"],
  },
  {
    href: "/support",
    labelKey: "support",
    icon: HeadphonesIcon,
    roles: ["PLATFORM_ADMIN", "SUPPORT"],
  },
];

interface PlatformShellProps {
  children: React.ReactNode;
}

export function PlatformShell({ children }: PlatformShellProps) {
  const t = useTranslations("platform.nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebarCollapse, mobileMenuOpen, setMobileMenuOpen } =
    useUIStore();
  const { isImpersonating, impersonatedUser, endImpersonation, isExpired } =
    useImpersonationStore();

  // Command palette state
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useCommandPalette();

  // Notification state (using demo data for now)
  const [notifications, setNotifications] = React.useState<PlatformNotification[]>(
    demoNotifications
  );

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Get display name from user
  const userDisplayName =
    locale === "ar"
      ? user?.displayName?.ar || user?.displayName?.en
      : user?.displayName?.en;

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/platform-login`);
  };

  const handleEndImpersonation = () => {
    endImpersonation();
    // Redirect back to support page
    router.push(`/${locale}/support`);
  };

  // Filter nav items by user role
  const filteredNavItems = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  // Check if a nav item is active
  const isActive = (href: string) => {
    const localePath = `/${locale}${href}`;
    return pathname === localePath || pathname.startsWith(`${localePath}/`);
  };

  // Check if impersonation has expired
  const impersonationExpired = isExpired();

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Links for Accessibility */}
      <a href="#main-content" className="skip-link">
        {isRtl ? "تخطي إلى المحتوى الرئيسي" : "Skip to main content"}
      </a>
      <a href="#navigation" className="skip-link">
        {isRtl ? "تخطي إلى التنقل" : "Skip to navigation"}
      </a>

      {/* Impersonation Banner */}
      {isImpersonating && impersonatedUser && (
        <div
          className={cn(
            "fixed top-0 inset-x-0 z-[60] px-4 py-2 text-white text-sm flex items-center justify-between",
            impersonationExpired ? "bg-danger" : "bg-warning"
          )}
        >
          <div className="flex items-center gap-2">
            {impersonationExpired && <AlertTriangle className="h-4 w-4" />}
            <span>
              {impersonationExpired ? (
                t("impersonationExpired")
              ) : (
                <>
                  {t("impersonatingAs")}{" "}
                  <strong>{impersonatedUser.email}</strong> ({impersonatedUser.role})
                </>
              )}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEndImpersonation}
            className="h-7"
          >
            {t("endImpersonation")}
          </Button>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="navigation"
        role="navigation"
        aria-label={isRtl ? "التنقل الرئيسي" : "Main navigation"}
        className={cn(
          "fixed z-50 h-full bg-neutral-900 dark:bg-neutral-950 text-white transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64",
          mobileMenuOpen ? "start-0" : "-start-64 lg:start-0",
          isImpersonating ? "top-10" : "top-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-700 dark:border-neutral-800">
          <Link href={`/${locale}/platform-dashboard`} className="flex items-center">
            {sidebarCollapsed ? (
              <Image
                src="/assets/logo-liyaqa-icon.svg"
                alt="Liyaqa"
                width={64}
                height={64}
                className="h-8 w-8"
              />
            ) : (
              <Image
                src="/assets/logo-liyaqa-white.svg"
                alt="Liyaqa - لياقة"
                width={280}
                height={80}
                className="h-12 w-auto"
                priority
              />
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform",
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

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-white"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{t(item.labelKey)}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ms-16" : "lg:ms-64",
          isImpersonating ? "pt-10" : ""
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b dark:border-neutral-800 flex items-center justify-between px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Command Palette Button (Desktop) */}
          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 text-muted-foreground h-9 px-3"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Command className="h-4 w-4" />
            <span className="text-sm">{locale === "ar" ? "بحث..." : "Search..."}</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <PlatformNotificationCenter
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDismiss={handleDismissNotification}
            />

            <LanguageToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(userDisplayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {userDisplayName}
                    </span>
                    <span className="text-xs text-muted-foreground">{user?.role}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="me-2 h-4 w-4" />
                  {tCommon("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          role="main"
          aria-label={isRtl ? "المحتوى الرئيسي" : "Main content"}
          className="p-4 lg:p-6"
        >
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <PlatformCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}
