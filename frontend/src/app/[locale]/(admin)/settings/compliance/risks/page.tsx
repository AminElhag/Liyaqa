"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { getAssessmentColumns } from "@/components/admin/risk-columns";
import {
  useRiskAssessments,
  useCreateAssessment,
  useStartAssessment,
  useCompleteAssessment,
} from "@/queries/use-risks";
import type { RiskAssessment } from "@/types/risk";

export default function RiskAssessmentsPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scope: "",
    methodology: "",
    nextReviewDate: "",
  });

  const { data: assessments, isLoading } = useRiskAssessments({});
  const createAssessment = useCreateAssessment();
  const startAssessment = useStartAssessment();
  const completeAssessment = useCompleteAssessment();

  const handleCreate = () => {
    createAssessment.mutate(
      {
        title: formData.title,
        description: formData.description || undefined,
        scope: formData.scope || undefined,
        methodology: formData.methodology || undefined,
        nextReviewDate: formData.nextReviewDate || undefined,
      },
      {
        onSuccess: (assessment) => {
          setCreateDialogOpen(false);
          setFormData({
            title: "",
            description: "",
            scope: "",
            methodology: "",
            nextReviewDate: "",
          });
          router.push(`/settings/compliance/risks/${assessment.id}`);
        },
      }
    );
  };

  const handleView = (assessment: RiskAssessment) => {
    router.push(`/settings/compliance/risks/${assessment.id}`);
  };

  const handleStart = (assessment: RiskAssessment) => {
    startAssessment.mutate(assessment.id);
  };

  const handleComplete = (assessment: RiskAssessment) => {
    completeAssessment.mutate(assessment.id);
  };

  const columns = getAssessmentColumns({
    locale,
    onView: handleView,
    onStart: handleStart,
    onComplete: handleComplete,
  });

  // Stats
  const assessmentsList = assessments?.content ?? [];
  const totalAssessments = assessmentsList.length;
  const inProgressCount = assessmentsList.filter((a) => a.status === "IN_PROGRESS").length;
  const totalHighRisks = assessmentsList.reduce((sum, a) => sum + a.highRisks, 0);
  const totalMediumRisks = assessmentsList.reduce((sum, a) => sum + a.mediumRisks, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "تقييم المخاطر" : "Risk Assessments"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "تحديد وتقييم ومعالجة مخاطر أمن المعلومات"
              : "Identify, assess, and treat information security risks"}
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? "تقييم جديد" : "New Assessment"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isArabic ? "تقييم مخاطر جديد" : "New Risk Assessment"}</DialogTitle>
              <DialogDescription>
                {isArabic
                  ? "إنشاء تقييم مخاطر جديد لتحديد ومعالجة المخاطر"
                  : "Create a new risk assessment to identify and treat risks"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{isArabic ? "العنوان" : "Title"}</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={isArabic ? "عنوان التقييم" : "Assessment title"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الوصف" : "Description"}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={isArabic ? "وصف التقييم" : "Assessment description"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "النطاق" : "Scope"}</Label>
                <Textarea
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  placeholder={isArabic ? "نطاق التقييم" : "Assessment scope"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "المنهجية" : "Methodology"}</Label>
                <Input
                  value={formData.methodology}
                  onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                  placeholder={isArabic ? "مثل: ISO 27005" : "e.g., ISO 27005"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "تاريخ المراجعة التالية" : "Next Review Date"}</Label>
                <Input
                  type="date"
                  value={formData.nextReviewDate}
                  onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.title || createAssessment.isPending}
              >
                {isArabic ? "إنشاء" : "Create"}
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
              {isArabic ? "إجمالي التقييمات" : "Total Assessments"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAssessments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "قيد التنفيذ" : "In Progress"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "مخاطر عالية" : "High Risks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{totalHighRisks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "مخاطر متوسطة" : "Medium Risks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{totalMediumRisks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "قائمة التقييمات" : "Assessment List"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "جميع تقييمات المخاطر المسجلة"
              : "All recorded risk assessments"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <DataTable
              columns={columns}
              data={assessmentsList}
              searchKey="title"
              searchPlaceholder={isArabic ? "البحث عن التقييمات..." : "Search assessments..."}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
