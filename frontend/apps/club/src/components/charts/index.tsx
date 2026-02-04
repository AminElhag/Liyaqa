/**
 * Dynamic Chart Imports
 *
 * All chart components are lazy-loaded to reduce initial bundle size.
 * This saves ~250KB+ by only loading recharts when charts are actually displayed.
 *
 * Use these imports instead of direct imports from chart files:
 *
 * @example
 * // ❌ Don't do this (loads recharts upfront):
 * import RevenueChart from "@/components/admin/revenue-chart"
 *
 * // ✅ Do this (lazy loads recharts):
 * import { RevenueChart } from "@/components/charts"
 */

import dynamic from "next/dynamic"
import { ChartSkeleton } from "@/components/platform/shared/chart-skeleton"

// Admin Charts
export const RevenueChart = dynamic(
  () => import("@/components/admin/revenue-chart").then(mod => ({ default: mod.RevenueChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const AttendanceChart = dynamic(
  () => import("@/components/admin/attendance-chart").then(mod => ({ default: mod.AttendanceChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const MemberGrowthChart = dynamic(
  () => import("@/components/admin/member-growth-chart").then(mod => ({ default: mod.MemberGrowthChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const ConversionFunnelChart = dynamic(
  () => import("@/components/admin/conversion-funnel-chart").then(mod => ({ default: mod.ConversionFunnelChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const LeadSourceChart = dynamic(
  () => import("@/components/admin/lead-source-chart").then(mod => ({ default: mod.LeadSourceChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const CampaignTimelineChart = dynamic(
  () => import("@/components/admin/campaign-timeline-chart").then(mod => ({ default: mod.CampaignTimelineChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

// Platform Charts
export const PlatformRevenueChart = dynamic(
  () => import("@/components/platform/revenue-chart").then(mod => ({ default: mod.RevenueChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const ClientGrowthChart = dynamic(
  () => import("@/components/platform/client-growth-chart").then(mod => ({ default: mod.ClientGrowthChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const HealthTrendChart = dynamic(
  () => import("@/components/platform/health-trend-chart").then(mod => ({ default: mod.HealthTrendChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

// Dashboard Charts
// TODO: Add these charts when components are implemented
// export const DashboardRevenueOverview = dynamic(...)
// export const DashboardHeroStats = dynamic(...)
// export const DashboardSubscriptionHealth = dynamic(...)

// Additional Admin Charts
// TODO: Add these charts when components are implemented
// export const MemberDistributionChart = dynamic(...)
// export const RevenueByPlanChart = dynamic(...)
// export const LeadSourceBreakdownChart = dynamic(...)
// export const CampaignChannelBreakdownChart = dynamic(...)
// export const PeakHoursHeatmap = dynamic(...)

/**
 * Type exports for TypeScript consumers
 *
 * Use these to type your props when using dynamic chart components
 */
// TODO: Add type exports when needed
// export type { RevenueChart as RevenueChartType } from "@/components/admin/revenue-chart"
// export type { AttendanceChart as AttendanceChartType } from "@/components/admin/attendance-chart"
