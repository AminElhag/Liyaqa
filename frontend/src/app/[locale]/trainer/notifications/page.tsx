"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import {
  useTrainerNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/queries/use-trainer-portal";
import { useMyTrainerProfile } from "@/queries/use-trainers";
import { NotificationsList } from "@/components/trainer/notifications-list";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();

  // Get trainer profile
  const { data: trainerProfile } = useMyTrainerProfile();
  const trainerId = trainerProfile?.id;

  // State
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch notifications
  const { data: notificationsData, isLoading } = useTrainerNotifications({
    trainerId,
    isRead: filter === "UNREAD" ? false : undefined,
    page,
    size: pageSize,
    sortBy: "createdAt",
    sortDirection: "DESC",
  });

  // Fetch unread count
  const { data: unreadCount } = useUnreadNotificationsCount(trainerId);

  // Mutations
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const texts = {
    title: locale === "ar" ? "مركز الإشعارات" : "Notifications Center",
    description:
      locale === "ar"
        ? "عرض جميع الإشعارات والبقاء على اطلاع"
        : "View all notifications and stay updated",
    all: locale === "ar" ? "الكل" : "All",
    unread: locale === "ar" ? "غير المقروءة" : "Unread",
    markAllAsRead:
      locale === "ar" ? "تحديد الكل كمقروء" : "Mark All as Read",
    unreadCount: locale === "ar" ? "غير مقروءة" : "unread",
    showing: locale === "ar" ? "عرض" : "Showing",
    of: locale === "ar" ? "من" : "of",
    notifications: locale === "ar" ? "إشعار" : "notifications",
    loadMore: locale === "ar" ? "تحميل المزيد" : "Load More",
    error: locale === "ar" ? "خطأ" : "Error",
    markedAsRead:
      locale === "ar" ? "تم تحديد الإشعار كمقروء" : "Notification marked as read",
    allMarkedAsRead:
      locale === "ar"
        ? "تم تحديد جميع الإشعارات كمقروءة"
        : "All notifications marked as read",
    deleted: locale === "ar" ? "تم حذف الإشعار" : "Notification deleted",
  };

  const handleMarkAsRead = (notificationId: string) => {
    if (!trainerId) return;

    markAsRead.mutate(
      { notificationId, trainerId },
      {
        onSuccess: () => {
          toast({ title: texts.markedAsRead });
        },
        onError: (error: Error) => {
          toast({
            title: texts.error,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleMarkAllAsRead = () => {
    if (!trainerId) return;

    markAllAsRead.mutate(
      trainerId,
      {
        onSuccess: () => {
          toast({ title: texts.allMarkedAsRead });
        },
        onError: (error: Error) => {
          toast({
            title: texts.error,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = (notificationId: string) => {
    if (!trainerId) return;

    deleteNotification.mutate(
      { notificationId, trainerId },
      {
        onSuccess: () => {
          toast({ title: texts.deleted });
        },
        onError: (error: Error) => {
          toast({
            title: texts.error,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading && !notificationsData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  const totalNotifications = notificationsData?.totalElements || 0;
  const currentCount = notificationsData?.content?.length || 0;
  const hasMore = (page + 1) * pageSize < totalNotifications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div className={cn(isRtl && "text-right")}>
          <h1 className="text-3xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        {unreadCount && unreadCount.unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className={cn("h-4 w-4", !isRtl && "me-2", isRtl && "ms-2")} />
            {texts.markAllAsRead}
          </Button>
        )}
      </div>

      {/* Stats & Filter Card */}
      <Card>
        <CardHeader>
          <div
            className={cn(
              "flex items-center justify-between",
              isRtl && "flex-row-reverse"
            )}
          >
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {unreadCount && unreadCount.unreadCount > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({unreadCount.unreadCount} {texts.unreadCount})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {texts.showing} {currentCount} {texts.of} {totalNotifications} {texts.notifications}
              </CardDescription>
            </div>

            {/* Filter */}
            <Select
              value={filter}
              onValueChange={(value) => {
                setFilter(value as "ALL" | "UNREAD");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="UNREAD">{texts.unread}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <NotificationsList
            notifications={notificationsData?.content || []}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
            isLoading={
              markAsRead.isPending ||
              deleteNotification.isPending
            }
          />

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={isLoading}
              >
                {texts.loadMore}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
