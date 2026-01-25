"use client";

import { useLocale, useTranslations } from "next-intl";
import { CreditCard, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubscriptionCard } from "@/components/member/subscription-card";
import { useMySubscription, useMyAttendance } from "@/queries/use-member-portal";

export default function SubscriptionsPage() {
  const t = useTranslations("member.home");
  const locale = useLocale();

  const { data: subscriptionData, isLoading: subscriptionLoading } = useMySubscription();
  const { data: attendanceData, isLoading: attendanceLoading } = useMyAttendance({ size: 10 });

  if (subscriptionLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("mySubscription")}</h1>

      {/* Current Subscription */}
      <SubscriptionCard
        subscription={subscriptionData?.subscription}
        hasSubscription={subscriptionData?.hasSubscription ?? false}
      />

      {/* Info alert for no subscription */}
      {!subscriptionData?.hasSubscription && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>
            {locale === "ar" ? "لا يوجد اشتراك نشط" : "No Active Subscription"}
          </AlertTitle>
          <AlertDescription>
            {locale === "ar"
              ? "تواصل مع موظفي النادي للاشتراك في إحدى خططنا"
              : "Contact our staff to subscribe to one of our membership plans"}
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Attendance */}
      {subscriptionData?.hasSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {locale === "ar" ? "سجل الحضور الأخير" : "Recent Attendance"}
            </CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "آخر 10 زيارات للنادي"
                : "Last 10 gym visits"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : attendanceData?.items && attendanceData.items.length > 0 ? (
              <div className="divide-y">
                {attendanceData.items.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(attendance.checkInTime).toLocaleDateString(
                          locale === "ar" ? "ar-SA" : "en-US",
                          { weekday: "short", month: "short", day: "numeric" }
                        )}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {new Date(attendance.checkInTime).toLocaleTimeString(
                          locale === "ar" ? "ar-SA" : "en-US",
                          { hour: "numeric", minute: "2-digit" }
                        )}
                        {attendance.checkOutTime && (
                          <>
                            {" - "}
                            {new Date(attendance.checkOutTime).toLocaleTimeString(
                              locale === "ar" ? "ar-SA" : "en-US",
                              { hour: "numeric", minute: "2-digit" }
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    {attendance.duration && (
                      <div className="text-sm text-neutral-600">
                        {Math.round(attendance.duration / 60)}{" "}
                        {locale === "ar" ? "دقيقة" : "min"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-center py-6">
                {locale === "ar" ? "لا يوجد سجل حضور" : "No attendance records"}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
