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
import { NavGroup, type NavGroupConfig, type NavItem } from "./nav-group";

// Admin navigation organized into groups
const adminNavGroups: NavGroupConfig[] = [
  {
    id: "overview",
    labelKey: "navGroups.overview",
    icon: LayoutDashboard,
    defaultExpanded: true,
    items: [
      { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    ],
  },
  {
    id: "members",
    labelKey: "navGroups.members",
    icon: Users,
    defaultExpanded: true,
    items: [
      { href: "/members", labelKey: "members", icon: Users },
      { href: "/subscriptions", labelKey: "subscriptions", icon: CreditCard },
      { href: "/freeze-packages", labelKey: "freezePackages", icon: Snowflake },
    ],
  },
  {
    id: "training",
    labelKey: "navGroups.training",
    icon: Dumbbell,
    items: [
      { href: "/classes", labelKey: "classes", icon: Calendar },
      { href: "/trainers", labelKey: "trainers", icon: Dumbbell },
      { href: "/pt-sessions", labelKey: "ptSessions", icon: UserCheck },
      { href: "/attendance", labelKey: "attendance", icon: ClipboardCheck },
    ],
  },
  {
    id: "shop",
    labelKey: "navGroups.shop",
    icon: ShoppingBag,
    items: [
      { href: "/products", labelKey: "products", icon: Package },
      { href: "/product-categories", labelKey: "productCategories", icon: Tags },
      { href: "/pos", labelKey: "pos", icon: ShoppingCart },
      { href: "/invoices", labelKey: "invoices", icon: Receipt },
    ],
  },
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
  {
    id: "system",
    labelKey: "navGroups.system",
    icon: Settings,
    items: [
      { href: "/plans", labelKey: "membership", icon: Tag },
      { href: "/reports", labelKey: "reports", icon: BarChart3 },
      { href: "/manage-notifications", labelKey: "notifications", icon: Bell },
      { href: "/activity", labelKey: "activity", icon: Activity },
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
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
