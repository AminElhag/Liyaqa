"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import {
  useZatcaOverview,
  useZatcaIssues,
  useZatcaMonthlyTrend,
  useDataRequests,
  useRetryZatcaCompliance,
  useProcessDataRequest,
} from "@liyaqa/shared/queries/platform/use-compliance";
import { KPIGrid, type KPIItem } from "@liyaqa/shared/components/platform/kpi-grid";
import { AreaChartCard } from "@liyaqa/shared/components/platform/chart-cards";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

export default function CompliancePage() {
  const locale = useLocale();
  const { toast } = useToast();

  const { data: zatcaOverview, isLoading: isLoadingOverview } = useZatcaOverview();
  const { data: zatcaIssues, isLoading: isLoadingIssues } = useZatcaIssues();
  const { data: trendData, isLoading: isLoadingTrend } = useZatcaMonthlyTrend();
  const { data: dataRequests } = useDataRequests();

  const retryMutation = useRetryZatcaCompliance();
  const processMutation = useProcessDataRequest();

  const texts = {
    title: locale === "ar" ? "الامتثال" : "Compliance",
    description: locale === "ar" ? "مراقبة الامتثال التنظيمي للمنصة" : "Monitor platform regulatory compliance",
    complianceRate: locale === "ar" ? "معدل الامتثال" : "Compliance Rate",
    totalInvoices: locale === "ar" ? "إجمالي الفواتير" : "Total Invoices",
    acceptedInvoices: locale === "ar" ? "فواتير مقبولة" : "Accepted Invoices",
    rejectedInvoices: locale === "ar" ? "فواتير مرفوضة" : "Rejected Invoices",
    recentIssues: locale === "ar" ? "المشاكل الأخيرة" : "Recent Issues",
    dataRequests: locale === "ar" ? "طلبات البيانات" : "Data Requests",
    retry: locale === "ar" ? "إعادة المحاولة" : "Retry",
    approve: locale === "ar" ? "موافقة" : "Approve",
    reject: locale === "ar" ? "رفض" : "Reject",
  };

  const handleRetry = async (invoiceId: string) => {
    try {
      await retryMutation.mutateAsync(invoiceId);
      toast({
        title: locale === "ar" ? "تم" : "Success",
        description: locale === "ar" ? "تم إعادة محاولة الإرسال" : "Resubmission initiated",
      });
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleProcessRequest = async (id: string, action: "approve" | "reject") => {
    try {
      await processMutation.mutateAsync({ id, action });
      toast({
        title: locale === "ar" ? "تم" : "Success",
        description:
          action === "approve"
            ? locale === "ar" ? "تمت الموافقة على الطلب" : "Request approved"
            : locale === "ar" ? "تم رفض الطلب" : "Request rejected",
      });
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const kpiItems: KPIItem[] = zatcaOverview
    ? [
        { label: texts.complianceRate, value: `${zatcaOverview.complianceRate.toFixed(1)}%`, trend: zatcaOverview.complianceRate > 95 ? "up" : "down", icon: Shield },
        { label: texts.totalInvoices, value: zatcaOverview.totalInvoices, icon: Shield },
        { label: texts.acceptedInvoices, value: zatcaOverview.acceptedCount, trend: "up", icon: CheckCircle },
        { label: texts.rejectedInvoices, value: zatcaOverview.rejectedCount, trend: zatcaOverview.rejectedCount > 0 ? "down" : "neutral", icon: XCircle },
      ]
    : [];

  if (isLoadingOverview || isLoadingIssues || isLoadingTrend) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{texts.title}</h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      <KPIGrid items={kpiItems} loading={isLoadingOverview} />

      {trendData && (
        <AreaChartCard
          title={locale === "ar" ? "اتجاه الامتثال الشهري" : "Monthly Compliance Trend"}
          data={trendData}
          dataKeys={["compliant", "failed"]}
          xAxisKey="month"
          height={300}
        />
      )}

      {zatcaIssues && zatcaIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {texts.recentIssues}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {zatcaIssues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{issue.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">{issue.tenantName} - {issue.status}</p>
                    {issue.responseMessage && (
                      <p className="text-xs text-destructive mt-1">{issue.responseMessage}</p>
                    )}
                  </div>
                  {issue.status === "REJECTED" && (
                    <Button size="sm" onClick={() => handleRetry(issue.invoiceId)} disabled={retryMutation.isPending}>
                      {texts.retry}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dataRequests && dataRequests.filter((req) => req.status === "PENDING_APPROVAL").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.dataRequests}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dataRequests
                .filter((req) => req.status === "PENDING_APPROVAL")
                .map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{request.requestNumber} - {request.requesterName}</p>
                      <p className="text-sm text-muted-foreground">{request.requesterEmail}</p>
                      {request.reason && <p className="text-xs text-muted-foreground mt-1">{request.reason}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleProcessRequest(request.id, "approve")} disabled={processMutation.isPending}>
                        {texts.approve}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleProcessRequest(request.id, "reject")} disabled={processMutation.isPending}>
                        {texts.reject}
                      </Button>
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
