"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  CalendarDays,
  CreditCard,
  Users,
  AlertCircle,
  Megaphone,
  Award,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  useTrainerNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@liyaqa/shared/queries/use-trainer-portal";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { cn, formatDateTime } from "@liyaqa/shared/utils";
import type { NotificationType } from "@liyaqa/shared/types/trainer-portal";

const text = {
  title: { en: "Notifications", ar: "الإشعارات" },
  subtitle: { en: "Stay updated on your training activities", ar: "ابق على اطلاع بأنشطة التدريب" },
  markAllRead: { en: "Mark All Read", ar: "تعليم الكل كمقروء" },
  noNotifications: { en: "No notifications", ar: "لا توجد إشعارات" },
  noNotificationsDesc: {
    en: "You're all caught up! No new notifications.",
    ar: "لا توجد إشعارات جديدة.",
  },
  previous: { en: "Previous", ar: "السابق" },
  next: { en: "Next", ar: "التالي" },
  markRead: { en: "Mark as read", ar: "تعليم كمقروء" },
  delete: { en: "Delete", ar: "حذف" },
  markedAllRead: { en: "All notifications marked as read", ar: "تم تعليم جميع الإشعارات كمقروءة" },
  deleted: { en: "Notification deleted", ar: "تم حذف الإشعار" },
};

const notificationIcons: Record<NotificationType, typeof Bell> = {
  SESSION_BOOKED: CalendarDays,
  SESSION_CANCELLED: AlertCircle,
  SESSION_REMINDER: Clock,
  NEW_CLIENT: Users,
  PAYMENT_PROCESSED: CreditCard,
  SCHEDULE_CHANGE: CalendarDays,
  CERTIFICATION_EXPIRING: Award,
  SYSTEM_ANNOUNCEMENT: Megaphone,
};

export default function TrainerNotificationsPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);

  const { toast } = useToast();

  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useTrainerNotifications({
    page,
    size: 20,
    sortBy: "createdAt",
    sortDirection: "DESC",
  });

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const handleMarkRead = async (notificationId: string) => {
    try {
      await markReadMutation.mutateAsync({ notificationId });
    } catch {
      // Silently handle
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      toast({
        description: t("markedAllRead"),
      });
    } catch {
      // Silently handle
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteMutation.mutateAsync({ notificationId });
      toast({
        description: t("deleted"),
      });
    } catch {
      // Silently handle
    }
  };

  const hasUnread = useMemo(
    () => data?.content?.some((n) => !n.isRead) ?? false,
    [data]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 me-2" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="py-4">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64 mt-1" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {isAr
              ? "فشل في تحميل الإشعارات"
              : "Failed to load notifications"}
          </CardContent>
        </Card>
      )}

      {/* Notification list */}
      {!isLoading && !error && (
        <>
          {!data?.content || data.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BellOff className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">{t("noNotifications")}</p>
                <p className="text-sm mt-1">{t("noNotificationsDesc")}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.content.map((notification) => {
                    const Icon =
                      notificationIcons[notification.notificationType] || Bell;
                    const title = isAr
                      ? notification.titleAr
                      : notification.titleEn;
                    const message = isAr
                      ? notification.messageAr
                      : notification.messageEn;

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-3 p-4 transition-colors",
                          !notification.isRead &&
                            "bg-primary/5 dark:bg-primary/10"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            notification.isRead
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                "text-sm truncate",
                                !notification.isRead
                                  ? "font-semibold"
                                  : "font-medium"
                              )}
                            >
                              {title}
                            </p>
                            {!notification.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          {message && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(notification.createdAt, locale)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleMarkRead(notification.id)}
                              disabled={markReadMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(notification.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                {t("previous")}
              </Button>
              <span className="flex items-center px-4 text-sm">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
              >
                {t("next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
