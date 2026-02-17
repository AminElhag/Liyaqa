"use client";

import { useLocale } from "next-intl";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { cn } from "@liyaqa/shared/utils";
import {
  useRevenueMetrics,
  useRevenueByPlan,
  useOutstandingInvoices,
  useMarkInvoicePaid,
} from "@liyaqa/shared/queries/platform/use-billing";
import type {
  PlanRevenueResponse,
  OutstandingInvoiceResponse,
} from "@liyaqa/shared/types/platform/billing";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const PLAN_COLORS = [
  "#FF6B4A",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

function formatCurrency(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: currency || "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(dateString: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

/**
 * Status badge component for invoice statuses
 */
function InvoiceStatusBadge({
  status,
  isRtl,
}: {
  status: OutstandingInvoiceResponse["status"];
  isRtl: boolean;
}) {
  const config: Record<
    OutstandingInvoiceResponse["status"],
    { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    PENDING: {
      label: "Pending",
      labelAr: "قيد الانتظار",
      variant: "secondary",
    },
    OVERDUE: {
      label: "Overdue",
      labelAr: "متأخرة",
      variant: "destructive",
    },
    PARTIALLY_PAID: {
      label: "Partially Paid",
      labelAr: "مدفوعة جزئياً",
      variant: "outline",
    },
  };

  const { label, labelAr, variant } = config[status];

  return (
    <Badge
      variant={variant}
      className={cn(
        status === "PENDING" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        status === "OVERDUE" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        status === "PARTIALLY_PAID" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      )}
    >
      {isRtl ? labelAr : label}
    </Badge>
  );
}

/**
 * Billing Dashboard Page
 *
 * Displays revenue metrics, revenue breakdown by plan, and outstanding invoices
 * for the Liyaqa platform. Connects to BillingController at /api/v1/platform/billing.
 */
export default function BillingDashboardPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    title: isRtl ? "لوحة الفوترة" : "Billing Dashboard",
    subtitle: isRtl
      ? "نظرة عامة على الإيرادات والفواتير المستحقة"
      : "Revenue overview and outstanding invoices",
    mrr: isRtl ? "الإيرادات الشهرية المتكررة" : "Monthly Recurring Revenue",
    arr: isRtl ? "الإيرادات السنوية المتكررة" : "Annual Recurring Revenue",
    mrrGrowth: isRtl ? "نمو الإيرادات الشهرية" : "MRR Growth",
    avgRevenue: isRtl ? "متوسط الإيراد لكل عميل" : "Avg Revenue Per Client",
    revenueByPlan: isRtl ? "الإيرادات حسب الخطة" : "Revenue by Plan",
    outstandingInvoices: isRtl ? "الفواتير المستحقة" : "Outstanding Invoices",
    invoiceNumber: isRtl ? "رقم الفاتورة" : "Invoice #",
    tenantName: isRtl ? "اسم العميل" : "Tenant Name",
    amount: isRtl ? "المبلغ" : "Amount",
    dueDate: isRtl ? "تاريخ الاستحقاق" : "Due Date",
    daysOverdue: isRtl ? "أيام التأخير" : "Days Overdue",
    status: isRtl ? "الحالة" : "Status",
    actions: isRtl ? "الإجراءات" : "Actions",
    markPaid: isRtl ? "تحديد كمدفوعة" : "Mark Paid",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    noInvoices: isRtl ? "لا توجد فواتير مستحقة" : "No Outstanding Invoices",
    noInvoicesDesc: isRtl
      ? "جميع الفواتير مدفوعة. عمل رائع!"
      : "All invoices are paid. Great job!",
    noRevenueData: isRtl ? "لا توجد بيانات إيرادات" : "No Revenue Data",
    noRevenueDataDesc: isRtl
      ? "لا توجد بيانات إيرادات حسب الخطة متاحة حالياً"
      : "No revenue by plan data available yet",
    activeSubscriptions: isRtl ? "اشتراكات نشطة" : "active subscriptions",
    ofTotal: isRtl ? "من الإجمالي" : "of total",
    refresh: isRtl ? "تحديث" : "Refresh",
    monthlyRevenue: isRtl ? "الإيرادات الشهرية" : "Monthly Revenue",
  };

  // Data fetching
  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useRevenueMetrics();

  const {
    data: planRevenue,
    isLoading: planLoading,
    refetch: refetchPlans,
  } = useRevenueByPlan();

  const {
    data: invoices,
    isLoading: invoicesLoading,
    refetch: refetchInvoices,
  } = useOutstandingInvoices();

  const markPaidMutation = useMarkInvoicePaid();

  const handleMarkPaid = (invoiceId: string) => {
    markPaidMutation.mutate({ invoiceId });
  };

  const handleRefreshAll = () => {
    refetchMetrics();
    refetchPlans();
    refetchInvoices();
  };

  // Chart data
  const chartData = (planRevenue || []).map((plan: PlanRevenueResponse) => ({
    name: isRtl ? (plan.planNameAr || plan.planNameEn) : plan.planNameEn,
    revenue: plan.monthlyRevenue,
    subscriptions: plan.activeSubscriptions,
    percent: plan.percentOfTotal,
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div className={isRtl ? "text-right" : ""}>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            {texts.title}
          </h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshAll}>
          <RefreshCw className="h-4 w-4 me-1" />
          {texts.refresh}
        </Button>
      </div>

      {/* KPI Cards */}
      {metricsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-16">
                  <Loading text={texts.loading} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : metrics ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* MRR */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{texts.mrr}</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrics.mrr, metrics.currency, locale)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          {/* ARR */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{texts.arr}</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrics.arr, metrics.currency, locale)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>

          {/* MRR Growth */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{texts.mrrGrowth}</p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      metrics.mrrGrowthPercent >= 0 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {metrics.mrrGrowthPercent >= 0 ? "+" : ""}
                    {metrics.mrrGrowthPercent.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp
                  className={cn(
                    "h-8 w-8",
                    metrics.mrrGrowthPercent >= 0
                      ? "text-green-500/50"
                      : "text-red-500/50"
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Avg Revenue Per Client */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{texts.avgRevenue}</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrics.averageRevenuePerClient, metrics.currency, locale)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Revenue by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.revenueByPlan}</CardTitle>
        </CardHeader>
        <CardContent>
          {planLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loading text={texts.loading} />
            </div>
          ) : !planRevenue || planRevenue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium">{texts.noRevenueData}</p>
              <p className="text-sm text-muted-foreground">{texts.noRevenueDataDesc}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    reversed={isRtl}
                  />
                  <YAxis
                    orientation={isRtl ? "right" : "left"}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickFormatter={(value: number) => formatCompact(value, locale)}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value, planRevenue[0]?.currency || "SAR", locale),
                      texts.monthlyRevenue,
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {chartData.map((_: unknown, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PLAN_COLORS[index % PLAN_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className={cn("flex flex-wrap gap-4 justify-center", isRtl && "flex-row-reverse")}>
                {planRevenue.map((plan: PlanRevenueResponse, index: number) => (
                  <div
                    key={plan.planId}
                    className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}
                  >
                    <div
                      className="h-3 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length] }}
                    />
                    <span className="text-muted-foreground">
                      {isRtl ? (plan.planNameAr || plan.planNameEn) : plan.planNameEn}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({plan.activeSubscriptions} {texts.activeSubscriptions} &middot;{" "}
                      {plan.percentOfTotal.toFixed(1)}% {texts.ofTotal})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outstanding Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.outstandingInvoices}</CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loading text={texts.loading} />
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="font-medium">{texts.noInvoices}</p>
              <p className="text-sm text-muted-foreground">{texts.noInvoicesDesc}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("border-b", isRtl && "text-right")}>
                    <th className="pb-3 font-medium text-muted-foreground">
                      {texts.invoiceNumber}
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      {texts.tenantName}
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      {texts.amount}
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      {texts.dueDate}
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      {texts.daysOverdue}
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      {texts.status}
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      {texts.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice: OutstandingInvoiceResponse) => (
                    <tr
                      key={invoice.invoiceId}
                      className={cn(
                        "border-b last:border-0 hover:bg-muted/50 transition-colors",
                        isRtl && "text-right"
                      )}
                    >
                      <td className="py-3 font-mono text-xs">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="py-3">
                        {isRtl
                          ? invoice.tenantNameAr || invoice.tenantNameEn
                          : invoice.tenantNameEn}
                      </td>
                      <td className="py-3 font-medium">
                        {formatCurrency(invoice.amount, invoice.currency, locale)}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatDate(invoice.dueDate, locale)}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "font-medium",
                            invoice.daysOverdue > 0 ? "text-red-600" : "text-muted-foreground"
                          )}
                        >
                          {invoice.daysOverdue > 0 ? invoice.daysOverdue : "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        <InvoiceStatusBadge status={invoice.status} isRtl={isRtl} />
                      </td>
                      <td className="py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkPaid(invoice.invoiceId)}
                          disabled={markPaidMutation.isPending}
                          className="gap-1"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {texts.markPaid}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
