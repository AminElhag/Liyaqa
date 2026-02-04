"use client";

import { useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Trash2, Check } from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { NotificationTypeBadge } from "./notification-type-badge";
import type { TrainerNotificationResponse } from "@liyaqa/shared/types/trainer-portal";
import { cn } from "@liyaqa/shared/utils";

interface NotificationsListProps {
  notifications: TrainerNotificationResponse[];
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  isLoading?: boolean;
}

function formatTimeAgo(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: locale === "ar" ? ar : enUS,
    });
  } catch {
    return dateString;
  }
}

export function NotificationsList({
  notifications,
  onMarkAsRead,
  onDelete,
  isLoading = false,
}: NotificationsListProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    markAsRead: locale === "ar" ? "تحديد كمقروء" : "Mark as Read",
    delete: locale === "ar" ? "حذف" : "Delete",
    noNotifications:
      locale === "ar" ? "لا توجد إشعارات" : "No notifications",
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{texts.noNotifications}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={cn(
            "overflow-hidden transition-colors",
            !notification.isRead && "border-l-4 border-l-primary bg-primary/5"
          )}
        >
          <CardContent className="p-4">
            <div
              className={cn(
                "flex items-start justify-between gap-4",
                isRtl && "flex-row-reverse"
              )}
            >
              <div className={cn("flex-1 space-y-2", isRtl && "text-right")}>
                {/* Notification Type Badge */}
                <NotificationTypeBadge
                  type={notification.notificationType}
                  className={cn(isRtl && "flex-row-reverse")}
                />

                {/* Title */}
                <h3
                  className={cn(
                    "font-semibold",
                    !notification.isRead && "font-bold"
                  )}
                >
                  {locale === "ar" ? notification.titleAr : notification.titleEn}
                </h3>

                {/* Message */}
                {notification.messageEn && (
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar"
                      ? notification.messageAr
                      : notification.messageEn}
                  </p>
                )}

                {/* Time */}
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(notification.createdAt, locale)}
                </p>
              </div>

              {/* Actions */}
              <div className={cn("flex gap-2", isRtl && "flex-row-reverse")}>
                {!notification.isRead && onMarkAsRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMarkAsRead(notification.id)}
                    disabled={isLoading}
                    title={texts.markAsRead}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">{texts.markAsRead}</span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(notification.id)}
                    disabled={isLoading}
                    title={texts.delete}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">{texts.delete}</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
