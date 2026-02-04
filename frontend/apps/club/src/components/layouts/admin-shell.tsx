"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  Receipt,
  ClipboardCheck,
  Settings,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  BarChart3,
  Bell,
  Activity,
  Tag,
  Snowflake,
  Dumbbell,
  UserCheck,
  Package,
  Tags,
  ShoppingBag,
  ShoppingCart,
  ListOrdered,
  UserCog,
  Building,
  Briefcase,
  UsersRound,
  UserPlus,
  Target,
  Shuffle,
  FileText,
  Lock,
  Shield,
  Search,
  CheckSquare,
  XCircle,
  Megaphone,
  Gift,
  Building2,
  TrendingUp,
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
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useUIStore } from "@liyaqa/shared/stores/ui-store";
import { getInitials } from "@liyaqa/shared/utils";
import { NavGroup, type NavGroupConfig, type NavItem } from "./nav-group";
import { useCommandPaletteSafe } from "@/components/command-palette";
import { BottomNav } from "@/components/mobile";

// Admin navigation organized into groups (MD3 Redesign)
const adminNavGroups: NavGroupConfig[] = [
  // Dashboard (top-level)
  {
    id: "dashboard",
    labelKey: "navGroups.dashboard",
    icon: LayoutDashboard,
    defaultExpanded: true,
    items: [
      { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    ],
  },

  // Members & CRM
  {
    id: "membersCrm",
    labelKey: "navGroups.membersCrm",
    icon: Users,
    defaultExpanded: true,
    items: [
      { href: "/members", labelKey: "members", icon: Users },
      { href: "/leads", labelKey: "leads", icon: UserPlus },
      { href: "/tasks", labelKey: "tasks", icon: CheckSquare },
      { href: "/subscriptions", labelKey: "subscriptions", icon: CreditCard },
      { href: "/cancellations", labelKey: "cancellations", icon: XCircle },
      { href: "/contracts", labelKey: "contracts", icon: FileText },
      { href: "/freeze-packages", labelKey: "freezePackages", icon: Snowflake },
    ],
  },

  // Operations
  {
    id: "operations",
    labelKey: "navGroups.operations",
    icon: ClipboardCheck,
    items: [
      { href: "/attendance", labelKey: "attendance", icon: ClipboardCheck },
      { href: "/classes", labelKey: "classes", icon: Calendar },
      { href: "/trainers", labelKey: "trainers", icon: Dumbbell },
      { href: "/pt-sessions", labelKey: "ptSessions", icon: UserCheck },
      { href: "/facilities", labelKey: "facilities", icon: Building2 },
    ],
  },

  // Sales & Commerce
  {
    id: "salesCommerce",
    labelKey: "navGroups.salesCommerce",
    icon: ShoppingBag,
    items: [
      { href: "/pos", labelKey: "pos", icon: ShoppingCart },
      { href: "/invoices", labelKey: "invoices", icon: Receipt },
      { href: "/products", labelKey: "products", icon: Package },
      { href: "/product-categories", labelKey: "productCategories", icon: Tags },
      { href: "/marketing/campaigns", labelKey: "campaigns", icon: Megaphone },
      { href: "/loyalty", labelKey: "loyalty", icon: Gift },
    ],
  },

  // Analytics
  {
    id: "analytics",
    labelKey: "navGroups.analytics",
    icon: TrendingUp,
    items: [
      { href: "/analytics", labelKey: "analyticsOverview", icon: TrendingUp },
      { href: "/reports", labelKey: "reports", icon: BarChart3 },
      { href: "/analytics/churn", labelKey: "churnAnalysis", icon: Activity },
    ],
  },

  // Team
  {
    id: "team",
    labelKey: "navGroups.team",
    icon: UsersRound,
    items: [
      { href: "/employees", labelKey: "employees", icon: UserCog },
      { href: "/departments", labelKey: "departments", icon: Building },
      { href: "/job-titles", labelKey: "jobTitles", icon: Briefcase },
    ],
  },

  // Settings
  {
    id: "settings",
    labelKey: "navGroups.settings",
    icon: Settings,
    items: [
      { href: "/plans", labelKey: "plans", icon: Tag },
      { href: "/settings/agreements", labelKey: "agreements", icon: FileText },
      { href: "/settings/access-control", labelKey: "accessControl", icon: Lock },
      { href: "/settings/compliance", labelKey: "compliance", icon: Shield },
      { href: "/settings/membership-categories", labelKey: "membershipCategories", icon: Users },
      { href: "/settings/pricing-tiers", labelKey: "pricingTiers", icon: Tag },
      { href: "/manage-notifications", labelKey: "notifications", icon: Bell },
    ],
  },
];

// Member navigation (flat, simple list)
const memberNavItems: NavItem[] = [
  { href: "/shop", labelKey: "shop", icon: ShoppingBag },
  { href: "/cart", labelKey: "cart", icon: ShoppingCart },
  { href: "/my-orders", labelKey: "myOrders", icon: ListOrdered },
  { href: "/personal-training", labelKey: "personalTraining", icon: Dumbbell },
];

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const {
    sidebarCollapsed,
    toggleSidebarCollapse,
    mobileMenuOpen,
    setMobileMenuOpen,
    expandedNavGroups,
    toggleNavGroup,
  } = useUIStore();

  // Command palette hook - returns null when outside provider
  const commandPalette = useCommandPaletteSafe();

  const handleLogout = async () => {
    await logout();
  };

  // Check if a nav item is active
  const isActive = (href: string) => {
    const localePath = `/${locale}${href}`;
    return pathname === localePath || pathname.startsWith(`${localePath}/`);
  };

  // Determine if user is a member (simple flat nav) or admin (grouped nav)
  const isMember = user?.role === "MEMBER";

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
            <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="font-semibold text-lg bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
                Liyaqa
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href={`/${locale}/dashboard`} className="mx-auto">
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
            {isMember ? (
              // Member navigation - simple flat list
              memberNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
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
                    {!sidebarCollapsed && <span>{t(item.labelKey)}</span>}
                  </Link>
                );
              })
            ) : (
              // Admin navigation - grouped collapsible
              adminNavGroups.map((group) => (
                <NavGroup
                  key={group.id}
                  group={group}
                  isExpanded={expandedNavGroups.includes(group.id)}
                  onToggle={() => toggleNavGroup(group.id)}
                  isCollapsed={sidebarCollapsed}
                  onCloseMobile={() => setMobileMenuOpen(false)}
                />
              ))
            )}
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

          {/* Command Palette Search Button */}
          {commandPalette && (
            <button
              type="button"
              onClick={commandPalette.open}
              className={cn(
                "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md3-md",
                "text-sm text-muted-foreground",
                "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                "transition-colors duration-150"
              )}
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">
                {locale === "ar" ? "بحث..." : "Search..."}
              </span>
              <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          )}

          {/* Mobile search button */}
          {commandPalette && (
            <Button
              variant="ghost"
              size="icon"
              onClick={commandPalette.open}
              className="sm:hidden"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <LanguageToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700">
                      {getInitials(locale === "ar" ? user?.displayName?.ar || user?.displayName?.en : user?.displayName?.en)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block text-sm">
                    {locale === "ar" ? user?.displayName?.ar || user?.displayName?.en : user?.displayName?.en}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/account`}>
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

      {/* Mobile Bottom Navigation */}
      {!isMember && <BottomNav />}
    </div>
  );
}
