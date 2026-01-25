"use client";

import { useLocale } from "next-intl";
import { Users, TrendingUp, MousePointer, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReferralLinkCard } from "@/components/member/referral-link-card";
import { ReferralHistory } from "@/components/member/referral-history";
import { ReferralRewards } from "@/components/member/referral-rewards";
import { useMyProfile } from "@/queries/use-member-portal";
import { useMyReferralCode, useMyReferralStats } from "@/queries/use-referrals";

export default function MemberReferralsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const memberId = profile?.id || "";

  const { data: referralCode, isLoading: codeLoading } = useMyReferralCode(memberId, {
    enabled: !!memberId,
  });
  const { data: stats, isLoading: statsLoading } = useMyReferralStats(memberId, {
    enabled: !!memberId,
  });

  const isLoading = profileLoading || codeLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isArabic ? "برنامج الإحالة" : "Referral Program"}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? "ادعو أصدقائك واحصل على مكافآت"
            : "Invite your friends and earn rewards"}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isArabic ? "إجمالي الإحالات" : "Total Referrals"}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isArabic ? "التحويلات" : "Conversions"}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.conversionRate.toFixed(1)}%{" "}
                {isArabic ? "معدل التحويل" : "conversion rate"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isArabic ? "النقرات" : "Link Clicks"}
              </CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.clickCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? "من رابط الإحالة" : "on referral link"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Referral Link */}
        <ReferralLinkCard referralCode={referralCode} isLoading={codeLoading} />

        {/* Rewards */}
        {memberId && <ReferralRewards memberId={memberId} />}
      </div>

      {/* Referral History */}
      {memberId && <ReferralHistory memberId={memberId} />}
    </div>
  );
}
