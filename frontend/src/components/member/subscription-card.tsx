"use client";

import { useLocale, useTranslations } from "next-intl";
import { Calendar, CreditCard, Clock, Snowflake } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SubscriptionLite } from "@/types/member-portal";

interface SubscriptionCardProps {
  subscription: SubscriptionLite | null | undefined;
  hasSubscription: boolean;
  className?: string;
  compact?: boolean;
}

export function SubscriptionCard({
  subscription,
  hasSubscription,
  className,
  compact = false,
}: SubscriptionCardProps) {
  const t = useTranslations("member.home");
  const tSub = useTranslations("subscriptions");
  const locale = useLocale();

  if (!hasSubscription || !subscription) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader className={compact ? "pb-2" : ""}>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-neutral-400" />
            {t("mySubscription")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-500 text-sm">{t("noActiveSubscription")}</p>
        </CardContent>
      </Card>
    );
  }

  const planName =
    locale === "ar"
      ? subscription.planName?.ar || subscription.planName?.en
      : subscription.planName?.en;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      ACTIVE: { variant: "default", label: tSub("active") },
      FROZEN: { variant: "secondary", label: tSub("frozen") },
      CANCELLED: { variant: "destructive", label: tSub("cancelled") },
      EXPIRED: { variant: "outline", label: tSub("expired") },
      PENDING: { variant: "outline", label: locale === "ar" ? "قيد الانتظار" : "Pending" },
      PENDING_PAYMENT: { variant: "outline", label: locale === "ar" ? "بانتظار الدفع" : "Pending Payment" },
    };
    const { variant, label } = statusMap[status] || { variant: "outline" as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate progress for days remaining
  const startDate = new Date(subscription.startDate);
  const endDate = new Date(subscription.endDate);
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const progressPercent =
    totalDays > 0
      ? Math.max(0, Math.min(100, ((totalDays - subscription.daysRemaining) / totalDays) * 100))
      : 0;

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{planName}</span>
            {getStatusBadge(subscription.status)}
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {subscription.daysRemaining} {t("daysRemaining")}
            </span>
            {subscription.classesRemaining !== undefined && (
              <span>{subscription.classesRemaining} {t("remainingClasses")}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("mySubscription")}
          </CardTitle>
          {getStatusBadge(subscription.status)}
        </div>
        <CardDescription>{planName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date range */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-neutral-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(subscription.startDate)}</span>
          </div>
          <span className="text-neutral-400">-</span>
          <div className="flex items-center gap-2 text-neutral-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(subscription.endDate)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              {subscription.daysRemaining} {t("daysRemaining")}
            </span>
            <span className="text-neutral-500">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {subscription.classesRemaining !== undefined && (
            <div className="text-center p-3 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {subscription.classesRemaining}
              </div>
              <div className="text-xs text-neutral-600">{t("remainingClasses")}</div>
            </div>
          )}
          {subscription.freezeDaysRemaining > 0 && (
            <div className="text-center p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <Snowflake className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">
                  {subscription.freezeDaysRemaining}
                </span>
              </div>
              <div className="text-xs text-neutral-600">
                {locale === "ar" ? "أيام تجميد متبقية" : "Freeze days left"}
              </div>
            </div>
          )}
          {subscription.guestPassesRemaining > 0 && (
            <div className="text-center p-3 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {subscription.guestPassesRemaining}
              </div>
              <div className="text-xs text-neutral-600">
                {locale === "ar" ? "تصاريح ضيوف" : "Guest passes"}
              </div>
            </div>
          )}
        </div>

        {/* Frozen status */}
        {subscription.frozenAt && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <Snowflake className="h-4 w-4" />
            <span>
              {locale === "ar" ? "مجمد منذ" : "Frozen since"}{" "}
              {formatDate(subscription.frozenAt)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
