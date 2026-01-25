"use client";

import { useLocale } from "next-intl";
import { Coins, TrendingUp, Gift, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { LoyaltyTierBadge, getTierLabel } from "./loyalty-tier-badge";
import type { MemberPoints } from "@/types/loyalty";

interface PointsBalanceCardProps {
  memberPoints: MemberPoints | null | undefined;
  isLoading?: boolean;
}

export function PointsBalanceCard({
  memberPoints,
  isLoading = false,
}: PointsBalanceCardProps) {
  const locale = useLocale();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!memberPoints) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {locale === "ar" ? "نقاط الولاء" : "Loyalty Points"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "لا توجد نقاط ولاء بعد"
              : "No loyalty points yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressToNextTier =
    memberPoints.pointsToNextTier && memberPoints.nextTier
      ? Math.min(
          100,
          ((memberPoints.lifetimeEarned /
            (memberPoints.lifetimeEarned + memberPoints.pointsToNextTier)) *
            100)
        )
      : 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {locale === "ar" ? "نقاط الولاء" : "Loyalty Points"}
          </CardTitle>
          <LoyaltyTierBadge tier={memberPoints.tier} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div className="flex items-center gap-3">
          <Coins className="h-8 w-8 text-primary" />
          <div>
            <p className="text-3xl font-bold">
              {memberPoints.pointsBalance.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "رصيد النقاط" : "Points Balance"}
            </p>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {memberPoints.nextTier && memberPoints.pointsToNextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {locale === "ar"
                  ? `${memberPoints.pointsToNextTier.toLocaleString()} نقطة للـ${getTierLabel(memberPoints.nextTier, locale)}`
                  : `${memberPoints.pointsToNextTier.toLocaleString()} points to ${getTierLabel(memberPoints.nextTier, locale)}`}
              </span>
            </div>
            <Progress value={progressToNextTier} className="h-2" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium">
                {memberPoints.lifetimeEarned.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "إجمالي المكتسب" : "Total Earned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <Gift className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-sm font-medium">
                {memberPoints.lifetimeRedeemed.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "إجمالي المستبدل" : "Total Redeemed"}
              </p>
            </div>
          </div>
        </div>

        {/* Redemption Value */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {locale === "ar" ? "قيمة الاستبدال" : "Redemption Value"}
            </span>
          </div>
          <span className="font-medium">
            {locale === "ar" ? "ر.س" : "SAR"}{" "}
            {memberPoints.redemptionValue.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
