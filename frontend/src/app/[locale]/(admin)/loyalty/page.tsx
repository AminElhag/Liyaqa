"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Award,
  Settings,
  Trophy,
  TrendingUp,
  Users,
  Gift,
  Coins,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { TierOverview, PointsEconomyHealth } from "@/components/loyalty";
import { cn } from "@/lib/utils";
import { useLoyaltyConfig, useLeaderboard } from "@/queries/use-loyalty";
import { getInitials } from "@/lib/utils";

const TIER_COLORS = {
  BRONZE: "bg-amber-700",
  SILVER: "bg-gray-400",
  GOLD: "bg-yellow-500",
  PLATINUM: "bg-slate-300",
};

const TIER_LABELS = {
  BRONZE: { en: "Bronze", ar: "برونزي" },
  SILVER: { en: "Silver", ar: "فضي" },
  GOLD: { en: "Gold", ar: "ذهبي" },
  PLATINUM: { en: "Platinum", ar: "بلاتيني" },
};

export default function LoyaltyDashboardPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const { data: config, isLoading: configLoading } = useLoyaltyConfig();
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard({ limit: 5 });

  const texts = {
    title: isRtl ? "برنامج الولاء" : "Loyalty Program",
    subtitle: isRtl ? "إدارة نقاط الولاء والمكافآت" : "Manage loyalty points and rewards",
    settings: isRtl ? "الإعدادات" : "Settings",
    leaderboard: isRtl ? "المتصدرين" : "Leaderboard",
    viewLeaderboard: isRtl ? "عرض الكل" : "View All",
    programStatus: isRtl ? "حالة البرنامج" : "Program Status",
    enabled: isRtl ? "مفعل" : "Enabled",
    disabled: isRtl ? "معطل" : "Disabled",
    pointsPerCheckin: isRtl ? "نقاط لكل حضور" : "Points per Check-in",
    pointsPerReferral: isRtl ? "نقاط لكل إحالة" : "Points per Referral",
    pointsExpiry: isRtl ? "صلاحية النقاط" : "Points Expiry",
    months: isRtl ? "شهر" : "months",
    redemptionValue: isRtl ? "قيمة الاستبدال" : "Redemption Value",
    pointsEqual: isRtl ? "نقطة =" : "pts =",
    sar: isRtl ? "ريال" : "SAR",
    quickStats: isRtl ? "إحصائيات سريعة" : "Quick Stats",
    topMembers: isRtl ? "أفضل الأعضاء" : "Top Members",
    rank: isRtl ? "الترتيب" : "Rank",
    points: isRtl ? "النقاط" : "Points",
    noLeaderboard: isRtl ? "لا يوجد أعضاء في المتصدرين" : "No members in leaderboard yet",
  };

  if (configLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={texts.title}
        description={texts.subtitle}
      >
        <Button asChild variant="outline">
          <Link href="/settings/loyalty">
            <Settings className="me-2 h-4 w-4" />
            {texts.settings}
          </Link>
        </Button>
      </PageHeader>

      {/* Program Status Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className={cn("flex items-center justify-between flex-wrap gap-4", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
              <div className={cn(
                "h-10 w-10 rounded-md3-md flex items-center justify-center",
                config?.enabled ? "bg-green-100" : "bg-red-100"
              )}>
                <Award className={cn(
                  "h-5 w-5",
                  config?.enabled ? "text-green-600" : "text-red-600"
                )} />
              </div>
              <div>
                <p className={cn("text-sm text-muted-foreground", isRtl && "text-right")}>
                  {texts.programStatus}
                </p>
                <Badge variant={config?.enabled ? "default" : "secondary"}>
                  {config?.enabled ? texts.enabled : texts.disabled}
                </Badge>
              </div>
            </div>

            {config?.enabled && (
              <div className={cn("flex items-center gap-6 flex-wrap", isRtl && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{config.pointsPerCheckin}</strong> {texts.pointsPerCheckin}
                  </span>
                </div>
                <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{config.pointsPerReferral}</strong> {texts.pointsPerReferral}
                  </span>
                </div>
                <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>100</strong> {texts.pointsEqual} <strong>{(100 * config.redemptionRateSar).toFixed(2)}</strong> {texts.sar}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tier Distribution */}
      <TierOverview />

      {/* Points Economy - placeholder data for now */}
      <PointsEconomyHealth
        totalPointsIssued={125000}
        totalPointsRedeemed={45000}
        totalPointsExpired={5000}
        isLoading={false}
      />

      {/* Leaderboard Preview */}
      <Card>
        <CardHeader className={cn("flex flex-row items-center justify-between", isRtl && "flex-row-reverse")}>
          <div>
            <CardTitle className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <Trophy className="h-5 w-5 text-yellow-500" />
              {texts.topMembers}
            </CardTitle>
            <CardDescription>{texts.leaderboard}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/loyalty/leaderboard" className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}>
              {texts.viewLeaderboard}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {leaderboardLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16 ms-auto" />
                </div>
              ))}
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.memberId}
                  className={cn(
                    "flex items-center gap-4 p-2 rounded-md3-md hover:bg-muted/50 transition-colors",
                    isRtl && "flex-row-reverse"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                    index === 0 ? "bg-yellow-100 text-yellow-700" :
                    index === 1 ? "bg-gray-100 text-gray-600" :
                    index === 2 ? "bg-amber-100 text-amber-700" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {entry.rank}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(`Member ${entry.rank}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className={cn("font-medium text-sm", isRtl && "text-right")}>
                      Member #{entry.memberId.slice(0, 8)}
                    </p>
                    <div className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}>
                      <span className={cn("h-2 w-2 rounded-full", TIER_COLORS[entry.tier])} />
                      <span className="text-xs text-muted-foreground">
                        {isRtl ? TIER_LABELS[entry.tier].ar : TIER_LABELS[entry.tier].en}
                      </span>
                    </div>
                  </div>
                  <div className={cn("text-right", isRtl && "text-left")}>
                    <p className="font-semibold">{entry.pointsBalance.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{texts.points}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">{texts.noLeaderboard}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
