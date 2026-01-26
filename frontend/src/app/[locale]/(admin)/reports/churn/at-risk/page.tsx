"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Phone,
  Mail,
  Gift,
} from "lucide-react";
import {
  usePredictionsByRiskLevel,
  useAtRiskMembers,
} from "@/queries/use-churn";
import {
  RISK_LEVEL_LABELS,
  RISK_LEVEL_LABELS_AR,
  RISK_LEVEL_COLORS,
  INTERVENTION_STATUS_LABELS,
  INTERVENTION_STATUS_LABELS_AR,
  type RiskLevel,
} from "@/types/churn";

export default function AtRiskMembersPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [page, setPage] = useState(0);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "ALL">("ALL");
  const pageSize = 20;

  const { data: allAtRisk, isLoading: loadingAll } = useAtRiskMembers(
    page,
    pageSize,
    { enabled: riskFilter === "ALL" }
  );

  const { data: filteredRisk, isLoading: loadingFiltered } = usePredictionsByRiskLevel(
    riskFilter as RiskLevel,
    page,
    pageSize,
    { enabled: riskFilter !== "ALL" }
  );

  const isLoading = riskFilter === "ALL" ? loadingAll : loadingFiltered;
  const data = riskFilter === "ALL" ? allAtRisk : filteredRisk;

  const getRiskLabel = (level: RiskLevel) =>
    isArabic ? RISK_LEVEL_LABELS_AR[level] : RISK_LEVEL_LABELS[level];

  const getStatusLabel = (status: string) =>
    isArabic
      ? INTERVENTION_STATUS_LABELS_AR[status as keyof typeof INTERVENTION_STATUS_LABELS_AR]
      : INTERVENTION_STATUS_LABELS[status as keyof typeof INTERVENTION_STATUS_LABELS];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "الأعضاء المعرضون للخطر" : "At-Risk Members"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "قائمة الأعضاء المعرضين لخطر التسرب"
              : "Members identified as at-risk for churning"}
          </p>
        </div>
        <Link href="/reports/churn/predictions">
          <Button variant="outline">
            {isArabic ? "العودة للوحة التحكم" : "Back to Dashboard"}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isArabic ? "تصفية حسب الخطر:" : "Filter by Risk:"}
              </span>
              <Select
                value={riskFilter}
                onValueChange={(v) => {
                  setRiskFilter(v as RiskLevel | "ALL");
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {isArabic ? "الكل (عالي + حرج)" : "All (High + Critical)"}
                  </SelectItem>
                  <SelectItem value="CRITICAL">
                    {isArabic ? "حرج فقط" : "Critical Only"}
                  </SelectItem>
                  <SelectItem value="HIGH">
                    {isArabic ? "عالي فقط" : "High Only"}
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    {isArabic ? "متوسط" : "Medium"}
                  </SelectItem>
                  <SelectItem value="LOW">
                    {isArabic ? "منخفض" : "Low"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {data && (
              <span className="text-sm text-muted-foreground">
                {isArabic
                  ? `إجمالي: ${data.totalElements} عضو`
                  : `Total: ${data.totalElements} members`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isArabic ? "قائمة الأعضاء" : "Member List"}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? "انقر على العضو لعرض التفاصيل وإنشاء تدخل"
              : "Click on a member to view details and create an intervention"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.content.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isArabic
                  ? "لا يوجد أعضاء في هذه الفئة"
                  : "No members found in this category"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isArabic ? "معرف العضو" : "Member ID"}</TableHead>
                    <TableHead>{isArabic ? "درجة الخطر" : "Churn Score"}</TableHead>
                    <TableHead>{isArabic ? "مستوى الخطر" : "Risk Level"}</TableHead>
                    <TableHead>{isArabic ? "عوامل الخطر الرئيسية" : "Top Risk Factors"}</TableHead>
                    <TableHead>{isArabic ? "حالة التدخل" : "Intervention Status"}</TableHead>
                    <TableHead>{isArabic ? "صالح حتى" : "Valid Until"}</TableHead>
                    <TableHead>{isArabic ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.content.map((prediction) => (
                    <TableRow key={prediction.id}>
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/members/${prediction.memberId}`}
                          className="hover:underline text-primary"
                        >
                          {prediction.memberId.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                prediction.churnScore >= 80
                                  ? "bg-destructive"
                                  : prediction.churnScore >= 60
                                  ? "bg-orange-500"
                                  : prediction.churnScore >= 40
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${prediction.churnScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold">
                            {prediction.churnScore}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={RISK_LEVEL_COLORS[prediction.riskLevel]}>
                          {getRiskLabel(prediction.riskLevel)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {prediction.topRiskFactors?.slice(0, 2).map((factor, i) => (
                            <div key={i} className="text-xs text-muted-foreground truncate">
                              • {isArabic && factor.descriptionAr
                                ? factor.descriptionAr
                                : factor.description}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            prediction.interventionStatus === "COMPLETED"
                              ? "default"
                              : prediction.interventionStatus === "IN_PROGRESS"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {getStatusLabel(prediction.interventionStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {prediction.validUntil
                          ? new Date(prediction.validUntil).toLocaleDateString(
                              isArabic ? "ar-SA" : "en-US"
                            )
                          : "-"}
                        {prediction.isExpired && (
                          <Badge variant="destructive" className="ms-2 text-xs">
                            {isArabic ? "منتهي" : "Expired"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/reports/churn/interventions?predictionId=${prediction.id}`}>
                            <Button variant="ghost" size="icon" title={isArabic ? "إنشاء تدخل" : "Create Intervention"}>
                              <Gift className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" title={isArabic ? "اتصال" : "Call"}>
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title={isArabic ? "بريد" : "Email"}>
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {isArabic
                      ? `صفحة ${page + 1} من ${data.totalPages}`
                      : `Page ${page + 1} of ${data.totalPages}`}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={data.first}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={data.last}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
