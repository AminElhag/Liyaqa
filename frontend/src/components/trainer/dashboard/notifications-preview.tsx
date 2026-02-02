"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, ArrowRight, ArrowLeft } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { NotificationsSummaryResponse } from "@/types/trainer-portal";

interface NotificationsPreviewProps {
  notifications: NotificationsSummaryResponse | undefined;
  isLoading?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

// Priority colors based on notification type
const priorityColors: Record<string, string> = {
  SESSION_BOOKED: "border-l-blue-500",
  SESSION_CANCELLED: "border-l-red-500",
  SESSION_REMINDER: "border-l-amber-500",
  NEW_CLIENT: "border-l-green-500",
  PAYMENT_PROCESSED: "border-l-teal-500",
  SCHEDULE_CHANGE: "border-l-amber-500",
  CERTIFICATION_EXPIRING: "border-l-red-500",
  SYSTEM_ANNOUNCEMENT: "border-l-gray-500",
};

export function NotificationsPreview({
  notifications,
  isLoading,
}: NotificationsPreviewProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dateLocale = locale === "ar" ? ar : enUS;

  if (isLoading || !notifications) {
    return <NotificationsPreviewSkeleton />;
  }

  const recentNotifications = notifications.recent.slice(0, 3);
  const hasMore = notifications.totalCount > 3;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border bg-card p-6 shadow-sm"
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between mb-4", isRtl && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          <h3 className="text-lg font-semibold">
            {locale === "ar" ? "الإشعارات" : "Notifications"}
          </h3>
          {notifications.unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 rounded-full">
              {notifications.unreadCount > 99 ? "99+" : notifications.unreadCount}
            </Badge>
          )}
        </div>
        <Link
          href={`/${locale}/trainer/notifications`}
          className={cn(
            "text-sm text-primary hover:underline flex items-center gap-1",
            isRtl && "flex-row-reverse"
          )}
        >
          <span>{locale === "ar" ? "عرض الكل" : "View All"}</span>
          {isRtl ? (
            <ArrowLeft className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Link>
      </div>

      {/* Notifications List */}
      {recentNotifications.length > 0 ? (
        <div className="space-y-3">
          {recentNotifications.map((notification, index) => {
            const title = locale === "ar" ? notification.titleAr : notification.titleEn;
            const message = locale === "ar" ? notification.messageAr : notification.messageEn;
            const timeAgo = formatDistanceToNow(parseISO(notification.createdAt), {
              addSuffix: true,
              locale: dateLocale,
            });

            return (
              <motion.div
                key={notification.id}
                custom={index}
                variants={itemVariants}
                className={cn(
                  "relative p-3 rounded-lg border-l-4",
                  priorityColors[notification.notificationType] || "border-l-gray-500",
                  notification.isRead ? "bg-muted/30" : "bg-primary/5",
                  isRtl && "border-l-0 border-r-4"
                )}
              >
                <div className={cn("flex items-start gap-3", isRtl && "flex-row-reverse")}>
                  <Bell
                    className={cn(
                      "h-4 w-4 mt-0.5 shrink-0",
                      notification.isRead ? "text-muted-foreground" : "text-primary"
                    )}
                  />
                  <div className={cn("flex-1 min-w-0", isRtl && "text-right")}>
                    <p
                      className={cn(
                        "text-sm font-medium mb-1",
                        notification.isRead ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {title}
                    </p>
                    {message && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {locale === "ar" ? "لا توجد إشعارات" : "No notifications"}
          </p>
        </div>
      )}

      {hasMore && (
        <div className="mt-4 text-center">
          <Link
            href={`/${locale}/trainer/notifications`}
            className="text-sm text-primary hover:underline"
          >
            {locale === "ar"
              ? `+ ${notifications.totalCount - 3} إشعارات أخرى`
              : `+ ${notifications.totalCount - 3} more notifications`}
          </Link>
        </div>
      )}
    </motion.div>
  );
}

function NotificationsPreviewSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg bg-muted border-l-4 border-l-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="h-4 w-4 bg-muted-foreground/20 rounded shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-muted-foreground/20 rounded mb-2" />
                <div className="h-3 w-full bg-muted-foreground/20 rounded mb-1" />
                <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { NotificationsPreviewSkeleton };
