"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Building2,
  Handshake,
  CreditCard,
  Receipt,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@liyaqa/shared/components/ui/popover";
import { ScrollArea } from "@liyaqa/shared/components/ui/scroll-area";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { cn } from "@liyaqa/shared/utils";

export interface PlatformNotification {
  id: string;
  type: "client" | "deal" | "subscription" | "invoice" | "alert" | "info";
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

interface PlatformNotificationCenterProps {
  notifications: PlatformNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
}

const notificationIcons: Record<string, React.ElementType> = {
  client: Building2,
  deal: Handshake,
  subscription: CreditCard,
  invoice: Receipt,
  alert: AlertTriangle,
  info: Info,
};

const notificationColors: Record<string, string> = {
  client: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  deal: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  subscription: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  invoice: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  alert: "bg-red-500/10 text-red-600 dark:text-red-400",
  info: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

function formatTimeAgo(timestamp: string, locale: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (locale === "ar") {
    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString("ar-SA");
  }

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-SA");
}

export function PlatformNotificationCenter({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
}: Partial<PlatformNotificationCenterProps>) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [open, setOpen] = React.useState(false);

  const texts = {
    notifications: locale === "ar" ? "الإشعارات" : "Notifications",
    markAllRead: locale === "ar" ? "تحديد الكل كمقروء" : "Mark all as read",
    noNotifications: locale === "ar" ? "لا توجد إشعارات" : "No notifications",
    viewAll: locale === "ar" ? "عرض الكل" : "View All",
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center",
                "rounded-full bg-red-500 text-[10px] font-bold text-white"
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={isRtl ? "start" : "end"}
        className="w-[380px] p-0 dark:border-neutral-800"
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between p-4 border-b dark:border-neutral-800",
            isRtl && "flex-row-reverse"
          )}
        >
          <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
            <h4 className="font-semibold text-sm">{texts.notifications}</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => {
                onMarkAllAsRead?.();
              }}
            >
              <CheckCheck className="h-3 w-3" />
              {texts.markAllRead}
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">{texts.noNotifications}</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="divide-y dark:divide-neutral-800">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    locale={locale}
                    isRtl={isRtl}
                    onMarkAsRead={onMarkAsRead}
                    onDismiss={onDismiss}
                    onClose={() => setOpen(false)}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t dark:border-neutral-800">
            <Link href={`/${locale}/notifications`}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setOpen(false)}
              >
                {texts.viewAll}
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: PlatformNotification;
  locale: string;
  isRtl: boolean;
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onClose: () => void;
}

function NotificationItem({
  notification,
  locale,
  isRtl,
  onMarkAsRead,
  onDismiss,
  onClose,
}: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || Info;
  const colorClass = notificationColors[notification.type] || notificationColors.info;

  const title =
    locale === "ar" && notification.titleAr ? notification.titleAr : notification.title;
  const message =
    locale === "ar" && notification.messageAr ? notification.messageAr : notification.message;

  const content = (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "group relative flex gap-3 p-3 transition-colors hover:bg-muted/50",
        !notification.read && "bg-primary/5",
        isRtl && "flex-row-reverse"
      )}
    >
      {/* Icon */}
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isRtl && "text-right")}>
        <div className={cn("flex items-start justify-between gap-2", isRtl && "flex-row-reverse")}>
          <p className={cn("text-sm font-medium leading-tight", !notification.read && "font-semibold")}>
            {title}
          </p>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{message}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatTimeAgo(notification.timestamp, locale)}
        </p>
      </div>

      {/* Actions (visible on hover) */}
      <div
        className={cn(
          "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
          isRtl ? "left-2" : "right-2"
        )}
      >
        {!notification.read && onMarkAsRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDismiss(notification.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} onClick={onClose}>
        {content}
      </Link>
    );
  }

  return content;
}

// Demo notifications for development
export const demoNotifications: PlatformNotification[] = [
  {
    id: "1",
    type: "deal",
    title: "Deal won: Fitness Pro",
    titleAr: "صفقة مربوحة: Fitness Pro",
    message: "The deal with Fitness Pro worth SAR 25,000 has been won.",
    messageAr: "تم الفوز بالصفقة مع Fitness Pro بقيمة 25,000 ريال",
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actionUrl: "/deals/1",
  },
  {
    id: "2",
    type: "subscription",
    title: "Subscription expiring",
    titleAr: "اشتراك ينتهي قريباً",
    message: "GymWorld subscription expires in 7 days. Contact them for renewal.",
    messageAr: "اشتراك GymWorld ينتهي خلال 7 أيام. تواصل معهم للتجديد.",
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actionUrl: "/client-subscriptions/2",
  },
  {
    id: "3",
    type: "invoice",
    title: "Invoice overdue",
    titleAr: "فاتورة متأخرة",
    message: "Invoice #INV-2024-0045 for Iron Gym is 15 days overdue.",
    messageAr: "الفاتورة #INV-2024-0045 لـ Iron Gym متأخرة 15 يوماً.",
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actionUrl: "/client-invoices/3",
  },
  {
    id: "4",
    type: "client",
    title: "New client onboarded",
    titleAr: "عميل جديد",
    message: "Elite Fitness has completed onboarding and is now active.",
    messageAr: "Elite Fitness أكمل عملية التسجيل وهو نشط الآن.",
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actionUrl: "/clients/4",
  },
  {
    id: "5",
    type: "alert",
    title: "System maintenance",
    titleAr: "صيانة النظام",
    message: "Scheduled maintenance on Sunday 2 AM - 4 AM SAT.",
    messageAr: "صيانة مجدولة يوم الأحد 2 - 4 صباحاً بتوقيت السعودية.",
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];
