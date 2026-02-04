"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Calculator,
  Plus,
  Play,
  Star,
  Trash2,
  BarChart3,
  TrendingUp,
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
import { Slider } from "@liyaqa/shared/components/ui/slider";
import {
  useScenarios,
  useCreateScenario,
  useCalculateScenario,
  useSetScenarioAsBaseline,
  useDeleteScenario,
  useCompareScenarios,
} from "@liyaqa/shared/queries/use-forecasting";
import type { ScenarioAdjustments, ForecastScenario } from "@liyaqa/shared/types/forecasting";
import { formatCurrency } from "@liyaqa/shared/utils";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

export default function ScenariosPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [newScenario, setNewScenario] = useState({
    name: "",
    nameAr: "",
    description: "",
    membershipGrowthRate: 0,
    priceChangePercent: 0,
    churnReductionPercent: 0,
  });

  const { data: scenariosPage, isLoading, refetch } = useScenarios();
  const createScenario = useCreateScenario();
  const calculateScenario = useCalculateScenario();
  const setAsBaseline = useSetScenarioAsBaseline();
  const deleteScenario = useDeleteScenario();
  const compareScenarios = useCompareScenarios();

  const scenarios = scenariosPage?.content || [];

  const texts = {
    title: isArabic ? "تخطيط السيناريوهات" : "Scenario Planning",
    subtitle: isArabic
      ? "محاكاة سيناريوهات ماذا لو"
      : "What-if scenario simulations",
    createScenario: isArabic ? "إنشاء سيناريو" : "Create Scenario",
    name: isArabic ? "الاسم" : "Name",
    nameAr: isArabic ? "الاسم بالعربية" : "Arabic Name",
    description: isArabic ? "الوصف" : "Description",
    adjustments: isArabic ? "التعديلات" : "Adjustments",
    membershipGrowth: isArabic ? "نمو العضوية %" : "Membership Growth %",
    priceChange: isArabic ? "تغيير السعر %" : "Price Change %",
    churnReduction: isArabic ? "تقليل الإلغاء %" : "Churn Reduction %",
    save: isArabic ? "حفظ" : "Save",
    cancel: isArabic ? "إلغاء" : "Cancel",
    calculate: isArabic ? "حساب" : "Calculate",
    setBaseline: isArabic ? "تعيين كأساس" : "Set as Baseline",
    baseline: isArabic ? "الأساس" : "Baseline",
    compare: isArabic ? "مقارنة" : "Compare",
    delete: isArabic ? "حذف" : "Delete",
    noScenarios: isArabic ? "لا توجد سيناريوهات" : "No scenarios",
    createFirst: isArabic
      ? "أنشئ سيناريوك الأول"
      : "Create your first scenario",
    projectedRevenue: isArabic ? "الإيرادات المتوقعة" : "Projected Revenue",
    changeFromBaseline: isArabic
      ? "التغيير من الأساس"
      : "Change from Baseline",
  };

  const handleCreateScenario = async () => {
    if (!newScenario.name) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "الرجاء إدخال الاسم" : "Please enter a name",
        variant: "destructive",
      });
      return;
    }

    try {
      const adjustments: ScenarioAdjustments = {
        membershipGrowthRate: newScenario.membershipGrowthRate / 100,
        priceChangePercent: newScenario.priceChangePercent,
        churnReductionPercent: newScenario.churnReductionPercent,
      };

      await createScenario.mutateAsync({
        name: newScenario.name,
        nameAr: newScenario.nameAr || undefined,
        description: newScenario.description || undefined,
        adjustments,
      });

      toast({
        title: isArabic ? "تم الإنشاء" : "Created",
        description: isArabic
          ? "تم إنشاء السيناريو"
          : "Scenario created successfully",
      });

      setIsCreateOpen(false);
      setNewScenario({
        name: "",
        nameAr: "",
        description: "",
        membershipGrowthRate: 0,
        priceChangePercent: 0,
        churnReductionPercent: 0,
      });
      refetch();
    } catch {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic
          ? "فشل في إنشاء السيناريو"
          : "Failed to create scenario",
        variant: "destructive",
      });
    }
  };

  const handleCalculate = async (id: string) => {
    try {
      await calculateScenario.mutateAsync({ id, forecastMonths: 12 });
      toast({
        title: isArabic ? "تم الحساب" : "Calculated",
        description: isArabic
          ? "تم حساب التوقعات"
          : "Forecasts calculated successfully",
      });
      refetch();
    } catch {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "فشل في الحساب" : "Failed to calculate",
        variant: "destructive",
      });
    }
  };

  const handleSetBaseline = async (id: string) => {
    try {
      await setAsBaseline.mutateAsync(id);
      toast({
        title: isArabic ? "تم التعيين" : "Set",
        description: isArabic
          ? "تم تعيين السيناريو كأساس"
          : "Scenario set as baseline",
      });
      refetch();
    } catch {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "فشل في التعيين" : "Failed to set baseline",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScenario.mutateAsync(id);
      toast({
        title: isArabic ? "تم الحذف" : "Deleted",
        description: isArabic
          ? "تم حذف السيناريو"
          : "Scenario deleted successfully",
      });
      refetch();
    } catch {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "فشل في الحذف" : "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const toggleScenarioSelection = (id: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const getScenarioResults = (scenario: ForecastScenario) => {
    if (!scenario.scenarioForecasts) return null;
    const results = scenario.scenarioForecasts;
    return {
      totalAdjusted: results.totalAdjusted,
      totalBaseline: results.totalBaseline,
      changePercent:
        results.totalBaseline > 0
          ? ((results.totalAdjusted - results.totalBaseline) /
              results.totalBaseline) *
            100
          : 0,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            {texts.title}
          </h1>
          <p className="text-neutral-500">{texts.subtitle}</p>
        </div>

        <div className="flex gap-2">
          {selectedScenarios.length >= 2 && (
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 me-2" />
              {texts.compare}
            </Button>
          )}

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                {texts.createScenario}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{texts.createScenario}</DialogTitle>
                <DialogDescription>
                  {isArabic
                    ? "أنشئ سيناريو جديد مع التعديلات"
                    : "Create a new scenario with adjustments"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>{texts.name}</Label>
                  <Input
                    value={newScenario.name}
                    onChange={(e) =>
                      setNewScenario({ ...newScenario, name: e.target.value })
                    }
                    placeholder={
                      isArabic
                        ? "مثال: السيناريو المتفائل"
                        : "e.g., Optimistic Scenario"
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label>{texts.nameAr}</Label>
                  <Input
                    value={newScenario.nameAr}
                    onChange={(e) =>
                      setNewScenario({ ...newScenario, nameAr: e.target.value })
                    }
                    placeholder="الاسم بالعربية"
                    dir="rtl"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>{texts.description}</Label>
                  <Textarea
                    value={newScenario.description}
                    onChange={(e) =>
                      setNewScenario({
                        ...newScenario,
                        description: e.target.value,
                      })
                    }
                    placeholder={
                      isArabic ? "وصف السيناريو..." : "Scenario description..."
                    }
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">{texts.adjustments}</h4>

                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <Label>{texts.membershipGrowth}</Label>
                      <span className="text-sm font-medium">
                        {newScenario.membershipGrowthRate}%
                      </span>
                    </div>
                    <Slider
                      value={[newScenario.membershipGrowthRate]}
                      onValueChange={([v]) =>
                        setNewScenario({
                          ...newScenario,
                          membershipGrowthRate: v,
                        })
                      }
                      min={-20}
                      max={50}
                      step={1}
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <Label>{texts.priceChange}</Label>
                      <span className="text-sm font-medium">
                        {newScenario.priceChangePercent}%
                      </span>
                    </div>
                    <Slider
                      value={[newScenario.priceChangePercent]}
                      onValueChange={([v]) =>
                        setNewScenario({
                          ...newScenario,
                          priceChangePercent: v,
                        })
                      }
                      min={-20}
                      max={30}
                      step={1}
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <Label>{texts.churnReduction}</Label>
                      <span className="text-sm font-medium">
                        {newScenario.churnReductionPercent}%
                      </span>
                    </div>
                    <Slider
                      value={[newScenario.churnReductionPercent]}
                      onValueChange={([v]) =>
                        setNewScenario({
                          ...newScenario,
                          churnReductionPercent: v,
                        })
                      }
                      min={0}
                      max={20}
                      step={0.5}
                    />
                  </div>
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
                  onClick={handleCreateScenario}
                  disabled={createScenario.isPending}
                >
                  {texts.save}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Scenarios Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : scenarios.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => {
            const results = getScenarioResults(scenario);
            const isSelected = selectedScenarios.includes(scenario.id);

            return (
              <Card
                key={scenario.id}
                className={`relative cursor-pointer transition-all ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => toggleScenarioSelection(scenario.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {isArabic && scenario.nameAr
                          ? scenario.nameAr
                          : scenario.name}
                        {scenario.isBaseline && (
                          <Badge className="bg-warning text-white">
                            <Star className="h-3 w-3 me-1" />
                            {texts.baseline}
                          </Badge>
                        )}
                      </CardTitle>
                      {scenario.description && (
                        <CardDescription className="mt-1">
                          {scenario.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Adjustments Summary */}
                  {scenario.adjustments && (
                    <div className="text-sm space-y-1">
                      {scenario.adjustments.membershipGrowthRate && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">
                            {texts.membershipGrowth}:
                          </span>
                          <span>
                            {(
                              scenario.adjustments.membershipGrowthRate * 100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      )}
                      {scenario.adjustments.priceChangePercent && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">
                            {texts.priceChange}:
                          </span>
                          <span>
                            {scenario.adjustments.priceChangePercent}%
                          </span>
                        </div>
                      )}
                      {scenario.adjustments.churnReductionPercent && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">
                            {texts.churnReduction}:
                          </span>
                          <span>
                            {scenario.adjustments.churnReductionPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Results */}
                  {results ? (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-500">
                          {texts.projectedRevenue}
                        </span>
                        <span className="font-bold">
                          {formatCurrency(results.totalAdjusted, "SAR", locale)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-neutral-500">
                          {texts.changeFromBaseline}
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            results.changePercent >= 0
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          {results.changePercent >= 0 ? "+" : ""}
                          {results.changePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t text-center">
                      <p className="text-sm text-neutral-400 mb-2">
                        {isArabic ? "لم يتم الحساب بعد" : "Not calculated yet"}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCalculate(scenario.id);
                      }}
                      disabled={calculateScenario.isPending}
                    >
                      <Play className="h-3 w-3 me-1" />
                      {texts.calculate}
                    </Button>
                    {!scenario.isBaseline && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetBaseline(scenario.id);
                        }}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(scenario.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Calculator className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {texts.noScenarios}
            </h3>
            <p className="text-neutral-500 mb-4">{texts.createFirst}</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 me-2" />
              {texts.createScenario}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
