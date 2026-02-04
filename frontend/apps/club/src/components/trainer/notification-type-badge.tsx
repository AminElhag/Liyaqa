"use client";

import { useLocale } from "next-intl";
import {
  Calendar,
  XCircle,
  Bell,
  UserPlus,
  DollarSign,
  CalendarClock,
  AlertTriangle,
  Megaphone,
} from "lucide-react";
import type { NotificationType } from "@liyaqa/shared/types/trainer-portal";
import { cn } from "@liyaqa/shared/utils";

interface NotificationTypeBadgeProps {
  type: NotificationType;
  className?: string;
}

const typeConfig: Record<
  NotificationType,
  {
    labelEn: string;
    labelAr: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  SESSION_BOOKED: {
    labelEn: "Session Booked",
    labelAr: "جلسة محجوزة",
    icon: Calendar,
    color: "text-green-600",
  },
  SESSION_CANCELLED: {
    labelEn: "Session Cancelled",
    labelAr: "جلسة ملغاة",
    icon: XCircle,
    color: "text-red-600",
  },
  SESSION_REMINDER: {
    labelEn: "Reminder",
    labelAr: "تذكير",
    icon: Bell,
    color: "text-blue-600",
  },
  NEW_CLIENT: {
    labelEn: "New Client",
    labelAr: "عميل جديد",
    icon: UserPlus,
    color: "text-purple-600",
  },
  PAYMENT_PROCESSED: {
    labelEn: "Payment Processed",
    labelAr: "دفعة معالجة",
    icon: DollarSign,
    color: "text-teal-600",
  },
  SCHEDULE_CHANGE: {
    labelEn: "Schedule Change",
    labelAr: "تغيير الجدول",
    icon: CalendarClock,
    color: "text-amber-600",
  },
  CERTIFICATION_EXPIRING: {
    labelEn: "Certification Expiring",
    labelAr: "شهادة تنتهي قريباً",
    icon: AlertTriangle,
    color: "text-orange-600",
  },
  SYSTEM_ANNOUNCEMENT: {
    labelEn: "Announcement",
    labelAr: "إعلان",
    icon: Megaphone,
    color: "text-indigo-600",
  },
};

export function NotificationTypeBadge({
  type,
  className,
}: NotificationTypeBadgeProps) {
  const locale = useLocale();
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon className={cn("h-4 w-4", config.color)} />
      <span className="text-sm">
        {locale === "ar" ? config.labelAr : config.labelEn}
      </span>
    </div>
  );
}
