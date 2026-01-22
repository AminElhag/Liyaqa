"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PlatformHeroStats } from "../platform-hero-stats";
import { PlatformRevenueDashboard } from "../platform-revenue-dashboard";
import { ClientHealthMatrix } from "../client-health-matrix";
import { DealPipelinePreview } from "../deal-pipeline-preview";
import { TopClientsLeaderboard } from "../top-clients-leaderboard";
import { PlatformActivityFeed } from "../platform-activity-feed";
import { DashboardExportMenu } from "../dashboard-export-menu";
import type {
  PlatformSummary,
  PlatformRevenue,
  PlatformHealth,
  MonthlyRevenue,
  DealPipelineOverview,
  TopClient,
  RecentActivity,
} from "@/types/platform/dashboard";

interface AdminDashboardProps {
  summary: PlatformSummary | undefined;
  revenue: PlatformRevenue | undefined;
  health: PlatformHealth | undefined;
  monthlyRevenue: MonthlyRevenue[] | undefined;
  dealPipeline: DealPipelineOverview | undefined;
  topClients: TopClient[] | undefined;
  recentActivity: RecentActivity[] | undefined;
  isLoading?: boolean;
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

/**
 * Full admin dashboard layout for PLATFORM_ADMIN role.
 * Shows all metrics: Hero stats, Revenue, Health, Pipeline, Clients, Activity
 */
export function AdminDashboard({
  summary,
  revenue,
  health,
  monthlyRevenue,
  dealPipeline,
  topClients,
  recentActivity,
  isLoading,
}: AdminDashboardProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    welcome: locale === "ar" ? "مرحباً بك في لوحة التحكم" : "Welcome to Dashboard",
    subtitle:
      locale === "ar"
        ? "نظرة عامة على أداء المنصة"
        : "Overview of platform performance",
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <div className={cn("flex items-start justify-between gap-4", isRtl && "flex-row-reverse")}>
        <div className={cn(isRtl && "text-right")}>
          <h1 className="text-2xl font-bold tracking-tight">{texts.welcome}</h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <DashboardExportMenu />
      </div>

      {/* Hero Stats Row - 5 KPIs */}
      <PlatformHeroStats
        summary={summary}
        revenue={revenue}
        health={health}
        isLoading={isLoading}
      />

      {/* Main Grid - Revenue (2/3) + Health (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlatformRevenueDashboard
            revenue={revenue}
            monthlyData={monthlyRevenue}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <ClientHealthMatrix health={health} isLoading={isLoading} />
        </div>
      </div>

      {/* Pipeline + Top Clients */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DealPipelinePreview pipeline={dealPipeline} isLoading={isLoading} />
        <TopClientsLeaderboard clients={topClients} isLoading={isLoading} />
      </div>

      {/* Activity Feed - Full Width */}
      <PlatformActivityFeed activities={recentActivity} isLoading={isLoading} />
    </motion.div>
  );
}
