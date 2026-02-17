"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
  RefreshCw,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/utils";
import {
  useTicketOverview,
  useAgentPerformance,
  useTicketTrends,
} from "@liyaqa/shared/queries/platform/use-ticket-analytics";
import type { TrendPeriod } from "@liyaqa/shared/types/platform/ticket-analytics";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function TicketAnalyticsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("DAILY");

  const texts = {
    title: isRtl ? "تحليلات التذاكر" : "Ticket Analytics",
    subtitle: isRtl ? "نظرة عامة على أداء الدعم" : "Support performance overview",
    openTickets: isRtl ? "التذاكر المفتوحة" : "Open Tickets",
    closedTickets: isRtl ? "التذاكر المغلقة" : "Closed Tickets",
    avgResolution: isRtl ? "متوسط وقت الحل" : "Avg Resolution",
    slaCompliance: isRtl ? "التزام SLA" : "SLA Compliance",
    hours: isRtl ? "ساعة" : "hrs",
    agentPerformance: isRtl ? "أداء الوكلاء" : "Agent Performance",
    ticketTrends: isRtl ? "اتجاهات التذاكر" : "Ticket Trends",
    agent: isRtl ? "الوكيل" : "Agent",
    assigned: isRtl ? "معيّنة" : "Assigned",
    resolved: isRtl ? "محلولة" : "Resolved",
    avgTime: isRtl ? "متوسط الوقت" : "Avg Time",
    satisfaction: isRtl ? "الرضا" : "Satisfaction",
    daily: isRtl ? "يومي" : "Daily",
    weekly: isRtl ? "أسبوعي" : "Weekly",
    monthly: isRtl ? "شهري" : "Monthly",
    opened: isRtl ? "مفتوحة" : "Opened",
    closed: isRtl ? "مغلقة" : "Closed",
    pending: isRtl ? "معلقة" : "Pending",
    priority: isRtl ? "الأولوية" : "Priority",
    low: isRtl ? "منخفض" : "Low",
    medium: isRtl ? "متوسط" : "Medium",
    high: isRtl ? "عالي" : "High",
    urgent: isRtl ? "عاجل" : "Urgent",
    firstResponse: isRtl ? "أول استجابة" : "First Response",
    csat: isRtl ? "رضا العملاء" : "CSAT",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    noData: isRtl ? "لا توجد بيانات" : "No data available",
  };

  const { data: overview, isLoading: overviewLoading } = useTicketOverview();
  const { data: agents, isLoading: agentsLoading } = useAgentPerformance();
  const { data: trends, isLoading: trendsLoading } = useTicketTrends(trendPeriod);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={isRtl ? "text-right" : ""}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          {texts.title}
        </h1>
        <p className="text-muted-foreground">{texts.subtitle}</p>
      </div>

      {/* KPI Cards */}
      {overviewLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : overview ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{texts.openTickets}</p>
                    <p className="text-2xl font-bold">{overview.totalOpen}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{texts.closedTickets}</p>
                    <p className="text-2xl font-bold text-green-600">{overview.totalClosed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{texts.avgResolution}</p>
                    <p className="text-2xl font-bold">
                      {overview.averageResolutionHours.toFixed(1)} <span className="text-sm font-normal">{texts.hours}</span>
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{texts.slaCompliance}</p>
                    <p className={cn("text-2xl font-bold", overview.slaComplianceRate >= 90 ? "text-green-600" : overview.slaComplianceRate >= 70 ? "text-yellow-600" : "text-red-600")}>
                      {overview.slaComplianceRate.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Breakdown & Additional Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{texts.priority}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: texts.urgent, count: overview.openByPriority.urgent, color: "bg-red-500" },
                    { label: texts.high, count: overview.openByPriority.high, color: "bg-orange-500" },
                    { label: texts.medium, count: overview.openByPriority.medium, color: "bg-yellow-500" },
                    { label: texts.low, count: overview.openByPriority.low, color: "bg-blue-500" },
                  ].map(({ label, count, color }) => (
                    <div key={label} className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                      <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                        <div className={cn("h-3 w-3 rounded-full", color)} />
                        <span className="text-sm">{label}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isRtl ? "مقاييس إضافية" : "Additional Metrics"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                    <span className="text-sm text-muted-foreground">{texts.firstResponse}</span>
                    <span className="font-medium">{overview.firstResponseTimeHours.toFixed(1)} {texts.hours}</span>
                  </div>
                  <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                    <span className="text-sm text-muted-foreground">{texts.csat}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{overview.customerSatisfactionScore.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                    <span className="text-sm text-muted-foreground">{texts.pending}</span>
                    <span className="font-medium">{overview.totalPending}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Ticket Trends */}
      <Card>
        <CardHeader>
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <CardTitle className="text-base">{texts.ticketTrends}</CardTitle>
            <div className={cn("flex gap-1", isRtl && "flex-row-reverse")}>
              {([
                { value: "DAILY" as TrendPeriod, label: texts.daily },
                { value: "WEEKLY" as TrendPeriod, label: texts.weekly },
                { value: "MONTHLY" as TrendPeriod, label: texts.monthly },
              ]).map(({ value, label }) => (
                <Button
                  key={value}
                  variant={trendPeriod === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTrendPeriod(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : trends?.data?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="opened" stroke="#f59e0b" name={texts.opened} strokeWidth={2} />
                <Line type="monotone" dataKey="closed" stroke="#22c55e" name={texts.closed} strokeWidth={2} />
                <Line type="monotone" dataKey="pending" stroke="#3b82f6" name={texts.pending} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">{texts.noData}</p>
          )}
        </CardContent>
      </Card>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            {texts.agentPerformance}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : !agents?.length ? (
            <p className="text-center text-muted-foreground py-8">{texts.noData}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("border-b text-muted-foreground", isRtl && "text-right")}>
                    <th className="pb-3 font-medium">{texts.agent}</th>
                    <th className="pb-3 font-medium text-center">{texts.assigned}</th>
                    <th className="pb-3 font-medium text-center">{texts.resolved}</th>
                    <th className="pb-3 font-medium text-center">{texts.avgTime}</th>
                    <th className="pb-3 font-medium text-center">{texts.slaCompliance}</th>
                    <th className="pb-3 font-medium text-center">{texts.satisfaction}</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.agentId} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{agent.agentName}</p>
                          <p className="text-xs text-muted-foreground">{agent.agentEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 text-center">{agent.assignedTickets}</td>
                      <td className="py-3 text-center">
                        <span className="text-green-600">{agent.resolvedTickets}</span>
                      </td>
                      <td className="py-3 text-center">
                        {agent.averageResolutionHours.toFixed(1)} {texts.hours}
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={agent.slaComplianceRate >= 90 ? "default" : agent.slaComplianceRate >= 70 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {agent.slaComplianceRate.toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {agent.customerSatisfactionScore.toFixed(1)}
                        </div>
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
