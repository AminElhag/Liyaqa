"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bell,
  BellOff,
  Check,
  Calendar,
  Receipt,
  CreditCard,
  Megaphone,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { cn } from "@liyaqa/shared/utils";
import {
  useMyNotifications,
  useUnreadNotificationCount,
  useMarkAllNotificationsAsRead,
} from "@liyaqa/shared/queries/use-member-portal";
import { toast } from "sonner";
import type { NotificationLite } from "@liyaqa/shared/types/member-portal";

export default function NotificationsPage() {
  const t = useTranslations("member.notifications");
  const locale = useLocale();
  const [activeTab, setActiveTab] = React.useState("all");

  const { data: unreadCountData } = useUnreadNotificationCount();
  const { data: allNotifications, isLoading: allLoading } = useMyNotifications({ size: 50 });
  const { data: unreadNotifications, isLoading: unreadLoading } = useMyNotifications({
    unreadOnly: true,
    size: 50,
  });

  const markAllReadMutation = useMarkAllNotificationsAsRead({
    onSuccess: () => {
      toast.success(
        locale === "ar"
          ? "تم تعليم جميع الإشعارات كمقروءة"
          : "All notifications marked as read"
      );
    },
    onError: () => {
      toast.error(
        locale === "ar"
          ? "فشل في تعليم الإشعارات"
          : "Failed to mark notifications"
      );
    },
  });

  const unreadCount = unreadCountData?.unreadCount ?? 0;

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      BOOKING_REMINDER: <Calendar className="h-5 w-5 text-blue-500" />,
      BOOKING_CANCELLED: <Calendar className="h-5 w-5 text-danger" />,
      SUBSCRIPTION_EXPIRING: <CreditCard className="h-5 w-5 text-amber-500" />,
      SUBSCRIPTION_EXPIRED: <CreditCard className="h-5 w-5 text-danger" />,
      INVOICE_CREATED: <Receipt className="h-5 w-5 text-green-500" />,
      INVOICE_OVERDUE: <Receipt className="h-5 w-5 text-danger" />,
      PROMOTION: <Megaphone className="h-5 w-5 text-purple-500" />,
      SYSTEM: <AlertCircle className="h-5 w-5 text-neutral-500" />,
    };
    return iconMap[type] || <Bell className="h-5 w-5 text-neutral-500" />;
  };

  const NotificationItem = ({ notification }: { notification: NotificationLite }) => {
    const title =
      locale === "ar"
        ? notification.title?.ar || notification.title?.en
        : notification.title?.en;
    const message =
      locale === "ar"
        ? notification.message?.ar || notification.message?.en
        : notification.message?.en;
    const isUnread = !notification.readAt;

    return (
      <div
        className={cn(
          "flex gap-4 p-4 border-b last:border-0 transition-colors",
          isUnread && "bg-primary/5"
        )}
      >
        <div className="shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn("font-medium", isUnread && "font-semibold")}>
              {title}
            </h3>
            {isUnread && (
              <Badge variant="default" className="shrink-0">
                {locale === "ar" ? "جديد" : "New"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-neutral-600 mt-1">{message}</p>
          <p className="text-xs text-neutral-400 mt-2">
            {new Date(notification.createdAt).toLocaleDateString(
              locale === "ar" ? "ar-SA" : "en-US",
              {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }
            )}
          </p>
        </div>
      </div>
    );
  };

  const notifications =
    activeTab === "unread"
      ? unreadNotifications?.items ?? []
      : allNotifications?.items ?? [];
  const isLoading = activeTab === "unread" ? unreadLoading : allLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          {unreadCount > 0 && (
            <p className="text-neutral-500">
              {unreadCount} {t("unread")}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="h-4 w-4 me-2" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t("all")}</TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            {t("unreadOnly")}
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-danger text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length > 0 ? (
                <div>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BellOff className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                  <h3 className="font-medium text-lg mb-2">
                    {activeTab === "unread" ? t("noUnread") : t("noNotifications")}
                  </h3>
                  <p className="text-neutral-500 text-sm">
                    {locale === "ar"
                      ? "ستظهر إشعاراتك هنا"
                      : "Your notifications will appear here"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
