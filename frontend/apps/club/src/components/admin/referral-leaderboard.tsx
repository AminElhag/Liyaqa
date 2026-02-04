"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Trophy, Medal, Award, Users, MousePointer } from "lucide-react";
import type { ReferralCode } from "@liyaqa/shared/types/referral";

interface ReferralLeaderboardProps {
  topReferrers: ReferralCode[];
  isLoading?: boolean;
}

export function ReferralLeaderboard({ topReferrers, isLoading }: ReferralLeaderboardProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {isArabic ? "أفضل المحيلين" : "Top Referrers"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topReferrers || topReferrers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {isArabic ? "أفضل المحيلين" : "Top Referrers"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {isArabic ? "لا توجد إحالات بعد" : "No referrals yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {isArabic ? "أفضل المحيلين" : "Top Referrers"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topReferrers.map((referrer, index) => (
            <div
              key={referrer.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                index < 3 ? "bg-muted/50" : ""
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center">
                {getRankIcon(index)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{referrer.code}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MousePointer className="h-3 w-3" />
                    {referrer.clickCount} {isArabic ? "نقرات" : "clicks"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {referrer.conversionCount} {isArabic ? "تحويلات" : "conversions"}
                  </span>
                </div>
              </div>
              <Badge variant={referrer.isActive ? "default" : "secondary"}>
                {referrer.isActive
                  ? isArabic
                    ? "نشط"
                    : "Active"
                  : isArabic
                  ? "غير نشط"
                  : "Inactive"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
