"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Handshake,
  Building2,
  CreditCard,
  Trophy,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnimatedNumber, AnimatedCurrency } from "@/components/ui/animated-number";
import { DealPipelinePreview } from "../deal-pipeline-preview";
import { TopClientsLeaderboard } from "../top-clients-leaderboard";
import { PlatformActivityFeed } from "../platform-activity-feed";
import { DashboardExportMenu } from "../dashboard-export-menu";
import type {
  PlatformSummary,
  DealPipelineOverview,
  TopClient,
  RecentActivity,
} from "@/types/platform/dashboard";

interface SalesDashboardProps {
  summary: PlatformSummary | undefined;
  dealPipeline: DealPipelineOverview | undefined;
  topClients: TopClient[] | undefined;
  recentActivity: RecentActivity[] | undefined;
  isLoading?: boolean;
}

interface SalesKPI {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  secondaryValue?: number;
  secondaryLabelEn?: string;
  secondaryLabelAr?: string;
  trend?: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4 },
  },
};

/**
 * Sales-focused dashboard layout for SALES_REP role.
 * Emphasizes deals, clients, and subscriptions.
 */
export function SalesDashboard({
  summary,
  dealPipeline,
  topClients,
  recentActivity,
  isLoading,
}: SalesDashboardProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    welcome: locale === "ar" ? "لوحة المبيعات" : "Sales Dashboard",
    subtitle:
      locale === "ar" ? "تتبع صفقاتك وعملائك" : "Track your deals and clients",
    quickActions: locale === "ar" ? "إجراءات سريعة" : "Quick Actions",
    newDeal: locale === "ar" ? "صفقة جديدة" : "New Deal",
    newClient: locale === "ar" ? "عميل جديد" : "New Client",
  };

  const kpis: SalesKPI[] = [
    {
      id: "deals",
      labelEn: "Open Deals",
      labelAr: "الصفقات المفتوحة",
      value: summary?.openDeals || 0,
      trend: 12.5,
      icon: Handshake,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
      href: "/deals",
    },
    {
      id: "clients",
      labelEn: "Active Clients",
      labelAr: "العملاء النشطين",
      value: summary?.activeClients || 0,
      secondaryValue: summary?.pendingClients || 0,
      secondaryLabelEn: "pending",
      secondaryLabelAr: "في الانتظار",
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      href: "/clients",
    },
    {
      id: "subscriptions",
      labelEn: "Active Subscriptions",
      labelAr: "الاشتراكات النشطة",
      value: summary?.activeSubscriptions || 0,
      secondaryValue: summary?.expiringSubscriptions || 0,
      secondaryLabelEn: "expiring",
      secondaryLabelAr: "تنتهي قريباً",
      icon: CreditCard,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
      href: "/client-subscriptions",
    },
    {
      id: "won",
      labelEn: "Won This Month",
      labelAr: "ربحت هذا الشهر",
      value: summary?.wonDealsThisMonth || 0,
      secondaryValue: summary?.lostDealsThisMonth || 0,
      secondaryLabelEn: "lost",
      secondaryLabelAr: "خسرت",
      icon: Trophy,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
      href: "/deals?status=WON",
    },
  ];

  if (isLoading) {
    return <SalesDashboardSkeleton />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Quick Actions */}
      <div
        className={cn(
          "flex items-start justify-between flex-wrap gap-4",
          isRtl && "flex-row-reverse"
        )}
      >
        <div className={cn(isRtl && "text-right")}>
          <h1 className="text-2xl font-bold tracking-tight">{texts.welcome}</h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <div className={cn("flex gap-2", isRtl && "flex-row-reverse")}>
          <Link href={`/${locale}/deals/new`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {texts.newDeal}
            </Button>
          </Link>
          <Link href={`/${locale}/clients/new`}>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              {texts.newClient}
            </Button>
          </Link>
          <DashboardExportMenu />
        </div>
      </div>

      {/* Sales KPIs - 4 cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.id} variants={cardVariants}>
            <Link href={`/${locale}${kpi.href}`}>
              <Card
                className={cn(
                  "hover:shadow-md transition-all cursor-pointer dark:border-neutral-800",
                  "hover:scale-[1.02]"
                )}
              >
                <CardContent className="p-4">
                  <div
                    className={cn(
                      "flex items-center gap-3 mb-3",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", kpi.bgColor)}>
                      <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {locale === "ar" ? kpi.labelAr : kpi.labelEn}
                    </span>
                  </div>
                  <div className={cn(isRtl && "text-right")}>
                    <span className="font-display text-3xl font-bold">
                      <AnimatedNumber
                        value={kpi.value}
                        locale={locale === "ar" ? "ar-SA" : "en-SA"}
                      />
                    </span>
                    {kpi.trend && (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs mt-1",
                          kpi.trend > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400",
                          isRtl && "flex-row-reverse justify-end"
                        )}
                      >
                        {kpi.trend > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {kpi.trend > 0 ? "+" : ""}
                          {kpi.trend}%
                        </span>
                      </div>
                    )}
                    {kpi.secondaryValue !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span
                          className={cn(
                            "font-semibold",
                            kpi.secondaryValue > 0 && "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {kpi.secondaryValue}
                        </span>{" "}
                        {locale === "ar" ? kpi.secondaryLabelAr : kpi.secondaryLabelEn}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Deal Pipeline - Full Width */}
      <DealPipelinePreview pipeline={dealPipeline} isLoading={isLoading} />

      {/* Top Clients + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopClientsLeaderboard clients={topClients} isLoading={isLoading} />
        <PlatformActivityFeed
          activities={recentActivity?.filter(
            (a) =>
              a.entityType.includes("DEAL") ||
              a.entityType.includes("CLIENT") ||
              a.entityType.includes("SUBSCRIPTION")
          )}
          isLoading={isLoading}
          maxActivities={6}
        />
      </div>
    </motion.div>
  );
}

function SalesDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[250px] w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
      </div>
    </div>
  );
}
