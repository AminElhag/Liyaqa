"use client";

import { useLocale } from "next-intl";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Bell, Check, Trash2 } from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@liyaqa/shared/queries/platform/use-notifications";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { cn } from "@liyaqa/shared/utils";

export default function NotificationsPage() {
  const locale = useLocale();
  const { toast } = useToast();

  const { data: notifications, isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const texts = {
    title: locale === "ar" ? "الإشعارات" : "Notifications",
    description: locale === "ar" ? "مركز إشعارات المنصة" : "Platform notification center",
    markAllRead: locale === "ar" ? "تحديد الكل كمقروء" : "Mark all as read",
    noNotifications: locale === "ar" ? "لا توجد إشعارات" : "No notifications",
  };

  const typeColors: Record<string, string> = {
    INFO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    SUCCESS: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    WARNING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    ERROR: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    SYSTEM: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    } catch (error) {
      toast({ title: locale === "ar" ? "خطأ" : "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      toast({ title: locale === "ar" ? "تم" : "Success", description: locale === "ar" ? "تم تحديد جميع الإشعارات كمقروءة" : "All notifications marked as read" });
    } catch (error) {
      toast({ title: locale === "ar" ? "خطأ" : "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: locale === "ar" ? "تم" : "Success", description: locale === "ar" ? "تم حذف الإشعار" : "Notification deleted" });
    } catch (error) {
      toast({ title: locale === "ar" ? "خطأ" : "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            {texts.title}
            {unreadCount > 0 && (
              <Badge variant="default" className="rounded-full">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllRead} disabled={markAllReadMutation.isPending}>
            <Check className="me-2 h-4 w-4" />
            {texts.markAllRead}
          </Button>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{texts.noNotifications}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn("transition-all", !notification.read && "border-primary/50 bg-primary/5")}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Badge className={typeColors[notification.type] || typeColors.SYSTEM}>
                    {notification.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">
                      {locale === "ar" && notification.titleAr ? notification.titleAr : notification.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {locale === "ar" && notification.descriptionAr ? notification.descriptionAr : notification.descriptionEn}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.createdAt).toLocaleString(locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkRead(notification.id)} disabled={markReadMutation.isPending}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(notification.id)} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
