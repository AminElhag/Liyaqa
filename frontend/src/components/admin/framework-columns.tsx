"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ComplianceFramework, OrganizationComplianceStatus } from "@/types/compliance";

interface GetFrameworkColumnsOptions {
  locale: string;
  statuses?: OrganizationComplianceStatus[];
}

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLIANT: "bg-green-100 text-green-800",
  NON_COMPLIANT: "bg-red-100 text-red-800",
  PARTIALLY_COMPLIANT: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<string, { en: string; ar: string }> = {
  NOT_STARTED: { en: "Not Started", ar: "لم يبدأ" },
  IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ" },
  COMPLIANT: { en: "Compliant", ar: "ممتثل" },
  NON_COMPLIANT: { en: "Non-Compliant", ar: "غير ممتثل" },
  PARTIALLY_COMPLIANT: { en: "Partially Compliant", ar: "ممتثل جزئياً" },
};

export function getFrameworkColumns({
  locale,
  statuses = [],
}: GetFrameworkColumnsOptions): ColumnDef<ComplianceFramework>[] {
  const isArabic = locale === "ar";

  const getStatus = (frameworkId: string) => {
    return statuses.find((s) => s.frameworkId === frameworkId);
  };

  return [
    {
      accessorKey: "code",
      header: isArabic ? "الرمز" : "Code",
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "name",
      header: isArabic ? "الإطار" : "Framework",
      cell: ({ row }) => {
        const framework = row.original;
        return (
          <div>
            <p className="font-medium">
              {isArabic && framework.nameAr ? framework.nameAr : framework.name}
            </p>
            {framework.version && (
              <p className="text-xs text-muted-foreground">v{framework.version}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: isArabic ? "الحالة" : "Status",
      cell: ({ row }) => {
        const status = getStatus(row.original.id);
        if (!status) {
          return (
            <Badge className={statusColors.NOT_STARTED}>
              {isArabic ? statusLabels.NOT_STARTED.ar : statusLabels.NOT_STARTED.en}
            </Badge>
          );
        }
        const label = statusLabels[status.status];
        return (
          <Badge className={statusColors[status.status]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "score",
      header: isArabic ? "النتيجة" : "Score",
      cell: ({ row }) => {
        const status = getStatus(row.original.id);
        const score = status?.complianceScore ?? 0;
        return (
          <div className="w-24">
            <div className="flex items-center gap-2">
              <Progress value={score} className="h-2" />
              <span className="text-sm font-medium">{Math.round(score)}%</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "certificationRequired",
      header: isArabic ? "يتطلب شهادة" : "Certification Required",
      cell: ({ row }) => (
        <Badge variant={row.original.certificationRequired ? "default" : "outline"}>
          {row.original.certificationRequired
            ? (isArabic ? "نعم" : "Yes")
            : (isArabic ? "لا" : "No")
          }
        </Badge>
      ),
    },
  ];
}
