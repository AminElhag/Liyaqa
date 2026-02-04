"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Home,
  Users,
  CheckSquare,
  QrCode,
  Menu,
  LayoutDashboard,
  UserPlus,
  CreditCard,
  Calendar,
  Settings,
} from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@liyaqa/shared/components/ui/sheet";

interface NavItem {
  href: string;
  labelEn: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", labelEn: "Home", labelAr: "الرئيسية", icon: Home },
  { href: "/members", labelEn: "Members", labelAr: "الأعضاء", icon: Users },
  { href: "/tasks", labelEn: "Tasks", labelAr: "المهام", icon: CheckSquare },
  { href: "/attendance", labelEn: "Check-in", labelAr: "الحضور", icon: QrCode },
];

const moreNavItems: NavItem[] = [
  { href: "/leads", labelEn: "Leads", labelAr: "العملاء المحتملين", icon: UserPlus },
  { href: "/subscriptions", labelEn: "Subscriptions", labelAr: "الاشتراكات", icon: CreditCard },
  { href: "/classes", labelEn: "Classes", labelAr: "الصفوف", icon: Calendar },
  { href: "/settings", labelEn: "Settings", labelAr: "الإعدادات", icon: Settings },
];

interface BottomNavProps {
  taskCount?: number;
}

export function BottomNav({ taskCount }: BottomNavProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const isRtl = locale === "ar";
  const [moreOpen, setMoreOpen] = React.useState(false);

  const isActive = (href: string) => {
    const localePath = `/${locale}${href}`;
    return pathname === localePath || pathname.startsWith(`${localePath}/`);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 lg:hidden",
        "bg-white/95 backdrop-blur-md border-t",
        "mobile-bottom-nav"
      )}
    >
      <div className="flex items-center justify-around h-16">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasBadge = item.href === "/tasks" && taskCount && taskCount > 0;

          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full relative",
                "transition-colors touch-manipulation",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-6 w-6", active && "scale-110 transition-transform")} />
                {hasBadge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 text-xs"
                  >
                    {taskCount > 99 ? "99+" : taskCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">
                {isRtl ? item.labelAr : item.labelEn}
              </span>
              {active && (
                <div className="absolute top-0 inset-x-2 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}

        {/* More Menu */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full",
                "text-muted-foreground transition-colors touch-manipulation"
              )}
            >
              <Menu className="h-6 w-6" />
              <span className="text-xs mt-1 font-medium">
                {isRtl ? "المزيد" : "More"}
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle className={cn(isRtl && "text-right")}>
                {isRtl ? "المزيد من الخيارات" : "More Options"}
              </SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-4 py-6">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={`/${locale}${item.href}`}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-md3-md",
                      "transition-colors touch-manipulation",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium text-center">
                      {isRtl ? item.labelAr : item.labelEn}
                    </span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
