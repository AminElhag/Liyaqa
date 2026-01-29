"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Trophy,
  Medal,
  ArrowLeft,
  Crown,
  Award,
  Coins,
  Search,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { PointsAdjustmentDialog } from "@/components/loyalty";
import { cn } from "@/lib/utils";
import { useLeaderboard, useMembersByTier } from "@/queries/use-loyalty";
import { getInitials } from "@/lib/utils";
import type { LoyaltyTier } from "@/types/loyalty";

const TIER_COLORS = {
  BRONZE: { bg: "bg-amber-700", text: "text-amber-700", light: "bg-amber-100" },
  SILVER: { bg: "bg-gray-400", text: "text-gray-500", light: "bg-gray-100" },
  GOLD: { bg: "bg-yellow-500", text: "text-yellow-600", light: "bg-yellow-100" },
  PLATINUM: { bg: "bg-slate-300", text: "text-slate-600", light: "bg-slate-100" },
};

const TIER_LABELS = {
  BRONZE: { en: "Bronze", ar: "برونزي" },
  SILVER: { en: "Silver", ar: "فضي" },
  GOLD: { en: "Gold", ar: "ذهبي" },
  PLATINUM: { en: "Platinum", ar: "بلاتيني" },
};

export default function LeaderboardPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [selectedTier, setSelectedTier] = useState<LoyaltyTier | "ALL">("ALL");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard({ limit: 50 });
  const { data: tierMembers, isLoading: tierLoading } = useMembersByTier(
    { tier: selectedTier as LoyaltyTier, page: 0, size: 50 },
    { enabled: selectedTier !== "ALL" }
  );

  const isLoading = selectedTier === "ALL" ? leaderboardLoading : tierLoading;
  const displayData = selectedTier === "ALL"
    ? leaderboard?.map((entry, index) => ({
        memberId: entry.memberId,
        rank: entry.rank,
        pointsBalance: entry.pointsBalance,
        lifetimeEarned: entry.lifetimeEarned,
        tier: entry.tier,
      }))
    : tierMembers?.content.map((member, index) => ({
        memberId: member.memberId,
        rank: index + 1,
        pointsBalance: member.pointsBalance,
        lifetimeEarned: member.lifetimeEarned,
        tier: member.tier,
      }));

  const handleAdjustPoints = (memberId: string) => {
    setSelectedMemberId(memberId);
    setAdjustDialogOpen(true);
  };

  const texts = {
    title: isRtl ? "المتصدرين" : "Leaderboard",
    subtitle: isRtl ? "أفضل الأعضاء حسب نقاط الولاء" : "Top members by loyalty points",
    back: isRtl ? "رجوع" : "Back",
    allTiers: isRtl ? "جميع المستويات" : "All Tiers",
    rank: isRtl ? "الترتيب" : "Rank",
    member: isRtl ? "العضو" : "Member",
    tier: isRtl ? "المستوى" : "Tier",
    balance: isRtl ? "الرصيد" : "Balance",
    lifetime: isRtl ? "الإجمالي" : "Lifetime",
    actions: isRtl ? "إجراءات" : "Actions",
    adjustPoints: isRtl ? "تعديل النقاط" : "Adjust Points",
    noMembers: isRtl ? "لا يوجد أعضاء" : "No members found",
    filterByTier: isRtl ? "تصفية حسب المستوى" : "Filter by tier",
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="font-semibold text-muted-foreground">{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-50 border-yellow-200";
    if (rank === 2) return "bg-gray-50 border-gray-200";
    if (rank === 3) return "bg-amber-50 border-amber-200";
    return "bg-white border-border";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={texts.title}
        description={texts.subtitle}
      >
        <Button asChild variant="outline">
          <Link href="/loyalty">
            <ArrowLeft className={cn("h-4 w-4", isRtl ? "ms-2 rotate-180" : "me-2")} />
            {texts.back}
          </Link>
        </Button>
      </PageHeader>

      {/* Top 3 Podium */}
      {selectedTier === "ALL" && displayData && displayData.length >= 3 && !isLoading && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <Card className={cn("border-2 border-gray-300 mt-8", isRtl && "order-3")}>
            <CardContent className="p-4 text-center">
              <div className="relative inline-block">
                <Avatar className="h-16 w-16 mx-auto border-4 border-gray-300">
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-xl">
                    {getInitials(`Member 2`)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="font-bold text-gray-700">2</span>
                </div>
              </div>
              <p className="font-medium mt-4 truncate">Member #{displayData[1].memberId.slice(0, 8)}</p>
              <p className="text-2xl font-bold text-gray-600">{displayData[1].pointsBalance.toLocaleString()}</p>
              <Badge variant="secondary" className="mt-2">
                {isRtl ? TIER_LABELS[displayData[1].tier].ar : TIER_LABELS[displayData[1].tier].en}
              </Badge>
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className={cn("border-2 border-yellow-400", isRtl && "order-2")}>
            <CardContent className="p-4 text-center">
              <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="relative inline-block">
                <Avatar className="h-20 w-20 mx-auto border-4 border-yellow-400">
                  <AvatarFallback className="bg-yellow-100 text-yellow-700 text-2xl">
                    {getInitials(`Member 1`)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                  <span className="font-bold text-yellow-900">1</span>
                </div>
              </div>
              <p className="font-medium mt-4 truncate">Member #{displayData[0].memberId.slice(0, 8)}</p>
              <p className="text-3xl font-bold text-yellow-600">{displayData[0].pointsBalance.toLocaleString()}</p>
              <Badge className="mt-2 bg-yellow-500 hover:bg-yellow-600">
                {isRtl ? TIER_LABELS[displayData[0].tier].ar : TIER_LABELS[displayData[0].tier].en}
              </Badge>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className={cn("border-2 border-amber-400 mt-12", isRtl && "order-1")}>
            <CardContent className="p-4 text-center">
              <div className="relative inline-block">
                <Avatar className="h-14 w-14 mx-auto border-4 border-amber-400">
                  <AvatarFallback className="bg-amber-100 text-amber-700">
                    {getInitials(`Member 3`)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center">
                  <span className="font-bold text-amber-900">3</span>
                </div>
              </div>
              <p className="font-medium mt-4 truncate">Member #{displayData[2].memberId.slice(0, 8)}</p>
              <p className="text-xl font-bold text-amber-600">{displayData[2].pointsBalance.toLocaleString()}</p>
              <Badge variant="outline" className="mt-2 border-amber-400 text-amber-700">
                {isRtl ? TIER_LABELS[displayData[2].tier].ar : TIER_LABELS[displayData[2].tier].en}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
        <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as LoyaltyTier | "ALL")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={texts.filterByTier} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{texts.allTiers}</SelectItem>
            {(["BRONZE", "SILVER", "GOLD", "PLATINUM"] as LoyaltyTier[]).map((tier) => (
              <SelectItem key={tier} value={tier}>
                <div className="flex items-center gap-2">
                  <span className={cn("h-3 w-3 rounded-full", TIER_COLORS[tier].bg)} />
                  {isRtl ? TIER_LABELS[tier].ar : TIER_LABELS[tier].en}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Full Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
            <Trophy className="h-5 w-5" />
            {selectedTier === "ALL"
              ? texts.title
              : isRtl
              ? `أعضاء ${TIER_LABELS[selectedTier as LoyaltyTier].ar}`
              : `${TIER_LABELS[selectedTier as LoyaltyTier].en} Members`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-32 flex-1" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : displayData && displayData.length > 0 ? (
            <div className="space-y-2">
              {displayData.map((entry) => (
                <div
                  key={entry.memberId}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-md3-md border transition-colors hover:bg-muted/50",
                    getRankStyle(entry.rank),
                    isRtl && "flex-row-reverse"
                  )}
                >
                  {/* Rank */}
                  <div className="h-10 w-10 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={cn(
                      TIER_COLORS[entry.tier].light,
                      TIER_COLORS[entry.tier].text
                    )}>
                      {getInitials(`Member ${entry.rank}`)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium truncate", isRtl && "text-right")}>
                      Member #{entry.memberId.slice(0, 8)}
                    </p>
                    <div className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}>
                      <span className={cn("h-2 w-2 rounded-full", TIER_COLORS[entry.tier].bg)} />
                      <span className="text-xs text-muted-foreground">
                        {isRtl ? TIER_LABELS[entry.tier].ar : TIER_LABELS[entry.tier].en}
                      </span>
                    </div>
                  </div>

                  {/* Points Balance */}
                  <div className={cn("text-center", isRtl && "text-right")}>
                    <p className="font-bold text-lg">{entry.pointsBalance.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{texts.balance}</p>
                  </div>

                  {/* Lifetime Earned */}
                  <div className={cn("text-center hidden sm:block", isRtl && "text-right")}>
                    <p className="font-medium text-muted-foreground">{entry.lifetimeEarned.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{texts.lifetime}</p>
                  </div>

                  {/* Actions */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAdjustPoints(entry.memberId)}
                  >
                    <Coins className="h-4 w-4" />
                    <span className="hidden sm:inline ms-1">{texts.adjustPoints}</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">{texts.noMembers}</p>
          )}
        </CardContent>
      </Card>

      {/* Points Adjustment Dialog */}
      {selectedMemberId && (
        <PointsAdjustmentDialog
          open={adjustDialogOpen}
          onOpenChange={setAdjustDialogOpen}
          memberId={selectedMemberId}
          memberName={`Member #${selectedMemberId.slice(0, 8)}`}
          currentBalance={displayData?.find((d) => d.memberId === selectedMemberId)?.pointsBalance || 0}
        />
      )}
    </div>
  );
}
