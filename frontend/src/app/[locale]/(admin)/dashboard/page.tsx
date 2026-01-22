"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  useDashboardSummary,
  useExpiringSubscriptions,
  useTodayAttendance,
  useTodaySessions,
} from "@/queries/use-dashboard";
import { useRevenueReport, useAttendanceReport } from "@/queries/use-reports";
import {
  HeroStats,
  RevenueOverview,
  AttendanceHeatmap,
  SubscriptionHealth,
  QuickActions,
  ActivityTimeline,
  UpcomingSessions,
} from "@/components/dashboard";
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
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export default function DashboardPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { user } = useAuthStore();

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
  const { data: todaySessions, isLoading: isLoadingSessions } = useTodaySessions();

  // Combine loading states for different sections
  const isLoadingStats = isLoadingSummary;
  const isLoadingCharts = isLoadingRevenue || isLoadingAttendanceReport;
  const isLoadingLists = isLoadingExpiring || isLoadingAttendance || isLoadingSessions;

  // Bilingual texts
  const texts = {
    welcome: locale === "ar" ? "مرحباً" : "Welcome",
    subtitle: locale === "ar"
      ? "إليك نظرة عامة على نشاط ناديك"
      : "Here's an overview of your club's activity",
    today: locale === "ar" ? "اليوم" : "Today",
  };

  // Get display name
  const displayName = user?.displayName
    ? locale === "ar" && user.displayName.ar
      ? user.displayName.ar
      : user.displayName.en
    : "Admin";

  // Format today's date
  const todayFormatted = new Date().toLocaleDateString(
    locale === "ar" ? "ar-SA" : "en-SA",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={sectionVariants}>
        <div className={cn(
          "flex flex-col md:flex-row md:items-center md:justify-between gap-4",
          isRtl && "md:flex-row-reverse"
        )}>
          <div className={cn(isRtl && "text-right")}>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
              {texts.welcome}, {displayName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">{texts.subtitle}</p>
          </div>

          {/* Date display */}
          <div className={cn(
            "flex items-center gap-2 text-sm text-muted-foreground",
            isRtl && "flex-row-reverse"
          )}>
            <CalendarDays className="h-4 w-4" />
            <span>{todayFormatted}</span>
          </div>
        </div>
      </motion.div>

      {/* Hero Stats Row */}
      <motion.div variants={sectionVariants}>
        <HeroStats summary={summary} isLoading={isLoadingStats} />
      </motion.div>

      {/* Main Content Grid (3-column layout) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3 width) - Charts */}
        <motion.div
          variants={sectionVariants}
          className="lg:col-span-2 space-y-6"
        >
          <RevenueOverview data={revenueReport} isLoading={isLoadingRevenue} />
          <AttendanceHeatmap data={attendanceReport} isLoading={isLoadingAttendanceReport} />
        </motion.div>

        {/* Right Column (1/3 width) - Widgets */}
        <motion.div variants={sectionVariants} className="space-y-6">
          <SubscriptionHealth
            summary={summary}
            expiringSubscriptions={expiringSubscriptions}
            isLoading={isLoadingExpiring}
          />
          <QuickActions />
        </motion.div>
      </div>

      {/* Bottom Row (2-column layout) */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={sectionVariants}>
          <ActivityTimeline
            attendance={todayAttendance}
            isLoading={isLoadingAttendance}
          />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <UpcomingSessions
            sessions={todaySessions}
            isLoading={isLoadingSessions}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
