"use client";

import { useLocale } from "next-intl";
import { Award, TrendingUp, Users, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLoyaltyConfig, useMembersByTier } from "@/queries/use-loyalty";
import type { LoyaltyTier } from "@/types/loyalty";

const TIER_COLORS: Record<LoyaltyTier, { bg: string; text: string; border: string }> = {
  BRONZE: { bg: "bg-amber-700", text: "text-amber-700", border: "border-amber-700" },
  SILVER: { bg: "bg-gray-400", text: "text-gray-500", border: "border-gray-400" },
  GOLD: { bg: "bg-yellow-500", text: "text-yellow-600", border: "border-yellow-500" },
  PLATINUM: { bg: "bg-slate-300", text: "text-slate-600", border: "border-slate-400" },
};

const TIER_LABELS = {
  BRONZE: { en: "Bronze", ar: "برونزي" },
  SILVER: { en: "Silver", ar: "فضي" },
  GOLD: { en: "Gold", ar: "ذهبي" },
  PLATINUM: { en: "Platinum", ar: "بلاتيني" },
};

interface TierCardProps {
  tier: LoyaltyTier;
  count: number;
  percentage: number;
  isLoading?: boolean;
}

function TierCard({ tier, count, percentage, isLoading }: TierCardProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const colors = TIER_COLORS[tier];
  const label = TIER_LABELS[tier];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-l-4", colors.border)}>
      <CardContent className="p-4">
        <div className={cn("flex items-center gap-2 mb-2", isRtl && "flex-row-reverse")}>
          <span className={cn("h-3 w-3 rounded-full", colors.bg)} />
          <span className="text-sm font-medium text-muted-foreground">
            {isRtl ? label.ar : label.en}
          </span>
        </div>
        <div className={cn("flex items-baseline gap-2", isRtl && "flex-row-reverse")}>
          <span className={cn("text-2xl font-bold", colors.text)}>{count.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">
            {isRtl ? "عضو" : "members"}
          </span>
        </div>
        <Progress value={percentage} className="mt-2 h-1.5" />
        <span className="text-xs text-muted-foreground mt-1 block">
          {percentage.toFixed(1)}%
        </span>
      </CardContent>
    </Card>
  );
}

export function TierOverview() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const { data: config, isLoading: configLoading } = useLoyaltyConfig();

  // Get members by tier - we'll fetch all tiers
  const { data: bronzeData, isLoading: bronzeLoading } = useMembersByTier(
    { tier: "BRONZE", size: 1 },
    { enabled: !!config?.enabled }
  );
  const { data: silverData, isLoading: silverLoading } = useMembersByTier(
    { tier: "SILVER", size: 1 },
    { enabled: !!config?.enabled }
  );
  const { data: goldData, isLoading: goldLoading } = useMembersByTier(
    { tier: "GOLD", size: 1 },
    { enabled: !!config?.enabled }
  );
  const { data: platinumData, isLoading: platinumLoading } = useMembersByTier(
    { tier: "PLATINUM", size: 1 },
    { enabled: !!config?.enabled }
  );

  const isLoading = configLoading || bronzeLoading || silverLoading || goldLoading || platinumLoading;

  const tierCounts = {
    BRONZE: bronzeData?.totalElements || 0,
    SILVER: silverData?.totalElements || 0,
    GOLD: goldData?.totalElements || 0,
    PLATINUM: platinumData?.totalElements || 0,
  };

  const totalMembers = Object.values(tierCounts).reduce((a, b) => a + b, 0);

  const getPercentage = (count: number) =>
    totalMembers > 0 ? (count / totalMembers) * 100 : 0;

  const texts = {
    title: isRtl ? "توزيع المستويات" : "Tier Distribution",
    subtitle: isRtl ? "أعضاء برنامج الولاء حسب المستوى" : "Loyalty program members by tier",
    totalMembers: isRtl ? "إجمالي الأعضاء" : "Total Members",
    programDisabled: isRtl ? "برنامج الولاء معطل" : "Loyalty program is disabled",
    enableInSettings: isRtl ? "قم بتفعيله من الإعدادات" : "Enable it in settings",
  };

  if (!config?.enabled && !configLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">{texts.programDisabled}</h3>
          <p className="text-sm text-muted-foreground">{texts.enableInSettings}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div>
          <h3 className={cn("text-lg font-semibold", isRtl && "text-right")}>{texts.title}</h3>
          <p className={cn("text-sm text-muted-foreground", isRtl && "text-right")}>
            {texts.subtitle}
          </p>
        </div>
        <div className={cn("flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md3-md", isRtl && "flex-row-reverse")}>
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {isLoading ? "..." : totalMembers.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">{texts.totalMembers}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["BRONZE", "SILVER", "GOLD", "PLATINUM"] as LoyaltyTier[]).map((tier) => (
          <TierCard
            key={tier}
            tier={tier}
            count={tierCounts[tier]}
            percentage={getPercentage(tierCounts[tier])}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}

interface PointsEconomyProps {
  totalPointsIssued?: number;
  totalPointsRedeemed?: number;
  totalPointsExpired?: number;
  isLoading?: boolean;
}

export function PointsEconomyHealth({
  totalPointsIssued = 0,
  totalPointsRedeemed = 0,
  totalPointsExpired = 0,
  isLoading = false,
}: PointsEconomyProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const totalOutstanding = totalPointsIssued - totalPointsRedeemed - totalPointsExpired;
  const redemptionRate = totalPointsIssued > 0
    ? ((totalPointsRedeemed / totalPointsIssued) * 100).toFixed(1)
    : "0.0";

  const texts = {
    title: isRtl ? "صحة النقاط" : "Points Economy",
    issued: isRtl ? "النقاط الصادرة" : "Points Issued",
    redeemed: isRtl ? "النقاط المستبدلة" : "Points Redeemed",
    outstanding: isRtl ? "النقاط المتبقية" : "Outstanding",
    redemptionRate: isRtl ? "معدل الاستبدال" : "Redemption Rate",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          <Coins className="h-5 w-5" />
          {texts.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className={cn("text-sm text-muted-foreground mb-1", isRtl && "text-right")}>
              {texts.issued}
            </p>
            <p className={cn("text-2xl font-bold text-primary", isRtl && "text-right")}>
              {totalPointsIssued.toLocaleString()}
            </p>
          </div>
          <div>
            <p className={cn("text-sm text-muted-foreground mb-1", isRtl && "text-right")}>
              {texts.redeemed}
            </p>
            <p className={cn("text-2xl font-bold text-green-600", isRtl && "text-right")}>
              {totalPointsRedeemed.toLocaleString()}
            </p>
          </div>
          <div>
            <p className={cn("text-sm text-muted-foreground mb-1", isRtl && "text-right")}>
              {texts.outstanding}
            </p>
            <p className={cn("text-2xl font-bold text-amber-600", isRtl && "text-right")}>
              {totalOutstanding.toLocaleString()}
            </p>
          </div>
          <div>
            <p className={cn("text-sm text-muted-foreground mb-1", isRtl && "text-right")}>
              {texts.redemptionRate}
            </p>
            <p className={cn("text-2xl font-bold flex items-center gap-1", isRtl && "flex-row-reverse text-right")}>
              {redemptionRate}%
              <TrendingUp className="h-4 w-4 text-green-500" />
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
