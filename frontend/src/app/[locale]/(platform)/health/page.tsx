"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Users,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { HealthOverview } from "@/components/platform/health-overview";
import { QuickActionMenu } from "@/components/platform/quick-action-menu";
import {
  usePlatformHealthOverview,
  useAtRiskClients,
  type RiskLevel,
  type HealthTrend,
  type ClientHealthScore,
} from "@/queries/platform/use-health";

/**
 * Risk level badge colors
 */
const riskColors: Record<RiskLevel, { color: string; bgColor: string; labelEn: string; labelAr: string }> = {
  LOW: {
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    labelEn: "Healthy",
    labelAr: "صحي",
  },
  MEDIUM: {
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    labelEn: "Monitor",
    labelAr: "مراقبة",
  },
  HIGH: {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    labelEn: "At Risk",
    labelAr: "معرض للخطر",
  },
  CRITICAL: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    labelEn: "Critical",
    labelAr: "حرج",
  },
};

/**
 * Trend icon component
 */
function TrendIcon({ trend }: { trend: HealthTrend }) {
  switch (trend) {
    case "IMPROVING":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "DECLINING":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

/**
 * Score breakdown bar
 */
function ScoreBreakdown({ client, locale }: { client: ClientHealthScore; locale: string }) {
  const isRtl = locale === "ar";

  const scores = [
    { key: "usage", value: client.usageScore, color: "bg-blue-500", labelEn: "Usage", labelAr: "الاستخدام" },
    { key: "engagement", value: client.engagementScore, color: "bg-purple-500", labelEn: "Engagement", labelAr: "التفاعل" },
    { key: "payment", value: client.paymentScore, color: "bg-emerald-500", labelEn: "Payment", labelAr: "الدفع" },
    { key: "support", value: client.supportScore, color: "bg-amber-500", labelEn: "Support", labelAr: "الدعم" },
  ];

  return (
    <div className="flex items-center gap-1">
      {scores.map((score) => (
        <div
          key={score.key}
          className={cn("h-2 rounded-full", score.color)}
          style={{ width: `${score.value}%`, maxWidth: "25%" }}
          title={`${isRtl ? score.labelAr : score.labelEn}: ${score.value}`}
        />
      ))}
    </div>
  );
}

/**
 * Platform Health Dashboard Page
 */
export default function HealthDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  const [riskFilter, setRiskFilter] = useState<RiskLevel | "ALL">("ALL");
  const [trendFilter, setTrendFilter] = useState<HealthTrend | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const texts = {
    title: isRtl ? "صحة العملاء" : "Client Health",
    subtitle: isRtl ? "مراقبة صحة جميع العملاء" : "Monitor health of all clients",
    search: isRtl ? "البحث عن عميل..." : "Search clients...",
    riskLevel: isRtl ? "مستوى المخاطر" : "Risk Level",
    trend: isRtl ? "الاتجاه" : "Trend",
    all: isRtl ? "الكل" : "All",
    export: isRtl ? "تصدير" : "Export",
    refresh: isRtl ? "تحديث" : "Refresh",
    bulkActions: isRtl ? "إجراءات جماعية" : "Bulk Actions",
    sendCheckIn: isRtl ? "إرسال متابعة" : "Send Check-in",
    assignCsm: isRtl ? "تعيين مدير نجاح" : "Assign CSM",
    client: isRtl ? "العميل" : "Client",
    score: isRtl ? "الدرجة" : "Score",
    change: isRtl ? "التغيير" : "Change",
    breakdown: isRtl ? "التفصيل" : "Breakdown",
    actions: isRtl ? "الإجراءات" : "Actions",
    noClients: isRtl ? "لا يوجد عملاء" : "No clients found",
    improving: isRtl ? "تحسن" : "Improving",
    stable: isRtl ? "مستقر" : "Stable",
    declining: isRtl ? "تراجع" : "Declining",
  };

  // Fetch data
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = usePlatformHealthOverview();
  const { data: clients, isLoading: clientsLoading, refetch: refetchClients } = useAtRiskClients(
    riskFilter === "ALL" ? undefined : riskFilter,
    100
  );

  // Filter clients
  const filteredClients = (clients || []).filter((client) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !client.organizationNameEn.toLowerCase().includes(search) &&
        !(client.organizationNameAr || "").toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    if (trendFilter !== "ALL" && client.trend !== trendFilter) {
      return false;
    }
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(filteredClients.map((c) => c.organizationId));
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectClient = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients([...selectedClients, clientId]);
    } else {
      setSelectedClients(selectedClients.filter((id) => id !== clientId));
    }
  };

  const handleRefresh = () => {
    refetchOverview();
    refetchClients();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div className={isRtl ? "text-right" : ""}>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            {texts.title}
          </h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 me-1" />
            {texts.refresh}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 me-1" />
            {texts.export}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "إجمالي العملاء" : "Total Clients"}
                </p>
                <p className="text-2xl font-bold">{overview?.totalClients || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "صحي" : "Healthy"}
                </p>
                <p className="text-2xl font-bold text-green-600">{overview?.healthyCount || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "مراقبة" : "Monitor"}
                </p>
                <p className="text-2xl font-bold text-yellow-600">{overview?.monitorCount || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "معرض للخطر" : "At Risk"}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {(overview?.atRiskCount || 0) + (overview?.criticalCount || 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={cn(
              "flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
              isRtl && "md:flex-row-reverse"
            )}
          >
            <div className={cn("flex flex-wrap items-center gap-2", isRtl && "flex-row-reverse")}>
              <Input
                placeholder={texts.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select
                value={riskFilter}
                onValueChange={(v) => setRiskFilter(v as RiskLevel | "ALL")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={texts.riskLevel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="LOW">{isRtl ? "صحي" : "Healthy"}</SelectItem>
                  <SelectItem value="MEDIUM">{isRtl ? "مراقبة" : "Monitor"}</SelectItem>
                  <SelectItem value="HIGH">{isRtl ? "معرض للخطر" : "At Risk"}</SelectItem>
                  <SelectItem value="CRITICAL">{isRtl ? "حرج" : "Critical"}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={trendFilter}
                onValueChange={(v) => setTrendFilter(v as HealthTrend | "ALL")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={texts.trend} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="IMPROVING">{texts.improving}</SelectItem>
                  <SelectItem value="STABLE">{texts.stable}</SelectItem>
                  <SelectItem value="DECLINING">{texts.declining}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedClients.length > 0 && (
              <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                <span className="text-sm text-muted-foreground">
                  {selectedClients.length} {isRtl ? "مختار" : "selected"}
                </span>
                <Button variant="outline" size="sm">
                  {texts.sendCheckIn}
                </Button>
                <Button variant="outline" size="sm">
                  {texts.assignCsm}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredClients.length > 0 &&
                      selectedClients.length === filteredClients.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className={isRtl ? "text-right" : ""}>{texts.client}</TableHead>
                <TableHead className="text-center">{texts.score}</TableHead>
                <TableHead className="text-center">{texts.riskLevel}</TableHead>
                <TableHead className="text-center">{texts.change}</TableHead>
                <TableHead className="w-48">{texts.breakdown}</TableHead>
                <TableHead className="w-12">{texts.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <span className="text-muted-foreground">Loading...</span>
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {texts.noClients}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const risk = riskColors[client.riskLevel];
                  return (
                    <TableRow
                      key={client.organizationId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/${locale}/platform/clients/${client.organizationId}/health`)
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedClients.includes(client.organizationId)}
                          onCheckedChange={(checked) =>
                            handleSelectClient(client.organizationId, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className={isRtl ? "text-right" : ""}>
                        <div className="font-medium">
                          {isRtl
                            ? client.organizationNameAr || client.organizationNameEn
                            : client.organizationNameEn}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={cn(
                            "inline-flex items-center justify-center h-10 w-10 rounded-full font-bold",
                            risk.bgColor,
                            risk.color
                          )}
                        >
                          {client.overallScore}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(risk.color, "border-current")}>
                          {isRtl ? risk.labelAr : risk.labelEn}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendIcon trend={client.trend} />
                          <span
                            className={cn(
                              "text-sm",
                              client.scoreChange > 0 && "text-green-600",
                              client.scoreChange < 0 && "text-red-600"
                            )}
                          >
                            {client.scoreChange > 0 ? "+" : ""}
                            {client.scoreChange}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ScoreBreakdown client={client} locale={locale} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <QuickActionMenu
                          context="at_risk"
                          entityId={client.organizationId}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
