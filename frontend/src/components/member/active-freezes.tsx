"use client";

import { useLocale } from "next-intl";
import { Snowflake, Calendar, Clock, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useActiveFreeze,
  useSubscriptionFreezeHistory,
  useUnfreezeSubscriptionWithTracking,
} from "@/queries/use-freeze-packages";
import type { FreezeHistory, FreezeType } from "@/types/freeze";
import { format, differenceInDays } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface ActiveFreezesProps {
  subscriptionId: string;
}

const FREEZE_TYPE_LABELS: Record<FreezeType, { en: string; ar: string }> = {
  MEDICAL: { en: "Medical", ar: "طبي" },
  TRAVEL: { en: "Travel", ar: "سفر" },
  PERSONAL: { en: "Personal", ar: "شخصي" },
  MILITARY: { en: "Military Service", ar: "خدمة عسكرية" },
  OTHER: { en: "Other", ar: "أخرى" },
};

export function ActiveFreezes({ subscriptionId }: ActiveFreezesProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const { data: activeFreeze, isLoading: activeLoading } = useActiveFreeze(subscriptionId);
  const { data: historyData, isLoading: historyLoading } = useSubscriptionFreezeHistory(
    subscriptionId,
    { size: 10 }
  );
  const unfreezeMutation = useUnfreezeSubscriptionWithTracking();

  const handleUnfreeze = async () => {
    try {
      await unfreezeMutation.mutateAsync(subscriptionId);
      toast.success(
        isArabic
          ? "تم إلغاء تجميد الاشتراك بنجاح"
          : "Subscription unfrozen successfully"
      );
    } catch {
      toast.error(
        isArabic
          ? "فشل في إلغاء التجميد"
          : "Failed to unfreeze subscription"
      );
    }
  };

  const isLoading = activeLoading || historyLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "حالة التجميد" : "Freeze Status"}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Freeze */}
      {activeFreeze && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Snowflake className="h-5 w-5" />
              {isArabic ? "تجميد نشط" : "Active Freeze"}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? "اشتراكك مجمد حالياً"
                : "Your subscription is currently frozen"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {isArabic ? "تاريخ البدء:" : "Start Date:"}
                </span>
                <span className="font-medium">
                  {format(new Date(activeFreeze.freezeStartDate), "PPP", {
                    locale: dateLocale,
                  })}
                </span>
              </div>
              {activeFreeze.freezeEndDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {isArabic ? "تاريخ الانتهاء:" : "End Date:"}
                  </span>
                  <span className="font-medium">
                    {format(new Date(activeFreeze.freezeEndDate), "PPP", {
                      locale: dateLocale,
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {isArabic ? "مدة التجميد:" : "Duration:"}
              </span>
              <span className="font-medium">
                {activeFreeze.freezeDays}{" "}
                {isArabic ? "يوم" : "days"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {isArabic
                  ? FREEZE_TYPE_LABELS[activeFreeze.freezeType].ar
                  : FREEZE_TYPE_LABELS[activeFreeze.freezeType].en}
              </Badge>
            </div>

            {activeFreeze.reason && (
              <p className="text-sm text-muted-foreground">
                {activeFreeze.reason}
              </p>
            )}

            <Button
              onClick={handleUnfreeze}
              disabled={unfreezeMutation.isPending}
              className="w-full"
            >
              {unfreezeMutation.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="me-2 h-4 w-4" />
              )}
              {isArabic ? "إلغاء التجميد" : "Unfreeze Subscription"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Freeze History */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "سجل التجميد" : "Freeze History"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "سجل طلبات التجميد السابقة"
              : "History of your freeze requests"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyData?.content && historyData.content.length > 0 ? (
            <div className="space-y-3">
              {historyData.content.map((freeze) => (
                <FreezeHistoryItem
                  key={freeze.id}
                  freeze={freeze}
                  isArabic={isArabic}
                  dateLocale={dateLocale}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isArabic ? "لا يوجد سجل تجميد" : "No freeze history"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FreezeHistoryItem({
  freeze,
  isArabic,
  dateLocale,
}: {
  freeze: FreezeHistory;
  isArabic: boolean;
  dateLocale: typeof ar | typeof enUS;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant={freeze.isActive ? "default" : "secondary"}>
            {freeze.isActive
              ? isArabic
                ? "نشط"
                : "Active"
              : isArabic
              ? "منتهي"
              : "Completed"}
          </Badge>
          <Badge variant="outline">
            {isArabic
              ? FREEZE_TYPE_LABELS[freeze.freezeType].ar
              : FREEZE_TYPE_LABELS[freeze.freezeType].en}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(freeze.freezeStartDate), "PP", { locale: dateLocale })}
          {freeze.freezeEndDate &&
            ` - ${format(new Date(freeze.freezeEndDate), "PP", { locale: dateLocale })}`}
        </p>
      </div>
      <div className="text-end">
        <span className="font-medium">
          {freeze.freezeDays} {isArabic ? "يوم" : "days"}
        </span>
      </div>
    </div>
  );
}
