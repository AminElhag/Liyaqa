"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  TrendingDown,
  User,
  Phone,
  ChevronRight,
  ArrowRight,
  Calendar,
  CreditCard,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAtRiskMembers } from "@/queries/use-engagement";
import type { RiskLevel } from "@/lib/api/engagement";

const riskLevelConfig: Record<
  RiskLevel,
  { color: string; bgColor: string; labelEn: string; labelAr: string }
> = {
  LOW: {
    color: "text-green-700",
    bgColor: "bg-green-100",
    labelEn: "Low",
    labelAr: "منخفض",
  },
  MEDIUM: {
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    labelEn: "Medium",
    labelAr: "متوسط",
  },
  HIGH: {
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    labelEn: "High",
    labelAr: "مرتفع",
  },
  CRITICAL: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    labelEn: "Critical",
    labelAr: "حرج",
  },
};

const riskFactorIcons: Record<string, React.ReactNode> = {
  LOW_VISIT_FREQUENCY: <Activity className="h-3 w-3" />,
  NO_RECENT_VISITS: <TrendingDown className="h-3 w-3" />,
  PAYMENT_ISSUES: <CreditCard className="h-3 w-3" />,
  EXPIRING_SOON: <Calendar className="h-3 w-3" />,
  VIEWED_CANCELLATION: <AlertTriangle className="h-3 w-3" />,
};

export function AtRiskWidget() {
  const locale = useLocale();
  const router = useRouter();
  const { data: atRiskMembers, isLoading, error } = useAtRiskMembers({ riskLevels: ["HIGH", "CRITICAL"] });

  const texts = {
    title: locale === "ar" ? "أعضاء معرضون للخطر" : "At-Risk Members",
    noMembers: locale === "ar" ? "لا يوجد أعضاء معرضون للخطر" : "No at-risk members",
    viewAll: locale === "ar" ? "عرض الكل" : "View All",
    score: locale === "ar" ? "النتيجة" : "Score",
    contact: locale === "ar" ? "تواصل" : "Contact",
    riskFactors: locale === "ar" ? "عوامل الخطر" : "Risk factors",
    critical: locale === "ar" ? "حرج" : "Critical",
    high: locale === "ar" ? "مرتفع" : "High",
    members: locale === "ar" ? "أعضاء" : "members",
    needAttention: locale === "ar" ? "يحتاجون اهتمام" : "need attention",
    errorLoading: locale === "ar" ? "خطأ في تحميل الأعضاء" : "Error loading members",
    errorMessage: locale === "ar" ? "تعذر تحميل الأعضاء المعرضين للخطر. يرجى المحاولة مرة أخرى." : "Failed to load at-risk members. Please try again.",
  };

  const handleMemberClick = (memberId: string) => {
    router.push(`/${locale}/members/${memberId}`);
  };

  if (error) {
    return (
      <Card className="border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {texts.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground mb-1">{texts.errorLoading}</p>
          <p className="text-xs text-muted-foreground">{texts.errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const members = atRiskMembers?.content || [];
  const criticalCount = members.filter((m) => m.riskLevel === "CRITICAL").length;
  const highCount = members.filter((m) => m.riskLevel === "HIGH").length;

  return (
    <Card className="border-orange-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          {texts.title}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/members?risk=high`)}>
          {texts.viewAll}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        {members.length > 0 && (
          <div className="flex gap-2 mb-4">
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {members.length} {texts.members} {texts.needAttention}
            </Badge>
            {criticalCount > 0 && (
              <Badge variant="destructive">
                {criticalCount} {texts.critical}
              </Badge>
            )}
            {highCount > 0 && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                {highCount} {texts.high}
              </Badge>
            )}
          </div>
        )}

        {members.length > 0 ? (
          <div className="space-y-3">
            {members.slice(0, 5).map((member) => {
              const riskConfig = riskLevelConfig[member.riskLevel];
              const initials = (member.memberName || "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={member.memberId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 cursor-pointer transition-colors"
                  onClick={() => handleMemberClick(member.memberId)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{member.memberName}</span>
                        <Badge className={`text-xs ${riskConfig.bgColor} ${riskConfig.color}`}>
                          {member.overallScore}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>
                          {texts.score}: {member.overallScore}
                        </span>
                      </div>
                      {/* Risk factors */}
                      {member.riskFactors && member.riskFactors.length > 0 && (
                        <TooltipProvider>
                          <div className="flex gap-1 mt-1.5">
                            {member.riskFactors.slice(0, 3).map((factor, index) => (
                              <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center h-5 w-5 rounded bg-red-100 text-red-600">
                                    {riskFactorIcons[factor.code] || <AlertTriangle className="h-3 w-3" />}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{factor.title}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {member.riskFactors.length > 3 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center h-5 px-1.5 rounded bg-gray-100 text-gray-600 text-xs">
                                    +{member.riskFactors.length - 3}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    {member.riskFactors
                                      .slice(3)
                                      .map((f) => f.title)
                                      .join(", ")}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to member profile for contact
                              handleMemberClick(member.memberId);
                            }}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{texts.contact}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
            {members.length > 5 && (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => router.push(`/${locale}/members?risk=high`)}
              >
                +{members.length - 5} more {texts.members}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>{texts.noMembers}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
