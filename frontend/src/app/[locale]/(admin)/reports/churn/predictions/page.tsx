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
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Users,
  TrendingDown,
  Activity,
  ArrowRight,
  RefreshCw,
  Brain,
} from "lucide-react";
import {
  useRiskDistribution,
  useAtRiskMembers,
  useActiveChurnModel,
  useGeneratePredictions,
} from "@/queries/use-churn";
import {
  RISK_LEVEL_LABELS,
  RISK_LEVEL_LABELS_AR,
  RISK_LEVEL_COLORS,
  INTERVENTION_STATUS_LABELS,
  INTERVENTION_STATUS_LABELS_AR,
  type RiskLevel,
} from "@/types/churn";

export default function ChurnPredictionsDashboardPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [page, setPage] = useState(0);

  const { data: distribution, isLoading: loadingDistribution } = useRiskDistribution();
  const { data: atRiskPage, isLoading: loadingAtRisk } = useAtRiskMembers(page, 10);
  const { data: activeModel, isLoading: loadingModel } = useActiveChurnModel();
  const generateMutation = useGeneratePredictions();

  const handleGeneratePredictions = () => {
    generateMutation.mutate({ validityDays: 30 });
  };

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
            {isArabic ? "التنبؤ بالتسرب (ML)" : "Churn Prediction (ML)"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "تحليل مخاطر تسرب الأعضاء بالذكاء الاصطناعي"
              : "AI-powered member churn risk analysis"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGeneratePredictions}
            disabled={generateMutation.isPending || !activeModel}
          >
            {generateMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Brain className="h-4 w-4 me-2" />
            )}
            {isArabic ? "تشغيل التنبؤات" : "Run Predictions"}
          </Button>
          <Link href="/reports/churn/model-accuracy">
            <Button variant="outline">
              {isArabic ? "دقة النموذج" : "Model Accuracy"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Model Info */}
      {loadingModel ? (
        <Skeleton className="h-12 w-full" />
      ) : activeModel ? (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{activeModel.algorithm}</Badge>
                <span className="text-sm text-muted-foreground">
                  {isArabic ? "الإصدار:" : "Version:"} {activeModel.modelVersion}
                </span>
                {activeModel.accuracy && (
                  <span className="text-sm">
                    {isArabic ? "الدقة:" : "Accuracy:"}{" "}
                    <span className="font-semibold">
                      {(activeModel.accuracy * 100).toFixed(1)}%
                    </span>
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {isArabic ? "تم التدريب:" : "Trained:"}{" "}
                {new Date(activeModel.trainedAt).toLocaleDateString(
                  isArabic ? "ar-SA" : "en-US"
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? "لا يوجد نموذج نشط. يرجى تفعيل نموذج أولاً."
                : "No active model. Please activate a model first."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Risk Distribution Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {loadingDistribution ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "خطر حرج" : "Critical Risk"}
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {distribution?.critical ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "أعضاء بحاجة لتدخل فوري" : "Members need immediate intervention"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "خطر عالي" : "High Risk"}
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {distribution?.high ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "أعضاء بحاجة للمتابعة" : "Members need follow-up"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "خطر متوسط" : "Medium Risk"}
                </CardTitle>
                <Activity className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">
                  {distribution?.medium ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "أعضاء للمراقبة" : "Members to monitor"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "خطر منخفض" : "Low Risk"}
                </CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {distribution?.low ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "أعضاء مستقرون" : "Stable members"}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* At-Risk Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {isArabic ? "الأعضاء المعرضون للخطر" : "At-Risk Members"}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "أعضاء بمستوى خطر عالي أو حرج"
                  : "Members with HIGH or CRITICAL risk level"}
              </CardDescription>
            </div>
            <Link href="/reports/churn/at-risk">
              <Button variant="outline" size="sm">
                {isArabic ? "عرض الكل" : "View All"}
                <ArrowRight className="h-4 w-4 ms-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAtRisk ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : atRiskPage?.content.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {isArabic ? "لا يوجد أعضاء معرضون للخطر" : "No at-risk members found"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isArabic ? "معرف العضو" : "Member ID"}</TableHead>
                  <TableHead>{isArabic ? "درجة الخطر" : "Churn Score"}</TableHead>
                  <TableHead>{isArabic ? "مستوى الخطر" : "Risk Level"}</TableHead>
                  <TableHead>{isArabic ? "حالة التدخل" : "Intervention Status"}</TableHead>
                  <TableHead>{isArabic ? "تاريخ التنبؤ" : "Prediction Date"}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atRiskPage?.content.map((prediction) => (
                  <TableRow key={prediction.id}>
                    <TableCell className="font-mono text-sm">
                      {prediction.memberId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className="bg-destructive h-2 rounded-full"
                            style={{ width: `${prediction.churnScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
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
                      <Badge variant="outline">
                        {getStatusLabel(prediction.interventionStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(prediction.predictionDate).toLocaleDateString(
                        isArabic ? "ar-SA" : "en-US"
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/reports/churn/interventions?predictionId=${prediction.id}`}>
                        <Button variant="ghost" size="sm">
                          {isArabic ? "إنشاء تدخل" : "Create Intervention"}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/reports/churn/at-risk">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">
                {isArabic ? "قائمة المعرضين للخطر" : "At-Risk List"}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "عرض جميع الأعضاء حسب مستوى الخطر"
                  : "View all members by risk level"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/reports/churn/interventions">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">
                {isArabic ? "التدخلات" : "Interventions"}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "إدارة تدخلات الاحتفاظ بالأعضاء"
                  : "Manage member retention interventions"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/reports/churn/model-accuracy">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">
                {isArabic ? "دقة النموذج" : "Model Accuracy"}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "عرض مقاييس أداء نموذج ML"
                  : "View ML model performance metrics"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
