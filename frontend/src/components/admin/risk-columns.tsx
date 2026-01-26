"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { MoreHorizontal, Play, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  IdentifiedRisk,
  RiskLevel,
  RiskCategory,
  TreatmentStatus,
  RiskAssessment,
  RiskAssessmentStatus,
} from "@/types/risk";

interface GetRiskColumnsOptions {
  locale: string;
  onStartTreatment?: (risk: IdentifiedRisk) => void;
  onCompleteTreatment?: (risk: IdentifiedRisk) => void;
  onView?: (risk: IdentifiedRisk) => void;
}

interface GetAssessmentColumnsOptions {
  locale: string;
  onView?: (assessment: RiskAssessment) => void;
  onStart?: (assessment: RiskAssessment) => void;
  onComplete?: (assessment: RiskAssessment) => void;
}

const riskLevelColors: Record<RiskLevel, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

const riskLevelLabels: Record<RiskLevel, { en: string; ar: string }> = {
  LOW: { en: "Low", ar: "منخفض" },
  MEDIUM: { en: "Medium", ar: "متوسط" },
  HIGH: { en: "High", ar: "عالي" },
  CRITICAL: { en: "Critical", ar: "حرج" },
};

const categoryLabels: Record<RiskCategory, { en: string; ar: string }> = {
  STRATEGIC: { en: "Strategic", ar: "استراتيجي" },
  OPERATIONAL: { en: "Operational", ar: "تشغيلي" },
  FINANCIAL: { en: "Financial", ar: "مالي" },
  COMPLIANCE: { en: "Compliance", ar: "امتثال" },
  TECHNOLOGY: { en: "Technology", ar: "تقني" },
  SECURITY: { en: "Security", ar: "أمني" },
  PRIVACY: { en: "Privacy", ar: "خصوصية" },
  REPUTATIONAL: { en: "Reputational", ar: "سمعة" },
  PHYSICAL: { en: "Physical", ar: "مادي" },
  ENVIRONMENTAL: { en: "Environmental", ar: "بيئي" },
};

const treatmentStatusLabels: Record<TreatmentStatus, { en: string; ar: string }> = {
  NOT_STARTED: { en: "Not Started", ar: "لم يبدأ" },
  IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ" },
  COMPLETED: { en: "Completed", ar: "مكتمل" },
  OVERDUE: { en: "Overdue", ar: "متأخر" },
};

const treatmentStatusColors: Record<TreatmentStatus, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
};

const assessmentStatusLabels: Record<RiskAssessmentStatus, { en: string; ar: string }> = {
  DRAFT: { en: "Draft", ar: "مسودة" },
  IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ" },
  COMPLETED: { en: "Completed", ar: "مكتمل" },
  APPROVED: { en: "Approved", ar: "معتمد" },
  ARCHIVED: { en: "Archived", ar: "مؤرشف" },
};

const assessmentStatusColors: Record<RiskAssessmentStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export function getRiskColumns({
  locale,
  onStartTreatment,
  onCompleteTreatment,
  onView,
}: GetRiskColumnsOptions): ColumnDef<IdentifiedRisk>[] {
  const isArabic = locale === "ar";

  return [
    {
      accessorKey: "riskNumber",
      header: isArabic ? "الرقم" : "Risk #",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.riskNumber}</span>
      ),
    },
    {
      accessorKey: "title",
      header: isArabic ? "العنوان" : "Title",
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="font-medium truncate">{row.original.title}</p>
          {row.original.category && (
            <Badge variant="outline" className="text-xs mt-1">
              {isArabic
                ? categoryLabels[row.original.category].ar
                : categoryLabels[row.original.category].en
              }
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "inherentRiskLevel",
      header: isArabic ? "مستوى المخاطر" : "Risk Level",
      cell: ({ row }) => {
        const level = row.original.inherentRiskLevel;
        const label = riskLevelLabels[level];
        return (
          <Badge className={riskLevelColors[level]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "inherentRiskScore",
      header: isArabic ? "النتيجة" : "Score",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.inherentRiskScore}</span>
      ),
    },
    {
      accessorKey: "treatmentStatus",
      header: isArabic ? "حالة المعالجة" : "Treatment Status",
      cell: ({ row }) => {
        const status = row.original.treatmentStatus;
        const label = treatmentStatusLabels[status];
        return (
          <Badge className={treatmentStatusColors[status]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "treatmentDueDate",
      header: isArabic ? "تاريخ الاستحقاق" : "Due Date",
      cell: ({ row }) => {
        if (!row.original.treatmentDueDate) return "-";
        return formatDate(row.original.treatmentDueDate, locale);
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const risk = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(risk)}>
                {isArabic ? "عرض التفاصيل" : "View Details"}
              </DropdownMenuItem>
              {risk.treatmentStatus === "NOT_STARTED" && (
                <DropdownMenuItem onClick={() => onStartTreatment?.(risk)}>
                  <Play className="h-4 w-4 mr-2" />
                  {isArabic ? "بدء المعالجة" : "Start Treatment"}
                </DropdownMenuItem>
              )}
              {risk.treatmentStatus === "IN_PROGRESS" && (
                <DropdownMenuItem onClick={() => onCompleteTreatment?.(risk)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isArabic ? "إكمال المعالجة" : "Complete Treatment"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

export function getAssessmentColumns({
  locale,
  onView,
  onStart,
  onComplete,
}: GetAssessmentColumnsOptions): ColumnDef<RiskAssessment>[] {
  const isArabic = locale === "ar";

  return [
    {
      accessorKey: "title",
      header: isArabic ? "العنوان" : "Title",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.scope && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {row.original.scope}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "assessmentDate",
      header: isArabic ? "تاريخ التقييم" : "Assessment Date",
      cell: ({ row }) => formatDate(row.original.assessmentDate, locale),
    },
    {
      accessorKey: "status",
      header: isArabic ? "الحالة" : "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const label = assessmentStatusLabels[status];
        return (
          <Badge className={assessmentStatusColors[status]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "highRisks",
      header: isArabic ? "عالي" : "High",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-red-600">
          {row.original.highRisks}
        </Badge>
      ),
    },
    {
      accessorKey: "mediumRisks",
      header: isArabic ? "متوسط" : "Medium",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-yellow-600">
          {row.original.mediumRisks}
        </Badge>
      ),
    },
    {
      accessorKey: "lowRisks",
      header: isArabic ? "منخفض" : "Low",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-green-600">
          {row.original.lowRisks}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const assessment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(assessment)}>
                {isArabic ? "عرض التفاصيل" : "View Details"}
              </DropdownMenuItem>
              {assessment.status === "DRAFT" && (
                <DropdownMenuItem onClick={() => onStart?.(assessment)}>
                  <Play className="h-4 w-4 mr-2" />
                  {isArabic ? "بدء التقييم" : "Start Assessment"}
                </DropdownMenuItem>
              )}
              {assessment.status === "IN_PROGRESS" && (
                <DropdownMenuItem onClick={() => onComplete?.(assessment)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isArabic ? "إكمال التقييم" : "Complete Assessment"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
