"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Target,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Check,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@liyaqa/shared/components/ui/dialog";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  useBudgets,
  useBudgetSummary,
  useCreateBudget,
  useRecordBudgetActual,
} from "@liyaqa/shared/queries/use-forecasting";
import {
  METRIC_TYPE_LABELS,
  METRIC_TYPE_LABELS_AR,
  MONTH_NAMES,
  MONTH_NAMES_AR,
  type MetricType,
} from "@liyaqa/shared/types/forecasting";
import { formatCurrency } from "@liyaqa/shared/utils";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

export default function BudgetPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({
    fiscalMonth: 1,
    metricType: "REVENUE" as MetricType,
    budgetedValue: "",
    notes: "",
  });

  const {
    data: budgets,
    isLoading: budgetsLoading,
    refetch,
  } = useBudgets({ year: selectedYear });
  const { data: summary, isLoading: summaryLoading } =
    useBudgetSummary(selectedYear);
  const createBudget = useCreateBudget();
  const recordActual = useRecordBudgetActual();

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const texts = {
    title: isArabic ? "إدارة الميزانية" : "Budget Management",
    subtitle: isArabic
      ? "تتبع الميزانية مقابل الأداء الفعلي"
      : "Track budget vs actual performance",
    addBudget: isArabic ? "إضافة ميزانية" : "Add Budget",
    fiscalYear: isArabic ? "السنة المالية" : "Fiscal Year",
    month: isArabic ? "الشهر" : "Month",
    metricType: isArabic ? "نوع المقياس" : "Metric Type",
    budgetedValue: isArabic ? "القيمة المخططة" : "Budgeted Value",
    actualValue: isArabic ? "القيمة الفعلية" : "Actual Value",
    variance: isArabic ? "الفرق" : "Variance",
    status: isArabic ? "الحالة" : "Status",
    notes: isArabic ? "ملاحظات" : "Notes",
    save: isArabic ? "حفظ" : "Save",
    cancel: isArabic ? "إلغاء" : "Cancel",
    totalBudgeted: isArabic ? "إجمالي الميزانية" : "Total Budgeted",
    totalActual: isArabic ? "إجمالي الفعلي" : "Total Actual",
    totalVariance: isArabic ? "إجمالي الفرق" : "Total Variance",
    onTarget: isArabic ? "على الهدف" : "On Target",
    overBudget: isArabic ? "تجاوز الميزانية" : "Over Budget",
    underBudget: isArabic ? "أقل من الميزانية" : "Under Budget",
    noBudgets: isArabic ? "لا توجد ميزانيات" : "No budgets found",
    createFirst: isArabic
      ? "أنشئ ميزانيتك الأولى"
      : "Create your first budget",
  };

  const metricLabels = isArabic ? METRIC_TYPE_LABELS_AR : METRIC_TYPE_LABELS;
  const monthNames = isArabic ? MONTH_NAMES_AR : MONTH_NAMES;

  const handleCreateBudget = async () => {
    if (!newBudget.budgetedValue) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic
          ? "الرجاء إدخال القيمة المخططة"
          : "Please enter budgeted value",
        variant: "destructive",
      });
      return;
    }

    try {
      await createBudget.mutateAsync({
        fiscalYear: selectedYear,
        fiscalMonth: newBudget.fiscalMonth,
        metricType: newBudget.metricType,
        budgetedValue: parseFloat(newBudget.budgetedValue),
        notes: newBudget.notes || undefined,
      });

      toast({
        title: isArabic ? "تم الإنشاء" : "Created",
        description: isArabic ? "تم إنشاء الميزانية" : "Budget created successfully",
      });

      setIsCreateOpen(false);
      setNewBudget({
        fiscalMonth: 1,
        metricType: "REVENUE",
        budgetedValue: "",
        notes: "",
      });
      refetch();
    } catch {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic
          ? "فشل في إنشاء الميزانية"
          : "Failed to create budget",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (budget: {
    isOnTarget: boolean;
    isOverBudget: boolean;
    variance: number | null;
  }) => {
    if (budget.variance === null) {
      return (
        <Badge variant="outline">
          {isArabic ? "في الانتظار" : "Pending"}
        </Badge>
      );
    }
    if (budget.isOnTarget) {
      return (
        <Badge className="bg-success text-white">
          <Check className="h-3 w-3 me-1" />
          {texts.onTarget}
        </Badge>
      );
    }
    if (budget.isOverBudget) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 me-1" />
          {texts.overBudget}
        </Badge>
      );
    }
    return (
      <Badge className="bg-warning text-white">
        <TrendingDown className="h-3 w-3 me-1" />
        {texts.underBudget}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Target className="h-6 w-6" />
            {texts.title}
          </h1>
          <p className="text-neutral-500">{texts.subtitle}</p>
        </div>

        <div className="flex gap-2">
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                {texts.addBudget}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{texts.addBudget}</DialogTitle>
                <DialogDescription>
                  {isArabic
                    ? `إضافة ميزانية جديدة لعام ${selectedYear}`
                    : `Add a new budget for ${selectedYear}`}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>{texts.month}</Label>
                  <Select
                    value={String(newBudget.fiscalMonth)}
                    onValueChange={(v) =>
                      setNewBudget({ ...newBudget, fiscalMonth: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((month, i) => (
                        <SelectItem key={i} value={String(i + 1)}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{texts.metricType}</Label>
                  <Select
                    value={newBudget.metricType}
                    onValueChange={(v) =>
                      setNewBudget({
                        ...newBudget,
                        metricType: v as MetricType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(metricLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{texts.budgetedValue}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newBudget.budgetedValue}
                    onChange={(e) =>
                      setNewBudget({
                        ...newBudget,
                        budgetedValue: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>{texts.notes}</Label>
                  <Textarea
                    value={newBudget.notes}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, notes: e.target.value })
                    }
                    placeholder={
                      isArabic ? "ملاحظات اختيارية..." : "Optional notes..."
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  {texts.cancel}
                </Button>
                <Button
                  onClick={handleCreateBudget}
                  disabled={createBudget.isPending}
                >
                  {texts.save}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                {texts.totalBudgeted}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.totalBudgeted, "SAR", locale)}
              </p>
              <p className="text-sm text-neutral-500">
                {summary.budgetCount}{" "}
                {isArabic ? "ميزانيات" : "budgets"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                {texts.totalActual}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(summary.totalActual, "SAR", locale)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                {texts.totalVariance}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  summary.totalVariance >= 0
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {summary.totalVariance >= 0 ? "+" : ""}
                {formatCurrency(summary.totalVariance, "SAR", locale)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                {texts.status}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge className="bg-success text-white">
                  <Check className="h-3 w-3 me-1" />
                  {summary.onTargetCount}
                </Badge>
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 me-1" />
                  {summary.overBudgetCount}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Budget List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isArabic ? `ميزانيات ${selectedYear}` : `${selectedYear} Budgets`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {budgetsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : budgets && budgets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-start py-3 px-2">{texts.month}</th>
                    <th className="text-start py-3 px-2">{texts.metricType}</th>
                    <th className="text-end py-3 px-2">{texts.budgetedValue}</th>
                    <th className="text-end py-3 px-2">{texts.actualValue}</th>
                    <th className="text-end py-3 px-2">{texts.variance}</th>
                    <th className="text-center py-3 px-2">{texts.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => (
                    <tr key={budget.id} className="border-b hover:bg-neutral-50">
                      <td className="py-3 px-2">
                        {monthNames[budget.fiscalMonth - 1]}
                      </td>
                      <td className="py-3 px-2">
                        {metricLabels[budget.metricType]}
                      </td>
                      <td className="text-end py-3 px-2">
                        {formatCurrency(budget.budgetedValue, "SAR", locale)}
                      </td>
                      <td className="text-end py-3 px-2">
                        {budget.actualValue !== null
                          ? formatCurrency(budget.actualValue, "SAR", locale)
                          : "-"}
                      </td>
                      <td
                        className={`text-end py-3 px-2 ${
                          budget.variance !== null
                            ? budget.variance >= 0
                              ? "text-success"
                              : "text-destructive"
                            : ""
                        }`}
                      >
                        {budget.variance !== null ? (
                          <span className="flex items-center justify-end gap-1">
                            {budget.variance >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {budget.variance >= 0 ? "+" : ""}
                            {formatCurrency(budget.variance, "SAR", locale)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {getStatusBadge(budget)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {texts.noBudgets}
              </h3>
              <p className="text-neutral-500 mb-4">{texts.createFirst}</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 me-2" />
                {texts.addBudget}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
