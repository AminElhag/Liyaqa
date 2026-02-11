"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Download, TrendingDown, Users, DollarSign } from "lucide-react";
import {
  useChurnAnalysis,
  useFeatureAdoption,
  useComparativeAnalytics,
  useExportAnalyticsReport,
} from "@liyaqa/shared/queries/platform/use-analytics";
import { KPIGrid, type KPIItem } from "@liyaqa/shared/components/platform/kpi-grid";
import { BarChartCard } from "@liyaqa/shared/components/platform/chart-cards";
import type { ReportType, ExportFormat } from "@liyaqa/shared/types/platform/analytics";

export default function AnalyticsPage() {
  const locale = useLocale();
  const [exportFormat, setExportFormat] = useState<ExportFormat>("PDF");

  const { data: churnData, isLoading: isLoadingChurn } = useChurnAnalysis();
  const { data: adoptionData, isLoading: isLoadingAdoption } = useFeatureAdoption();
  const { data: comparativeData, isLoading: isLoadingComparative } = useComparativeAnalytics();
  const exportReport = useExportAnalyticsReport();

  const texts = {
    title: locale === "ar" ? "التحليلات" : "Analytics",
    description: locale === "ar" ? "تحليل شامل لأداء المنصة" : "Comprehensive platform performance analytics",
    exportReport: locale === "ar" ? "تصدير التقرير" : "Export Report",
    churnRate30d: locale === "ar" ? "معدل التسرب (30 يوم)" : "Churn Rate (30d)",
    churnRate90d: locale === "ar" ? "معدل التسرب (90 يوم)" : "Churn Rate (90d)",
    atRiskTenants: locale === "ar" ? "عملاء معرضون للخطر" : "At-Risk Tenants",
    avgMembersPerFacility: locale === "ar" ? "متوسط الأعضاء لكل منشأة" : "Avg Members/Facility",
    avgMonthlyRevenue: locale === "ar" ? "متوسط الإيرادات الشهرية" : "Avg Monthly Revenue",
  };

  const handleExport = async (type: ReportType) => {
    try {
      const blob = await exportReport.mutateAsync({ type, format: exportFormat });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${type.toLowerCase()}.${exportFormat.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const kpiItems: KPIItem[] = churnData
    ? [
        {
          label: texts.churnRate30d,
          value: `${churnData.churnRate30d.toFixed(1)}%`,
          trend: churnData.churnRate30d > 5 ? "down" : "up",
          change: -2.1,
          icon: TrendingDown,
        },
        {
          label: texts.churnRate90d,
          value: `${churnData.churnRate90d.toFixed(1)}%`,
          trend: churnData.churnRate90d > 10 ? "down" : "up",
          change: -1.5,
          icon: TrendingDown,
        },
        {
          label: texts.atRiskTenants,
          value: churnData.atRiskTenants.length,
          icon: Users,
        },
      ]
    : [];

  if (comparativeData) {
    kpiItems.push({
      label: texts.avgMembersPerFacility,
      value: Math.round(comparativeData.averageMembersPerFacility),
      icon: Users,
    });
    kpiItems.push({
      label: texts.avgMonthlyRevenue,
      value: `SAR ${(comparativeData.averageMonthlyRevenue / 1000).toFixed(1)}K`,
      icon: DollarSign,
    });
  }

  if (isLoadingChurn || isLoadingAdoption || isLoadingComparative) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        <Button onClick={() => handleExport("FULL")} className="gap-2">
          <Download className="h-4 w-4" />
          {texts.exportReport}
        </Button>
      </div>

      <KPIGrid items={kpiItems} loading={isLoadingChurn} />

      {churnData && (
        <BarChartCard
          title={locale === "ar" ? "أسباب التسرب" : "Churn Reasons"}
          data={churnData.churnReasons}
          dataKeys={["count"]}
          xAxisKey="reason"
          height={300}
        />
      )}

      {adoptionData && (
        <BarChartCard
          title={locale === "ar" ? "معدلات اعتماد الميزات" : "Feature Adoption Rates"}
          data={adoptionData.features.slice(0, 10)}
          dataKeys={["adoptionRate"]}
          xAxisKey="name"
          height={300}
        />
      )}

      {churnData && churnData.atRiskTenants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.atRiskTenants}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {churnData.atRiskTenants.map((tenant) => (
                <div
                  key={tenant.tenantId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar" ? "درجة المخاطرة:" : "Risk Score:"} {tenant.riskScore}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tenant.riskFactors.map((factor, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded-full bg-destructive/10 text-destructive"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
