"use client";

import { useLocale } from "next-intl";
import { Snowflake, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FreezeRequestForm } from "@/components/member/freeze-request-form";
import { ActiveFreezes } from "@/components/member/active-freezes";
import { useMySubscription } from "@/queries/use-member-portal";
import { useSubscriptionFreezeBalance, useActiveFreeze } from "@/queries/use-freeze-packages";

export default function MemberFreezePage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: subscriptionData, isLoading: subLoading } = useMySubscription();
  const subscriptionId = subscriptionData?.subscription?.id;

  const { data: balance, isLoading: balanceLoading } = useSubscriptionFreezeBalance(
    subscriptionId || "",
    { enabled: !!subscriptionId }
  );

  const { data: activeFreeze, isLoading: activeFreezeLoading } = useActiveFreeze(
    subscriptionId || "",
    { enabled: !!subscriptionId }
  );

  const isLoading = subLoading || balanceLoading || activeFreezeLoading;
  const hasSubscription = subscriptionData?.hasSubscription && subscriptionId;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "تجميد الاشتراك" : "Freeze Subscription"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic ? "إدارة تجميد اشتراكك" : "Manage your subscription freeze"}
          </p>
        </div>

        <Alert>
          <Snowflake className="h-4 w-4" />
          <AlertTitle>
            {isArabic ? "لا يوجد اشتراك نشط" : "No Active Subscription"}
          </AlertTitle>
          <AlertDescription>
            {isArabic
              ? "لا يمكنك طلب تجميد بدون اشتراك نشط."
              : "You cannot request a freeze without an active subscription."}
          </AlertDescription>
        </Alert>

        <Link href={`/${locale}/member/subscriptions`}>
          <Button variant="outline">
            <ArrowLeft className="me-2 h-4 w-4" />
            {isArabic ? "العودة إلى الاشتراكات" : "Back to Subscriptions"}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isArabic ? "تجميد الاشتراك" : "Freeze Subscription"}
        </h1>
        <p className="text-muted-foreground">
          {isArabic ? "إدارة تجميد اشتراكك" : "Manage your subscription freeze"}
        </p>
      </div>

      {/* Balance Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isArabic ? "رصيد التجميد" : "Freeze Balance"}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? "أيام التجميد المتاحة في اشتراكك"
              : "Available freeze days in your subscription"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-primary">
                {balance?.availableDays ?? subscriptionData?.subscription?.freezeDaysRemaining ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? "يوم متاح" : "days available"}
              </p>
            </div>
            {balance && (
              <div className="text-end text-sm text-muted-foreground">
                <p>
                  {isArabic ? "إجمالي:" : "Total:"} {balance.totalFreezeDays}
                </p>
                <p>
                  {isArabic ? "مستخدم:" : "Used:"} {balance.usedFreezeDays}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Freeze Request Form - only show if no active freeze */}
        {!activeFreeze && (
          <FreezeRequestForm
            subscriptionId={subscriptionId}
            balance={balance}
            maxDays={subscriptionData?.subscription?.freezeDaysRemaining ?? 30}
          />
        )}

        {/* Active Freezes & History */}
        <div className={!activeFreeze ? "" : "md:col-span-2"}>
          <ActiveFreezes subscriptionId={subscriptionId} />
        </div>
      </div>
    </div>
  );
}
