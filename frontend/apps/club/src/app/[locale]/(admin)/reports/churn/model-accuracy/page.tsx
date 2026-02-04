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
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Brain,
  Target,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  useChurnModels,
  useActiveChurnModel,
  useActivateChurnModel,
} from "@liyaqa/shared/queries/use-churn";

export default function ModelAccuracyPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [page, setPage] = useState(0);

  const { data: modelsPage, isLoading } = useChurnModels(page, 10);
  const { data: activeModel } = useActiveChurnModel();
  const activateMutation = useActivateChurnModel();

  const handleActivate = (id: string) => {
    if (confirm(isArabic ? "هل أنت متأكد من تفعيل هذا النموذج؟" : "Are you sure you want to activate this model?")) {
      activateMutation.mutate(id);
    }
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "دقة نموذج ML" : "ML Model Accuracy"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "عرض وإدارة نماذج التعلم الآلي للتنبؤ بالتسرب"
              : "View and manage ML models for churn prediction"}
          </p>
        </div>
        <Link href="/reports/churn/predictions">
          <Button variant="outline">
            {isArabic ? "العودة للوحة التحكم" : "Back to Dashboard"}
          </Button>
        </Link>
      </div>

      {/* Active Model Summary */}
      {activeModel && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle>{isArabic ? "النموذج النشط" : "Active Model"}</CardTitle>
              </div>
              <Badge>{activeModel.algorithm}</Badge>
            </div>
            <CardDescription>
              {isArabic ? "الإصدار" : "Version"}: {activeModel.modelVersion} |{" "}
              {isArabic ? "تم التدريب" : "Trained"}:{" "}
              {new Date(activeModel.trainedAt).toLocaleDateString(isArabic ? "ar-SA" : "en-US")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{isArabic ? "الدقة" : "Accuracy"}</span>
                </div>
                <div className="text-2xl font-bold">{formatPercentage(activeModel.accuracy)}</div>
                {activeModel.accuracy && (
                  <Progress value={activeModel.accuracy * 100} className="h-2" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{isArabic ? "الضبط" : "Precision"}</span>
                </div>
                <div className="text-2xl font-bold">{formatPercentage(activeModel.precisionScore)}</div>
                {activeModel.precisionScore && (
                  <Progress value={activeModel.precisionScore * 100} className="h-2" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{isArabic ? "الاسترجاع" : "Recall"}</span>
                </div>
                <div className="text-2xl font-bold">{formatPercentage(activeModel.recallScore)}</div>
                {activeModel.recallScore && (
                  <Progress value={activeModel.recallScore * 100} className="h-2" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">F1 Score</span>
                </div>
                <div className="text-2xl font-bold">{formatPercentage(activeModel.f1Score)}</div>
                {activeModel.f1Score && (
                  <Progress value={activeModel.f1Score * 100} className="h-2" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">AUC Score</span>
                </div>
                <div className="text-2xl font-bold">{formatPercentage(activeModel.aucScore)}</div>
                {activeModel.aucScore && (
                  <Progress value={activeModel.aucScore * 100} className="h-2" />
                )}
              </div>
            </div>

            {/* Feature Weights */}
            {activeModel.featureWeights && Object.keys(activeModel.featureWeights).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">
                  {isArabic ? "أهمية الميزات" : "Feature Importance"}
                </h4>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(activeModel.featureWeights)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 9)
                    .map(([feature, weight]) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="truncate">{feature}</span>
                            <span className="font-medium">{(weight * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={weight * 100} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Models Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "جميع النماذج" : "All Models"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "سجل نماذج التعلم الآلي المدربة"
              : "History of trained ML models"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : modelsPage?.content.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isArabic ? "لا توجد نماذج مدربة بعد" : "No trained models yet"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isArabic ? "الإصدار" : "Version"}</TableHead>
                    <TableHead>{isArabic ? "الخوارزمية" : "Algorithm"}</TableHead>
                    <TableHead>{isArabic ? "الدقة" : "Accuracy"}</TableHead>
                    <TableHead>{isArabic ? "الضبط" : "Precision"}</TableHead>
                    <TableHead>{isArabic ? "الاسترجاع" : "Recall"}</TableHead>
                    <TableHead>F1</TableHead>
                    <TableHead>AUC</TableHead>
                    <TableHead>{isArabic ? "عينات التدريب" : "Training Samples"}</TableHead>
                    <TableHead>{isArabic ? "تاريخ التدريب" : "Trained At"}</TableHead>
                    <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelsPage?.content.map((model) => (
                    <TableRow key={model.id} className={model.isActive ? "bg-primary/5" : ""}>
                      <TableCell className="font-mono">{model.modelVersion}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{model.algorithm}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPercentage(model.accuracy)}
                      </TableCell>
                      <TableCell>{formatPercentage(model.precisionScore)}</TableCell>
                      <TableCell>{formatPercentage(model.recallScore)}</TableCell>
                      <TableCell>{formatPercentage(model.f1Score)}</TableCell>
                      <TableCell>{formatPercentage(model.aucScore)}</TableCell>
                      <TableCell>
                        {model.trainingSamples?.toLocaleString() ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(model.trainedAt).toLocaleDateString(
                          isArabic ? "ar-SA" : "en-US"
                        )}
                      </TableCell>
                      <TableCell>
                        {model.isActive ? (
                          <Badge className="bg-green-500">
                            {isArabic ? "نشط" : "Active"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {isArabic ? "غير نشط" : "Inactive"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!model.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivate(model.id)}
                            disabled={activateMutation.isPending}
                          >
                            {isArabic ? "تفعيل" : "Activate"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {modelsPage && modelsPage.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {isArabic
                      ? `صفحة ${page + 1} من ${modelsPage.totalPages}`
                      : `Page ${page + 1} of ${modelsPage.totalPages}`}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={modelsPage.first}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={modelsPage.last}
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

      {/* Metrics Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "شرح المقاييس" : "Metrics Explanation"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <h4 className="font-medium">{isArabic ? "الدقة (Accuracy)" : "Accuracy"}</h4>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? "نسبة التنبؤات الصحيحة من إجمالي التنبؤات"
                  : "Percentage of correct predictions out of total predictions"}
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">{isArabic ? "الضبط (Precision)" : "Precision"}</h4>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? "نسبة التنبؤات الإيجابية الصحيحة من إجمالي التنبؤات الإيجابية"
                  : "Percentage of true positives out of all positive predictions"}
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">{isArabic ? "الاسترجاع (Recall)" : "Recall"}</h4>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? "نسبة الحالات الإيجابية الفعلية التي تم تحديدها بشكل صحيح"
                  : "Percentage of actual positives that were correctly identified"}
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">F1 Score</h4>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? "المتوسط التوافقي بين الضبط والاسترجاع"
                  : "Harmonic mean of precision and recall"}
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">AUC Score</h4>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? "المساحة تحت منحنى ROC - قدرة النموذج على التمييز"
                  : "Area Under ROC Curve - model's ability to discriminate"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
