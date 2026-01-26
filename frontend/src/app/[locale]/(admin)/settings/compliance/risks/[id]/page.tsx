"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { RiskMatrix } from "@/components/compliance/risk-matrix";
import { getRiskColumns } from "@/components/admin/risk-columns";
import {
  useRiskAssessment,
  useAssessmentRisks,
  useRiskStats,
  useAddRisk,
  useStartTreatment,
  useCompleteTreatment,
} from "@/queries/use-risks";
import type {
  RiskCategory,
  RiskLikelihood,
  RiskImpact,
  RiskTreatment,
  IdentifiedRisk,
} from "@/types/risk";
import { formatDate } from "@/lib/utils";

export default function RiskAssessmentDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const assessmentId = params.id as string;
  const isArabic = locale === "ar";

  const [addRiskDialogOpen, setAddRiskDialogOpen] = useState(false);
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<IdentifiedRisk | null>(null);
  const [riskForm, setRiskForm] = useState({
    riskNumber: "",
    title: "",
    description: "",
    category: "SECURITY" as RiskCategory,
    assetAffected: "",
    threatSource: "",
    vulnerability: "",
    likelihood: "POSSIBLE" as RiskLikelihood,
    impact: "MODERATE" as RiskImpact,
    existingControls: "",
    treatmentOption: "MITIGATE" as RiskTreatment,
    treatmentPlan: "",
    treatmentDueDate: "",
  });
  const [treatmentForm, setTreatmentForm] = useState({
    residualLikelihood: "" as RiskLikelihood | "",
    residualImpact: "" as RiskImpact | "",
  });

  const { data: assessment, isLoading: loadingAssessment } = useRiskAssessment(assessmentId);
  const { data: risks, isLoading: loadingRisks } = useAssessmentRisks(assessmentId);
  const { data: stats } = useRiskStats(assessmentId);

  const addRisk = useAddRisk();
  const startTreatment = useStartTreatment();
  const completeTreatment = useCompleteTreatment();

  const handleAddRisk = () => {
    addRisk.mutate(
      {
        assessmentId,
        request: {
          riskNumber: riskForm.riskNumber,
          title: riskForm.title,
          description: riskForm.description || undefined,
          category: riskForm.category,
          assetAffected: riskForm.assetAffected || undefined,
          threatSource: riskForm.threatSource || undefined,
          vulnerability: riskForm.vulnerability || undefined,
          likelihood: riskForm.likelihood,
          impact: riskForm.impact,
          existingControls: riskForm.existingControls || undefined,
          treatmentOption: riskForm.treatmentOption,
          treatmentPlan: riskForm.treatmentPlan || undefined,
          treatmentDueDate: riskForm.treatmentDueDate || undefined,
        },
      },
      {
        onSuccess: () => {
          setAddRiskDialogOpen(false);
          setRiskForm({
            riskNumber: "",
            title: "",
            description: "",
            category: "SECURITY",
            assetAffected: "",
            threatSource: "",
            vulnerability: "",
            likelihood: "POSSIBLE",
            impact: "MODERATE",
            existingControls: "",
            treatmentOption: "MITIGATE",
            treatmentPlan: "",
            treatmentDueDate: "",
          });
        },
      }
    );
  };

  const handleStartTreatment = (risk: IdentifiedRisk) => {
    startTreatment.mutate(risk.id);
  };

  const handleCompleteTreatment = (risk: IdentifiedRisk) => {
    setSelectedRisk(risk);
    setTreatmentDialogOpen(true);
  };

  const submitCompleteTreatment = () => {
    if (!selectedRisk) return;
    completeTreatment.mutate(
      {
        id: selectedRisk.id,
        request: {
          residualLikelihood: treatmentForm.residualLikelihood || undefined,
          residualImpact: treatmentForm.residualImpact || undefined,
        },
      },
      {
        onSuccess: () => {
          setTreatmentDialogOpen(false);
          setSelectedRisk(null);
          setTreatmentForm({ residualLikelihood: "", residualImpact: "" });
        },
      }
    );
  };

  const columns = getRiskColumns({
    locale,
    onStartTreatment: handleStartTreatment,
    onCompleteTreatment: handleCompleteTreatment,
  });

  const statusLabels: Record<string, { en: string; ar: string }> = {
    DRAFT: { en: "Draft", ar: "مسودة" },
    IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ" },
    COMPLETED: { en: "Completed", ar: "مكتمل" },
    APPROVED: { en: "Approved", ar: "معتمد" },
    ARCHIVED: { en: "Archived", ar: "مؤرشف" },
  };

  if (loadingAssessment) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isArabic ? "التقييم غير موجود" : "Assessment not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{assessment.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {isArabic
                ? statusLabels[assessment.status].ar
                : statusLabels[assessment.status].en}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {isArabic ? "تاريخ التقييم:" : "Assessment Date:"}{" "}
              {formatDate(assessment.assessmentDate, locale)}
            </span>
          </div>
          {assessment.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {assessment.description}
            </p>
          )}
        </div>
        <Dialog open={addRiskDialogOpen} onOpenChange={setAddRiskDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? "إضافة خطر" : "Add Risk"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isArabic ? "إضافة خطر جديد" : "Add New Risk"}</DialogTitle>
              <DialogDescription>
                {isArabic
                  ? "تحديد خطر جديد في هذا التقييم"
                  : "Identify a new risk in this assessment"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? "رقم الخطر" : "Risk Number"}</Label>
                  <Input
                    value={riskForm.riskNumber}
                    onChange={(e) => setRiskForm({ ...riskForm, riskNumber: e.target.value })}
                    placeholder="R-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "الفئة" : "Category"}</Label>
                  <Select
                    value={riskForm.category}
                    onValueChange={(v) => setRiskForm({ ...riskForm, category: v as RiskCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SECURITY">{isArabic ? "أمني" : "Security"}</SelectItem>
                      <SelectItem value="PRIVACY">{isArabic ? "خصوصية" : "Privacy"}</SelectItem>
                      <SelectItem value="COMPLIANCE">{isArabic ? "امتثال" : "Compliance"}</SelectItem>
                      <SelectItem value="OPERATIONAL">{isArabic ? "تشغيلي" : "Operational"}</SelectItem>
                      <SelectItem value="TECHNOLOGY">{isArabic ? "تقني" : "Technology"}</SelectItem>
                      <SelectItem value="FINANCIAL">{isArabic ? "مالي" : "Financial"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "العنوان" : "Title"}</Label>
                <Input
                  value={riskForm.title}
                  onChange={(e) => setRiskForm({ ...riskForm, title: e.target.value })}
                  placeholder={isArabic ? "عنوان الخطر" : "Risk title"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الوصف" : "Description"}</Label>
                <Textarea
                  value={riskForm.description}
                  onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })}
                  placeholder={isArabic ? "وصف الخطر" : "Risk description"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? "الاحتمالية" : "Likelihood"}</Label>
                  <Select
                    value={riskForm.likelihood}
                    onValueChange={(v) => setRiskForm({ ...riskForm, likelihood: v as RiskLikelihood })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RARE">{isArabic ? "نادر" : "Rare"}</SelectItem>
                      <SelectItem value="UNLIKELY">{isArabic ? "غير محتمل" : "Unlikely"}</SelectItem>
                      <SelectItem value="POSSIBLE">{isArabic ? "محتمل" : "Possible"}</SelectItem>
                      <SelectItem value="LIKELY">{isArabic ? "مرجح" : "Likely"}</SelectItem>
                      <SelectItem value="ALMOST_CERTAIN">{isArabic ? "شبه مؤكد" : "Almost Certain"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "الأثر" : "Impact"}</Label>
                  <Select
                    value={riskForm.impact}
                    onValueChange={(v) => setRiskForm({ ...riskForm, impact: v as RiskImpact })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSIGNIFICANT">{isArabic ? "ضئيل" : "Insignificant"}</SelectItem>
                      <SelectItem value="MINOR">{isArabic ? "طفيف" : "Minor"}</SelectItem>
                      <SelectItem value="MODERATE">{isArabic ? "معتدل" : "Moderate"}</SelectItem>
                      <SelectItem value="MAJOR">{isArabic ? "كبير" : "Major"}</SelectItem>
                      <SelectItem value="CATASTROPHIC">{isArabic ? "كارثي" : "Catastrophic"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "خيار المعالجة" : "Treatment Option"}</Label>
                <Select
                  value={riskForm.treatmentOption}
                  onValueChange={(v) => setRiskForm({ ...riskForm, treatmentOption: v as RiskTreatment })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MITIGATE">{isArabic ? "تخفيف" : "Mitigate"}</SelectItem>
                    <SelectItem value="ACCEPT">{isArabic ? "قبول" : "Accept"}</SelectItem>
                    <SelectItem value="TRANSFER">{isArabic ? "نقل" : "Transfer"}</SelectItem>
                    <SelectItem value="AVOID">{isArabic ? "تجنب" : "Avoid"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "خطة المعالجة" : "Treatment Plan"}</Label>
                <Textarea
                  value={riskForm.treatmentPlan}
                  onChange={(e) => setRiskForm({ ...riskForm, treatmentPlan: e.target.value })}
                  placeholder={isArabic ? "خطة معالجة الخطر" : "Risk treatment plan"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "تاريخ الاستحقاق" : "Due Date"}</Label>
                <Input
                  type="date"
                  value={riskForm.treatmentDueDate}
                  onChange={(e) => setRiskForm({ ...riskForm, treatmentDueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddRiskDialogOpen(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleAddRisk}
                disabled={!riskForm.riskNumber || !riskForm.title || addRisk.isPending}
              >
                {isArabic ? "إضافة" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "إجمالي المخاطر" : "Total Risks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalRisks ?? assessment.totalRisks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "مخاطر حرجة/عالية" : "Critical/High Risks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats?.highRisks ?? assessment.highRisks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "مخاطر متوسطة" : "Medium Risks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats?.mediumRisks ?? assessment.mediumRisks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "معالجات متأخرة" : "Overdue Treatments"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{stats?.overdueTreatments ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="risks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="risks">{isArabic ? "المخاطر" : "Risks"}</TabsTrigger>
          <TabsTrigger value="matrix">{isArabic ? "مصفوفة المخاطر" : "Risk Matrix"}</TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? "المخاطر المحددة" : "Identified Risks"}</CardTitle>
              <CardDescription>
                {isArabic
                  ? "جميع المخاطر المحددة في هذا التقييم"
                  : "All risks identified in this assessment"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRisks ? (
                <Skeleton className="h-64" />
              ) : (
                <DataTable
                  columns={columns}
                  data={risks ?? []}
                  searchKey="title"
                  searchPlaceholder={isArabic ? "البحث عن المخاطر..." : "Search risks..."}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? "مصفوفة المخاطر" : "Risk Matrix"}</CardTitle>
              <CardDescription>
                {isArabic
                  ? "التوزيع البصري للمخاطر حسب الاحتمالية والأثر"
                  : "Visual distribution of risks by likelihood and impact"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RiskMatrix risks={risks ?? []} isArabic={isArabic} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complete Treatment Dialog */}
      <Dialog open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? "إكمال المعالجة" : "Complete Treatment"}</DialogTitle>
            <DialogDescription>
              {isArabic
                ? "أدخل مستوى المخاطر المتبقي بعد المعالجة"
                : "Enter the residual risk level after treatment"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isArabic ? "الاحتمالية المتبقية" : "Residual Likelihood"}</Label>
              <Select
                value={treatmentForm.residualLikelihood}
                onValueChange={(v) =>
                  setTreatmentForm({ ...treatmentForm, residualLikelihood: v as RiskLikelihood })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={isArabic ? "اختر" : "Select"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RARE">{isArabic ? "نادر" : "Rare"}</SelectItem>
                  <SelectItem value="UNLIKELY">{isArabic ? "غير محتمل" : "Unlikely"}</SelectItem>
                  <SelectItem value="POSSIBLE">{isArabic ? "محتمل" : "Possible"}</SelectItem>
                  <SelectItem value="LIKELY">{isArabic ? "مرجح" : "Likely"}</SelectItem>
                  <SelectItem value="ALMOST_CERTAIN">{isArabic ? "شبه مؤكد" : "Almost Certain"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isArabic ? "الأثر المتبقي" : "Residual Impact"}</Label>
              <Select
                value={treatmentForm.residualImpact}
                onValueChange={(v) =>
                  setTreatmentForm({ ...treatmentForm, residualImpact: v as RiskImpact })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={isArabic ? "اختر" : "Select"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSIGNIFICANT">{isArabic ? "ضئيل" : "Insignificant"}</SelectItem>
                  <SelectItem value="MINOR">{isArabic ? "طفيف" : "Minor"}</SelectItem>
                  <SelectItem value="MODERATE">{isArabic ? "معتدل" : "Moderate"}</SelectItem>
                  <SelectItem value="MAJOR">{isArabic ? "كبير" : "Major"}</SelectItem>
                  <SelectItem value="CATASTROPHIC">{isArabic ? "كارثي" : "Catastrophic"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTreatmentDialogOpen(false)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={submitCompleteTreatment} disabled={completeTreatment.isPending}>
              {isArabic ? "إكمال" : "Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
