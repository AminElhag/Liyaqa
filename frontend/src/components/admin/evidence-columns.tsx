"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Download, MoreHorizontal, CheckCircle, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ComplianceEvidence, EvidenceType } from "@/types/compliance";

interface GetEvidenceColumnsOptions {
  locale: string;
  onVerify?: (evidence: ComplianceEvidence) => void;
  onDelete?: (evidence: ComplianceEvidence) => void;
  onDownload?: (evidence: ComplianceEvidence) => void;
}

const evidenceTypeLabels: Record<EvidenceType, { en: string; ar: string }> = {
  DOCUMENT: { en: "Document", ar: "مستند" },
  SCREENSHOT: { en: "Screenshot", ar: "لقطة شاشة" },
  LOG: { en: "Log File", ar: "ملف سجل" },
  REPORT: { en: "Report", ar: "تقرير" },
  CERTIFICATE: { en: "Certificate", ar: "شهادة" },
  AUDIT_TRAIL: { en: "Audit Trail", ar: "مسار التدقيق" },
  CONFIGURATION: { en: "Configuration", ar: "تكوين" },
  OTHER: { en: "Other", ar: "أخرى" },
};

const evidenceTypeColors: Record<EvidenceType, string> = {
  DOCUMENT: "bg-blue-100 text-blue-800",
  SCREENSHOT: "bg-purple-100 text-purple-800",
  LOG: "bg-slate-100 text-slate-800",
  REPORT: "bg-green-100 text-green-800",
  CERTIFICATE: "bg-amber-100 text-amber-800",
  AUDIT_TRAIL: "bg-cyan-100 text-cyan-800",
  CONFIGURATION: "bg-indigo-100 text-indigo-800",
  OTHER: "bg-gray-100 text-gray-800",
};

export function getEvidenceColumns({
  locale,
  onVerify,
  onDelete,
  onDownload,
}: GetEvidenceColumnsOptions): ColumnDef<ComplianceEvidence>[] {
  const isArabic = locale === "ar";

  return [
    {
      accessorKey: "title",
      header: isArabic ? "العنوان" : "Title",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.description && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "requirementCode",
      header: isArabic ? "المتطلب" : "Control",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.requirementCode || "-"}</span>
      ),
    },
    {
      accessorKey: "evidenceType",
      header: isArabic ? "النوع" : "Type",
      cell: ({ row }) => {
        const type = row.original.evidenceType;
        const label = evidenceTypeLabels[type];
        return (
          <Badge className={evidenceTypeColors[type]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "expirationDate",
      header: isArabic ? "صالح حتى" : "Valid Until",
      cell: ({ row }) => {
        if (!row.original.expirationDate) {
          return <span className="text-muted-foreground">-</span>;
        }
        const isExpired = row.original.isExpired;
        return (
          <span className={isExpired ? "text-red-600" : ""}>
            {formatDate(row.original.expirationDate, locale)}
          </span>
        );
      },
    },
    {
      accessorKey: "verified",
      header: isArabic ? "الحالة" : "Status",
      cell: ({ row }) => {
        const isExpired = row.original.isExpired;
        if (isExpired) {
          return (
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              {isArabic ? "منتهي" : "Expired"}
            </Badge>
          );
        }
        if (row.original.verified) {
          return (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {isArabic ? "موثق" : "Verified"}
            </Badge>
          );
        }
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            {isArabic ? "في انتظار التحقق" : "Pending Verification"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const evidence = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {evidence.fileUrl && (
                <DropdownMenuItem onClick={() => onDownload?.(evidence)}>
                  <Download className="h-4 w-4 mr-2" />
                  {isArabic ? "تنزيل" : "Download"}
                </DropdownMenuItem>
              )}
              {!evidence.verified && (
                <DropdownMenuItem onClick={() => onVerify?.(evidence)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isArabic ? "التحقق" : "Verify"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete?.(evidence)}
                className="text-red-600"
              >
                {isArabic ? "حذف" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
