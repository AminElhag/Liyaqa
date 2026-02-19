"use client";

import { useLocale, useTranslations } from "next-intl";
import { Calendar, CreditCard, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@liyaqa/shared/components/ui/alert";
import { SubscriptionCard } from "@/components/member/subscription-card";
import { useMySubscription, useMyAttendance } from "@liyaqa/shared/queries/use-member-portal";

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
      <div>
        <h1 className="text-2xl font-bold">{t("mySubscription")}</h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "إدارة اشتراكك وسجل الحضور"
            : "Manage your subscription and attendance"}
        </p>
      </div>

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
                    className="py-3 px-3 flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(attendance.checkInTime).toLocaleDateString(
                          locale === "ar" ? "ar-SA" : "en-US",
                          { weekday: "short", month: "short", day: "numeric" }
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
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
                      <div className="bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground">
                        {Math.round(attendance.duration / 60)}{" "}
                        {locale === "ar" ? "دقيقة" : "min"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {locale === "ar" ? "لا يوجد سجل حضور" : "No attendance records"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
