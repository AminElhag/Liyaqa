"use client";

import { useLocale } from "next-intl";
import {
  Building2,
  Handshake,
  CreditCard,
  FileText,
  UserPlus,
  Check,
  X,
  DollarSign,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { RecentActivity } from "@/types/platform";

interface RecentActivityFeedProps {
  activities: RecentActivity[];
}

// Activity type to icon mapping
const ACTIVITY_ICONS: Record<string, typeof Building2> = {
  CLIENT_ONBOARDED: Building2,
  CLIENT_ACTIVATED: Check,
  CLIENT_SUSPENDED: X,
  DEAL_CREATED: Handshake,
  DEAL_QUALIFIED: Check,
  DEAL_WON: Check,
  DEAL_LOST: X,
  DEAL_CONVERTED: Building2,
  SUBSCRIPTION_CREATED: CreditCard,
  SUBSCRIPTION_ACTIVATED: Check,
  SUBSCRIPTION_RENEWED: RefreshCw,
  SUBSCRIPTION_CANCELLED: X,
  INVOICE_CREATED: FileText,
  INVOICE_ISSUED: FileText,
  INVOICE_PAID: DollarSign,
  USER_CREATED: UserPlus,
};

// Activity type to color mapping
const ACTIVITY_COLORS: Record<string, string> = {
  CLIENT_ONBOARDED: "bg-blue-100 text-blue-600",
  CLIENT_ACTIVATED: "bg-green-100 text-green-600",
  CLIENT_SUSPENDED: "bg-red-100 text-red-600",
  DEAL_CREATED: "bg-purple-100 text-purple-600",
  DEAL_QUALIFIED: "bg-blue-100 text-blue-600",
  DEAL_WON: "bg-green-100 text-green-600",
  DEAL_LOST: "bg-red-100 text-red-600",
  DEAL_CONVERTED: "bg-green-100 text-green-600",
  SUBSCRIPTION_CREATED: "bg-blue-100 text-blue-600",
  SUBSCRIPTION_ACTIVATED: "bg-green-100 text-green-600",
  SUBSCRIPTION_RENEWED: "bg-blue-100 text-blue-600",
  SUBSCRIPTION_CANCELLED: "bg-red-100 text-red-600",
  INVOICE_CREATED: "bg-yellow-100 text-yellow-600",
  INVOICE_ISSUED: "bg-blue-100 text-blue-600",
  INVOICE_PAID: "bg-green-100 text-green-600",
  USER_CREATED: "bg-purple-100 text-purple-600",
};

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const locale = useLocale();

  const getActivityIcon = (type: string) => {
    return ACTIVITY_ICONS[type] || Clock;
  };

  const getActivityColor = (type: string) => {
    return ACTIVITY_COLORS[type] || "bg-neutral-100 text-neutral-600";
  };

  // Format relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return locale === "ar" ? "الآن" : "Just now";
    } else if (diffMins < 60) {
      return locale === "ar"
        ? `منذ ${diffMins} دقيقة`
        : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return locale === "ar"
        ? `منذ ${diffHours} ساعة`
        : `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return locale === "ar"
        ? `منذ ${diffDays} يوم`
        : `${diffDays}d ago`;
    } else {
      return formatDateTime(timestamp, locale);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === "ar" ? "النشاط الأخير" : "Recent Activity"}
        </CardTitle>
        <CardDescription>
          {locale === "ar"
            ? "آخر الأحداث على المنصة"
            : "Latest platform events"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute start-4 top-0 bottom-0 w-px bg-neutral-200" />

            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = getActivityIcon(activity.activityType);
                const colorClass = getActivityColor(activity.activityType);

                return (
                  <div
                    key={`${activity.entityId}-${index}`}
                    className="relative flex gap-4 ps-10"
                  >
                    {/* Icon */}
                    <div
                      className={`absolute start-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {getRelativeTime(activity.timestamp)}
                        </span>
                        {activity.userEmail && (
                          <>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {activity.userEmail}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">
              {locale === "ar" ? "لا يوجد نشاط حديث" : "No recent activity"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
