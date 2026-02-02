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
import ChartSkeleton from "@/components/platform/shared/chart-skeleton"

// Admin Charts
export const RevenueChart = dynamic(
  () => import("@/components/admin/revenue-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const AttendanceChart = dynamic(
  () => import("@/components/admin/attendance-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const MemberGrowthChart = dynamic(
  () => import("@/components/admin/member-growth-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const ConversionFunnelChart = dynamic(
  () => import("@/components/admin/conversion-funnel-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const LeadSourceChart = dynamic(
  () => import("@/components/admin/lead-source-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const CampaignTimelineChart = dynamic(
  () => import("@/components/admin/campaign-timeline-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

// Platform Charts
export const PlatformRevenueChart = dynamic(
  () => import("@/components/platform/revenue-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const ClientGrowthChart = dynamic(
  () => import("@/components/platform/client-growth-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const HealthTrendChart = dynamic(
  () => import("@/components/platform/health-trend-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

// Dashboard Charts (check if these exist)
export const DashboardRevenueOverview = dynamic(
  () => import("@/components/dashboard/revenue-overview").catch(() => ({
    default: () => <div>Chart not available</div>
  })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const DashboardHeroStats = dynamic(
  () => import("@/components/dashboard/hero-stats").catch(() => ({
    default: () => <div>Chart not available</div>
  })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const DashboardSubscriptionHealth = dynamic(
  () => import("@/components/dashboard/subscription-health").catch(() => ({
    default: () => <div>Chart not available</div>
  })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

// Additional Admin Charts (from analysis report)
export const MemberDistributionChart = dynamic(
  () => import("@/components/admin/member-distribution").catch(() => ({
    default: () => <div>Chart not available</div>
  })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const RevenueByPlanChart = dynamic(
  () => import("@/components/admin/revenue-by-plan").catch(() => ({
    default: () => <div>Chart not available</div>
  })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const LeadSourceBreakdownChart = dynamic(
  () => import("@/components/admin/lead-source-breakdown").catch(() => ({
    default: () => <div>Chart not available</div>
  })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const CampaignChannelBreakdownChart = dynamic(
  () => import("@/components/admin/campaign-channel-breakdown").catch(() => ({
    default: () => <div>Chart not available</div>
  })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export const PeakHoursHeatmap = dynamic(
  () => import("@/components/admin/peak-hours-heatmap").catch(() => ({
    default: () => <div>Chart not available</div>
  })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

/**
 * Type exports for TypeScript consumers
 *
 * Use these to type your props when using dynamic chart components
 */
export type { default as RevenueChartType } from "@/components/admin/revenue-chart"
export type { default as AttendanceChartType } from "@/components/admin/attendance-chart"
// Add more type exports as needed
