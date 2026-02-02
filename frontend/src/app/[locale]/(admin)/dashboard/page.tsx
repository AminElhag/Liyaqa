"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  useDashboardSummary,
  useExpiringSubscriptions,
  useTodayAttendance,
} from "@/queries/use-dashboard";
import { useRevenueReport, useAttendanceReport } from "@/queries/use-reports";
import {
  HeroStats,
  RevenueOverview,
  AttendanceHeatmap,
  QuickActions,
  MyTasksWidget,
  AtRiskWidget,
  WelcomeBanner,
  AIInsightsBanner,
} from "@/components/dashboard";
import { WidgetErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";

// Date helper for report queries
function getDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.2, 0, 0, 1] as const },
  },
};

export default function DashboardPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Date ranges for reports
  const last30Days = useMemo(() => getDateRange(30), []);
  const last7Days = useMemo(() => getDateRange(7), []);

  // Fetch all dashboard data
  const { data: summary, isLoading: isLoadingSummary } = useDashboardSummary();
  const { data: expiringSubscriptions, isLoading: isLoadingExpiring } =
    useExpiringSubscriptions(7);
  const { data: todayAttendance, isLoading: isLoadingAttendance } =
    useTodayAttendance();
  const { data: revenueReport, isLoading: isLoadingRevenue } = useRevenueReport({
    ...last30Days,
    groupBy: "day",
  });
  const { data: attendanceReport, isLoading: isLoadingAttendanceReport } =
    useAttendanceReport({
      ...last7Days,
      groupBy: "day",
    });
  // TODO: Implement useTodaySessions hook when backend endpoint is available
  // const { data: todaySessions, isLoading: isLoadingSessions } = useTodaySessions();

  // Combine loading states for different sections
  const isLoadingStats = isLoadingSummary;
  const isLoadingCharts = isLoadingRevenue || isLoadingAttendanceReport;

  // Calculate club health score from summary data
  const healthScore = useMemo(() => {
    if (!summary) return undefined;
    // Simple health score calculation based on multiple factors
    const memberScore = summary.activeMembers > 0 ? 25 : 0;
    const subscriptionScore = summary.activeSubscriptions > 0 ? 25 : 0;
    const attendanceScore = summary.todayCheckIns > 0 ? Math.min(25, (summary.todayCheckIns / 50) * 25) : 0;
    const revenueScore = summary.monthlyRevenue > 0 ? 25 : 0;
    return Math.round(memberScore + subscriptionScore + attendanceScore + revenueScore);
  }, [summary]);

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Banner with Club Health Score */}
      <motion.div variants={sectionVariants}>
        <WelcomeBanner
          healthScore={healthScore}
          healthTrend="stable"
          isLoading={isLoadingStats}
        />
      </motion.div>

      {/* Hero Stats Row - 4 MD3 cards with gradients */}
      <motion.div variants={sectionVariants}>
        <HeroStats summary={summary} isLoading={isLoadingStats} />
      </motion.div>

      {/* AI Insights Banner - collapsible */}
      <motion.div variants={sectionVariants}>
        <AIInsightsBanner
          insights={[
            {
              id: "churn-risk",
              type: "warning",
              titleEn: "Members at churn risk",
              titleAr: "أعضاء معرضون لخطر الانسحاب",
              descriptionEn: `${expiringSubscriptions?.length || 0} members need attention this week`,
              descriptionAr: `${expiringSubscriptions?.length || 0} أعضاء يحتاجون اهتمام هذا الأسبوع`,
              actionLabelEn: "View at-risk members",
              actionLabelAr: "عرض الأعضاء المعرضين للخطر",
              actionHref: "/members?risk=high",
              metric: {
                value: expiringSubscriptions?.length || 0,
                labelEn: "members",
                labelAr: "أعضاء",
              },
            },
            {
              id: "renewal-opportunity",
              type: "opportunity",
              titleEn: "Renewal opportunity",
              titleAr: "فرصة تجديد",
              descriptionEn: `${summary?.expiringThisWeek || 0} subscriptions expire this week`,
              descriptionAr: `${summary?.expiringThisWeek || 0} اشتراك ينتهي هذا الأسبوع`,
              actionLabelEn: "View expiring",
              actionLabelAr: "عرض المنتهية",
              actionHref: "/subscriptions?filter=expiring",
              metric: {
                value: summary?.expiringThisWeek || 0,
                labelEn: "expiring",
                labelAr: "ينتهي",
              },
            },
          ]}
          isLoading={isLoadingExpiring}
        />
      </motion.div>

      {/* Main Content Grid - Revenue Chart (2/3) + My Tasks (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart - 2/3 width */}
        <motion.div
          variants={sectionVariants}
          className="lg:col-span-2"
        >
          <WidgetErrorBoundary widgetName="Revenue Overview">
            <RevenueOverview data={revenueReport} isLoading={isLoadingRevenue} />
          </WidgetErrorBoundary>
        </motion.div>

        {/* My Tasks Today - 1/3 width */}
        <motion.div variants={sectionVariants}>
          <WidgetErrorBoundary widgetName="My Tasks">
            <MyTasksWidget />
          </WidgetErrorBoundary>
        </motion.div>
      </div>

      {/* Secondary Row - Attendance Heatmap (1/2) + At-Risk Members (1/2) */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={sectionVariants}>
          <WidgetErrorBoundary widgetName="Attendance Heatmap">
            <AttendanceHeatmap data={attendanceReport} isLoading={isLoadingAttendanceReport} />
          </WidgetErrorBoundary>
        </motion.div>
        <motion.div variants={sectionVariants}>
          <WidgetErrorBoundary widgetName="At-Risk Members">
            <AtRiskWidget />
          </WidgetErrorBoundary>
        </motion.div>
      </div>

      {/* Quick Actions Grid - Full width */}
      <motion.div variants={sectionVariants}>
        <QuickActions />
      </motion.div>
    </motion.div>
  );
}
