"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Building2,
  AlertTriangle,
  Activity,
  RefreshCw,
  Users,
  Calendar,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { cn } from "@liyaqa/shared/utils";
import {
  useFacilitiesHealth,
  useAtRiskFacilities,
} from "@liyaqa/shared/queries/platform/use-facility-monitoring";
import { FACILITY_HEALTH_CONFIG } from "@liyaqa/shared/types/platform/facility-monitoring";
import type { FacilityHealthStatus } from "@liyaqa/shared/types/platform/facility-monitoring";

export default function FacilityMonitoringPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [view, setView] = useState<"all" | "at-risk">("all");

  const texts = {
    title: isRtl ? "مراقبة المرافق" : "Facility Monitoring",
    subtitle: isRtl ? "مراقبة صحة وأداء المرافق" : "Monitor facility health and performance",
    refresh: isRtl ? "تحديث" : "Refresh",
    allFacilities: isRtl ? "جميع المرافق" : "All Facilities",
    atRisk: isRtl ? "في خطر" : "At Risk",
    healthScore: isRtl ? "درجة الصحة" : "Health Score",
    activeMembers: isRtl ? "الأعضاء النشطون" : "Active Members",
    totalMembers: isRtl ? "إجمالي الأعضاء" : "Total Members",
    activityRate: isRtl ? "معدل النشاط" : "Activity Rate",
    lastActivity: isRtl ? "آخر نشاط" : "Last Activity",
    tenant: isRtl ? "المستأجر" : "Tenant",
    issues: isRtl ? "المشاكل" : "Issues",
    riskFactors: isRtl ? "عوامل الخطر" : "Risk Factors",
    daysAtRisk: isRtl ? "أيام في خطر" : "Days at Risk",
    recommendations: isRtl ? "التوصيات" : "Recommendations",
    noFacilities: isRtl ? "لا توجد مرافق" : "No facilities found",
    noAtRisk: isRtl ? "لا توجد مرافق في خطر" : "No at-risk facilities",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
  };

  const { data: facilities, isLoading: facilitiesLoading, refetch: refetchHealth } = useFacilitiesHealth();
  const { data: atRiskFacilities, isLoading: atRiskLoading, refetch: refetchAtRisk } = useAtRiskFacilities();

  const handleRefresh = () => {
    refetchHealth();
    refetchAtRisk();
  };

  const statusCounts = facilities?.reduce(
    (acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    },
    {} as Record<FacilityHealthStatus, number>
  ) || {};

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div className={isRtl ? "text-right" : ""}>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {texts.title}
          </h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 me-1" />
          {texts.refresh}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {(["HEALTHY", "WARNING", "AT_RISK", "CRITICAL"] as FacilityHealthStatus[]).map((status) => {
          const config = FACILITY_HEALTH_CONFIG[status];
          return (
            <Card key={status} className={cn("border", config.bgColor)}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isRtl ? config.labelAr : config.labelEn}
                    </p>
                    <p className={cn("text-2xl font-bold", config.color)}>
                      {statusCounts[status] || 0}
                    </p>
                  </div>
                  <Activity className={cn("h-8 w-8 opacity-50", config.color)} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Toggle */}
      <div className={cn("flex gap-2", isRtl && "flex-row-reverse")}>
        <Button
          variant={view === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("all")}
        >
          <Building2 className="h-4 w-4 me-1" />
          {texts.allFacilities}
        </Button>
        <Button
          variant={view === "at-risk" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("at-risk")}
        >
          <AlertTriangle className="h-4 w-4 me-1" />
          {texts.atRisk}
          {atRiskFacilities && atRiskFacilities.length > 0 && (
            <Badge variant="destructive" className="ms-1 h-5 px-1.5 text-xs">
              {atRiskFacilities.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* All Facilities View */}
      {view === "all" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {facilitiesLoading ? (
            <div className="col-span-full text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{texts.loading}</p>
            </div>
          ) : !facilities?.length ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{texts.noFacilities}</p>
            </div>
          ) : (
            facilities.map((facility) => {
              const config = FACILITY_HEALTH_CONFIG[facility.status];
              return (
                <Card key={facility.facilityId} className="hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                      <CardTitle className="text-base">
                        {isRtl ? facility.facilityNameAr || facility.facilityNameEn : facility.facilityNameEn}
                      </CardTitle>
                      <Badge className={cn("text-xs", config.bgColor, config.color)} variant="outline">
                        {isRtl ? config.labelAr : config.labelEn}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? facility.tenantNameAr || facility.tenantNameEn : facility.tenantNameEn}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className={cn("flex items-center justify-between text-sm", isRtl && "flex-row-reverse")}>
                        <span className="text-muted-foreground">{texts.healthScore}</span>
                        <span className={cn("font-medium", config.color)}>{facility.healthScore}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={cn("h-2 rounded-full transition-all", {
                            "bg-green-500": facility.status === "HEALTHY",
                            "bg-yellow-500": facility.status === "WARNING",
                            "bg-orange-500": facility.status === "AT_RISK",
                            "bg-red-500": facility.status === "CRITICAL",
                          })}
                          style={{ width: `${facility.healthScore}%` }}
                        />
                      </div>
                      <div className={cn("flex items-center justify-between text-sm", isRtl && "flex-row-reverse")}>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {texts.activeMembers}
                        </span>
                        <span>{facility.activeMembers} / {facility.totalMembers}</span>
                      </div>
                      <div className={cn("flex items-center justify-between text-sm", isRtl && "flex-row-reverse")}>
                        <span className="text-muted-foreground">{texts.activityRate}</span>
                        <span>{Math.round(facility.memberActivityRate * 100)}%</span>
                      </div>
                      {facility.lastActivityAt && (
                        <div className={cn("flex items-center justify-between text-sm", isRtl && "flex-row-reverse")}>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {texts.lastActivity}
                          </span>
                          <span className="text-xs">
                            {formatDistanceToNow(new Date(facility.lastActivityAt), {
                              addSuffix: true,
                              locale: isRtl ? ar : enUS,
                            })}
                          </span>
                        </div>
                      )}
                      {facility.issues.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">{texts.issues}</p>
                          <div className="flex flex-wrap gap-1">
                            {facility.issues.map((issue, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* At-Risk View */}
      {view === "at-risk" && (
        <div className="space-y-4">
          {atRiskLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{texts.loading}</p>
            </div>
          ) : !atRiskFacilities?.length ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">{texts.noAtRisk}</p>
            </div>
          ) : (
            atRiskFacilities.map((facility) => (
              <Card key={facility.facilityId} className="border-orange-200 dark:border-orange-800">
                <CardContent className="pt-6">
                  <div className={cn("flex items-start gap-4", isRtl && "flex-row-reverse")}>
                    <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                      <TrendingDown className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className={cn("flex-1", isRtl && "text-right")}>
                      <div className={cn("flex items-center gap-2 mb-1", isRtl && "flex-row-reverse")}>
                        <h3 className="font-medium">
                          {isRtl ? facility.facilityNameAr || facility.facilityNameEn : facility.facilityNameEn}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {isRtl ? facility.tenantNameAr || facility.tenantNameEn : facility.tenantNameEn}
                        </Badge>
                      </div>
                      <div className={cn("flex items-center gap-4 text-sm text-muted-foreground mb-3", isRtl && "flex-row-reverse")}>
                        <span>{texts.healthScore}: <strong className="text-orange-600">{facility.healthScore}%</strong></span>
                        <span>{texts.daysAtRisk}: <strong className="text-red-600">{facility.daysAtRisk}</strong></span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{texts.riskFactors}</p>
                          <div className="flex flex-wrap gap-1">
                            {facility.riskFactors.map((factor, i) => (
                              <Badge key={i} variant="destructive" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{texts.recommendations}</p>
                          <ul className={cn("text-sm space-y-1", isRtl && "text-right")}>
                            {facility.recommendedActions.map((action, i) => (
                              <li key={i} className="text-muted-foreground">• {action}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
