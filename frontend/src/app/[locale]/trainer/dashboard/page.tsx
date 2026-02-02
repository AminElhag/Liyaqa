"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { useMyTrainerProfile } from "@/queries/use-trainers";
import { useTrainerDashboard } from "@/queries/use-trainer-portal";
import {
  EarningsSummaryCard,
  ScheduleTimeline,
  ClientStatsWidget,
  NotificationsPreview,
} from "@/components/trainer/dashboard";
import { WidgetErrorBoundary } from "@/components/error-boundary";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

export default function TrainerDashboardPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Fetch trainer profile to get trainerId
  const { data: trainerProfile, isLoading: isLoadingProfile } = useMyTrainerProfile();

  // Fetch complete dashboard data
  const { data: dashboard, isLoading: isLoadingDashboard } = useTrainerDashboard(
    trainerProfile?.id
  );

  const isLoading = isLoadingProfile || isLoadingDashboard;

  // Status color mapping
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-500",
    INACTIVE: "bg-gray-500",
    ON_LEAVE: "bg-amber-500",
    TERMINATED: "bg-red-500",
  };

  const statusLabels: Record<string, { en: string; ar: string }> = {
    ACTIVE: { en: "Active", ar: "نشط" },
    INACTIVE: { en: "Inactive", ar: "غير نشط" },
    ON_LEAVE: { en: "On Leave", ar: "في إجازة" },
    TERMINATED: { en: "Terminated", ar: "منتهي" },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Card */}
      <motion.div variants={sectionVariants}>
        <Card className="p-6 bg-gradient-to-br from-teal-500/10 to-blue-500/10 border-teal-200">
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={isRtl ? "text-right" : ""}>
              <h1 className="text-2xl font-bold mb-1">
                {locale === "ar" ? "مرحباً" : "Welcome"},
                {dashboard?.overview.trainerName
                  ? ` ${dashboard.overview.trainerName}`
                  : "!"}
              </h1>
              {dashboard?.overview && (
                <div className={cn("flex items-center gap-2 mt-2", isRtl && "flex-row-reverse")}>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-white border-0",
                      statusColors[dashboard.overview.trainerStatus]
                    )}
                  >
                    {locale === "ar"
                      ? statusLabels[dashboard.overview.trainerStatus]?.ar
                      : statusLabels[dashboard.overview.trainerStatus]?.en}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {dashboard.overview.specializations.join(", ")}
                  </span>
                </div>
              )}
            </div>
            {dashboard?.overview.profileImageUrl && (
              <img
                src={dashboard.overview.profileImageUrl}
                alt="Profile"
                className="h-16 w-16 rounded-full border-2 border-white shadow-md"
              />
            )}
          </div>
        </Card>
      </motion.div>

      {/* Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Earnings Summary */}
        <motion.div variants={sectionVariants}>
          <WidgetErrorBoundary>
            <EarningsSummaryCard
              summary={dashboard?.earnings}
              isLoading={isLoading}
            />
          </WidgetErrorBoundary>
        </motion.div>

        {/* Schedule Timeline */}
        <motion.div variants={sectionVariants}>
          <WidgetErrorBoundary>
            <ScheduleTimeline
              schedule={dashboard?.schedule}
              isLoading={isLoading}
            />
          </WidgetErrorBoundary>
        </motion.div>

        {/* Client Stats */}
        <motion.div variants={sectionVariants}>
          <WidgetErrorBoundary>
            <ClientStatsWidget
              clients={dashboard?.clients}
              isLoading={isLoading}
            />
          </WidgetErrorBoundary>
        </motion.div>

        {/* Notifications Preview */}
        <motion.div variants={sectionVariants}>
          <WidgetErrorBoundary>
            <NotificationsPreview
              notifications={dashboard?.notifications}
              isLoading={isLoading}
            />
          </WidgetErrorBoundary>
        </motion.div>
      </div>
    </motion.div>
  );
}
