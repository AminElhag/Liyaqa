"use client";

import { useLocale } from "next-intl";
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, Heart, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { cn } from "@liyaqa/shared/utils";

/**
 * Risk level type
 */
type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Health trend type
 */
type HealthTrend = "IMPROVING" | "STABLE" | "DECLINING";

/**
 * Client health data
 */
interface ClientHealth {
  organizationId: string;
  organizationName: string;
  overallScore: number;
  riskLevel: RiskLevel;
  trend: HealthTrend;
  usageScore: number;
  engagementScore: number;
  paymentScore: number;
  supportScore: number;
  scoreChange?: number;
}

/**
 * Health statistics
 */
interface HealthStatistics {
  totalClients: number;
  averageScore: number;
  healthyCount: number;
  monitorCount: number;
  atRiskCount: number;
  criticalCount: number;
}

/**
 * Props for HealthOverview component
 */
interface HealthOverviewProps {
  statistics: HealthStatistics;
  atRiskClients?: ClientHealth[];
  onViewAllClick?: () => void;
  onClientClick?: (organizationId: string) => void;
  className?: string;
}

/**
 * Risk level colors and labels
 */
const riskConfig: Record<RiskLevel, { color: string; bgColor: string; label: string; labelAr: string }> = {
  LOW: {
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "Healthy",
    labelAr: "صحي",
  },
  MEDIUM: {
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Monitor",
    labelAr: "مراقبة",
  },
  HIGH: {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    label: "At Risk",
    labelAr: "معرض للخطر",
  },
  CRITICAL: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Critical",
    labelAr: "حرج",
  },
};

/**
 * Trend icon component
 */
function TrendIcon({ trend, className }: { trend: HealthTrend; className?: string }) {
  switch (trend) {
    case "IMPROVING":
      return <TrendingUp className={cn("h-4 w-4 text-green-500", className)} />;
    case "DECLINING":
      return <TrendingDown className={cn("h-4 w-4 text-red-500", className)} />;
    default:
      return <Minus className={cn("h-4 w-4 text-muted-foreground", className)} />;
  }
}

/**
 * HealthOverview Component
 * Displays client health distribution and at-risk clients.
 */
export function HealthOverview({
  statistics,
  atRiskClients = [],
  onViewAllClick,
  onClientClick,
  className,
}: HealthOverviewProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    title: isRtl ? "صحة العملاء" : "Client Health",
    subtitle: isRtl ? "نظرة عامة على صحة جميع العملاء" : "Overview of all client health scores",
    averageScore: isRtl ? "متوسط الدرجة" : "Average Score",
    distribution: isRtl ? "التوزيع" : "Distribution",
    atRisk: isRtl ? "العملاء المعرضون للخطر" : "At-Risk Clients",
    viewAll: isRtl ? "عرض الكل" : "View All",
    noAtRisk: isRtl ? "لا يوجد عملاء معرضون للخطر" : "No at-risk clients",
    healthy: isRtl ? "صحي" : "Healthy",
    monitor: isRtl ? "مراقبة" : "Monitor",
    risk: isRtl ? "خطر" : "At Risk",
    score: isRtl ? "الدرجة" : "Score",
    trend: isRtl ? "الاتجاه" : "Trend",
  };

  const healthyPercent = statistics.totalClients > 0
    ? Math.round((statistics.healthyCount / statistics.totalClients) * 100)
    : 0;
  const monitorPercent = statistics.totalClients > 0
    ? Math.round((statistics.monitorCount / statistics.totalClients) * 100)
    : 0;
  const atRiskPercent = statistics.totalClients > 0
    ? Math.round(((statistics.atRiskCount + statistics.criticalCount) / statistics.totalClients) * 100)
    : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {texts.title}
            </CardTitle>
            <CardDescription>{texts.subtitle}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{Math.round(statistics.averageScore)}</div>
            <div className="text-xs text-muted-foreground">{texts.averageScore}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Health Distribution */}
        <div>
          <h4 className="text-sm font-medium mb-3">{texts.distribution}</h4>

          {/* Distribution Bar */}
          <div className="h-4 rounded-full overflow-hidden flex bg-muted">
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${healthyPercent}%` }}
            />
            <div
              className="bg-yellow-500 transition-all duration-500"
              style={{ width: `${monitorPercent}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${atRiskPercent}%` }}
            />
          </div>

          {/* Legend */}
          <div className="flex justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>{texts.healthy}</span>
              <span className="text-muted-foreground">({statistics.healthyCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span>{texts.monitor}</span>
              <span className="text-muted-foreground">({statistics.monitorCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>{texts.risk}</span>
              <span className="text-muted-foreground">({statistics.atRiskCount + statistics.criticalCount})</span>
            </div>
          </div>
        </div>

        {/* At-Risk Clients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {texts.atRisk}
            </h4>
            {atRiskClients.length > 0 && onViewAllClick && (
              <Button variant="ghost" size="sm" onClick={onViewAllClick}>
                {texts.viewAll}
              </Button>
            )}
          </div>

          {atRiskClients.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Heart className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>{texts.noAtRisk}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {atRiskClients.slice(0, 5).map((client) => {
                const config = riskConfig[client.riskLevel];
                return (
                  <button
                    key={client.organizationId}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    onClick={() => onClientClick?.(client.organizationId)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center font-semibold",
                          config.bgColor,
                          config.color
                        )}
                      >
                        {client.overallScore}
                      </div>
                      <div>
                        <div className="font-medium">{client.organizationName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendIcon trend={client.trend} className="h-3 w-3" />
                          {client.scoreChange !== undefined && (
                            <span className={cn(
                              client.scoreChange > 0 ? "text-green-500" : client.scoreChange < 0 ? "text-red-500" : ""
                            )}>
                              {client.scoreChange > 0 ? "+" : ""}{client.scoreChange}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(config.color, "border-current")}>
                      {isRtl ? config.labelAr : config.label}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default HealthOverview;
