"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  UserCheck,
  UserMinus,
  CreditCard,
  Receipt,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TodayAttendance } from "@/lib/api/dashboard";

interface ActivityTimelineProps {
  attendance: TodayAttendance[] | undefined;
  isLoading?: boolean;
}

type ActivityType = "check_in" | "check_out" | "subscription" | "payment" | "booking";

interface ActivityItem {
  id: string;
  type: ActivityType;
  memberName: string;
  timestamp: string;
  details?: string;
}

const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  labelEn: string;
  labelAr: string;
}> = {
  check_in: {
    icon: UserCheck,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    labelEn: "checked in",
    labelAr: "سجّل الدخول",
  },
  check_out: {
    icon: UserMinus,
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
    labelEn: "checked out",
    labelAr: "سجّل الخروج",
  },
  subscription: {
    icon: CreditCard,
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
    labelEn: "subscribed",
    labelAr: "اشترك",
  },
  payment: {
    icon: Receipt,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    labelEn: "paid invoice",
    labelAr: "دفع فاتورة",
  },
  booking: {
    icon: Calendar,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    labelEn: "booked class",
    labelAr: "حجز حصة",
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export function ActivityTimeline({ attendance, isLoading }: ActivityTimelineProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    title: locale === "ar" ? "النشاط الأخير" : "Recent Activity",
    viewAll: locale === "ar" ? "عرض الكل" : "View All",
    noActivity: locale === "ar" ? "لا يوجد نشاط حديث" : "No recent activity",
    just_now: locale === "ar" ? "الآن" : "Just now",
    min_ago: locale === "ar" ? "دقيقة" : "min ago",
    mins_ago: locale === "ar" ? "دقائق" : "mins ago",
    hour_ago: locale === "ar" ? "ساعة" : "hour ago",
    hours_ago: locale === "ar" ? "ساعات" : "hours ago",
  };

  if (isLoading) {
    return <ActivityTimelineSkeleton />;
  }

  // Transform attendance data to activity items
  const activities: ActivityItem[] = (attendance || []).slice(0, 8).map((item, index) => ({
    id: `${item.memberId}-${index}`,
    type: item.checkOutTime ? "check_out" : "check_in",
    memberName: locale === "ar" && item.memberName.ar
      ? item.memberName.ar
      : item.memberName.en,
    timestamp: item.checkOutTime || item.checkInTime,
    details: item.checkInMethod,
  }));

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card className="h-full">
        <CardHeader className={cn("pb-3", isRtl && "text-right")}>
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <Activity className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">{texts.title}</CardTitle>
            </div>
            <Link href={`/${locale}/attendance`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                {texts.viewAll}
                <ChevronRight className={cn("h-3 w-3", isRtl && "rotate-180")} />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className={cn(
                "absolute top-0 bottom-0 w-px bg-border",
                isRtl ? "right-4" : "left-4"
              )} />

              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ delay: index * 0.05 }}
                    >
                      <ActivityTimelineItem
                        activity={activity}
                        locale={locale}
                        isRtl={isRtl}
                        texts={texts}
                      />
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">{texts.noActivity}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ActivityTimelineItemProps {
  activity: ActivityItem;
  locale: string;
  isRtl: boolean;
  texts: Record<string, string>;
}

function ActivityTimelineItem({ activity, locale, isRtl, texts }: ActivityTimelineItemProps) {
  const config = ACTIVITY_CONFIG[activity.type];
  const Icon = config.icon;
  const actionLabel = locale === "ar" ? config.labelAr : config.labelEn;
  const timeAgo = formatTimeAgo(activity.timestamp, texts);

  return (
    <div className={cn(
      "flex items-start gap-3 relative",
      isRtl && "flex-row-reverse"
    )}>
      {/* Icon */}
      <div className={cn(
        "relative z-10 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
        config.bgColor
      )}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0 pt-1", isRtl && "text-right")}>
        <p className="text-sm">
          <span className="font-medium">{activity.memberName}</span>
          {" "}
          <span className="text-muted-foreground">{actionLabel}</span>
        </p>
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground mt-0.5",
          isRtl && "flex-row-reverse"
        )}>
          <span>{timeAgo}</span>
          {activity.details && (
            <>
              <span>•</span>
              <span className="capitalize">{activity.details.toLowerCase()}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: string, texts: Record<string, string>): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return texts.just_now;
  if (diffMins === 1) return `1 ${texts.min_ago}`;
  if (diffMins < 60) return `${diffMins} ${texts.mins_ago}`;
  if (diffHours === 1) return `1 ${texts.hour_ago}`;
  return `${diffHours} ${texts.hours_ago}`;
}

function ActivityTimelineSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { ActivityTimelineSkeleton };
