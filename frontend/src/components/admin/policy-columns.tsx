"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { MoreHorizontal, Eye, Edit, Send, CheckCircle, Archive, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PolicyStatusBadge } from "@/components/compliance/policy-status-badge";
import type { SecurityPolicy, PolicyType, PolicyStatus } from "@/types/policy";

interface GetPolicyColumnsOptions {
  locale: string;
  onView?: (policy: SecurityPolicy) => void;
  onEdit?: (policy: SecurityPolicy) => void;
  onSubmitForReview?: (policy: SecurityPolicy) => void;
  onApprove?: (policy: SecurityPolicy) => void;
  onPublish?: (policy: SecurityPolicy) => void;
  onArchive?: (policy: SecurityPolicy) => void;
  onReturnToDraft?: (policy: SecurityPolicy) => void;
}

const policyTypeLabels: Record<PolicyType, { en: string; ar: string }> = {
  INFORMATION_SECURITY: { en: "Information Security", ar: "أمن المعلومات" },
  DATA_PROTECTION: { en: "Data Protection", ar: "حماية البيانات" },
  ACCESS_CONTROL: { en: "Access Control", ar: "التحكم في الوصول" },
  INCIDENT_RESPONSE: { en: "Incident Response", ar: "الاستجابة للحوادث" },
  BUSINESS_CONTINUITY: { en: "Business Continuity", ar: "استمرارية الأعمال" },
  ACCEPTABLE_USE: { en: "Acceptable Use", ar: "الاستخدام المقبول" },
  DATA_RETENTION: { en: "Data Retention", ar: "الاحتفاظ بالبيانات" },
  PRIVACY: { en: "Privacy", ar: "الخصوصية" },
  VENDOR_MANAGEMENT: { en: "Vendor Management", ar: "إدارة الموردين" },
  CHANGE_MANAGEMENT: { en: "Change Management", ar: "إدارة التغيير" },
  RISK_MANAGEMENT: { en: "Risk Management", ar: "إدارة المخاطر" },
  ASSET_MANAGEMENT: { en: "Asset Management", ar: "إدارة الأصول" },
  CRYPTOGRAPHY: { en: "Cryptography", ar: "التشفير" },
  PHYSICAL_SECURITY: { en: "Physical Security", ar: "الأمن المادي" },
  HR_SECURITY: { en: "HR Security", ar: "أمن الموارد البشرية" },
  NETWORK_SECURITY: { en: "Network Security", ar: "أمن الشبكات" },
  APPLICATION_SECURITY: { en: "Application Security", ar: "أمن التطبيقات" },
  MOBILE_DEVICE: { en: "Mobile Device", ar: "الأجهزة المحمولة" },
  REMOTE_WORK: { en: "Remote Work", ar: "العمل عن بعد" },
  SOCIAL_MEDIA: { en: "Social Media", ar: "وسائل التواصل الاجتماعي" },
};

export function getPolicyColumns({
  locale,
  onView,
  onEdit,
  onSubmitForReview,
  onApprove,
  onPublish,
  onArchive,
  onReturnToDraft,
}: GetPolicyColumnsOptions): ColumnDef<SecurityPolicy>[] {
  const isArabic = locale === "ar";

  return [
    {
      accessorKey: "title",
      header: isArabic ? "العنوان" : "Title",
      cell: ({ row }) => {
        const policy = row.original;
        return (
          <div>
            <p className="font-medium">
              {isArabic && policy.titleAr ? policy.titleAr : policy.title}
            </p>
            <Badge variant="outline" className="text-xs mt-1">
              {isArabic
                ? policyTypeLabels[policy.policyType].ar
                : policyTypeLabels[policy.policyType].en
              }
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "version",
      header: isArabic ? "الإصدار" : "Version",
      cell: ({ row }) => (
        <span className="font-mono text-sm">v{row.original.version}</span>
      ),
    },
    {
      accessorKey: "status",
      header: isArabic ? "الحالة" : "Status",
      cell: ({ row }) => (
        <PolicyStatusBadge status={row.original.status} isArabic={isArabic} />
      ),
    },
    {
      accessorKey: "effectiveDate",
      header: isArabic ? "تاريخ السريان" : "Effective Date",
      cell: ({ row }) => {
        if (!row.original.effectiveDate) return "-";
        return formatDate(row.original.effectiveDate, locale);
      },
    },
    {
      accessorKey: "nextReviewDate",
      header: isArabic ? "المراجعة التالية" : "Review Due",
      cell: ({ row }) => {
        const policy = row.original;
        if (!policy.nextReviewDate) return "-";
        return (
          <span className={policy.isReviewDue ? "text-red-600 font-medium" : ""}>
            {formatDate(policy.nextReviewDate, locale)}
            {policy.isReviewDue && (
              <span className="block text-xs">
                {isArabic ? "مستحق!" : "Due!"}
              </span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "acknowledgementRequired",
      header: isArabic ? "يتطلب إقرار" : "Ack. Required",
      cell: ({ row }) => (
        <Badge variant={row.original.acknowledgementRequired ? "default" : "outline"}>
          {row.original.acknowledgementRequired
            ? (isArabic ? "نعم" : "Yes")
            : (isArabic ? "لا" : "No")
          }
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const policy = row.original;
        const canEdit = policy.status === "DRAFT";
        const canSubmitForReview = policy.status === "DRAFT";
        const canApprove = policy.status === "UNDER_REVIEW";
        const canPublish = policy.status === "APPROVED";
        const canArchive = policy.status === "PUBLISHED";
        const canReturnToDraft = policy.status === "UNDER_REVIEW";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(policy)}>
                <Eye className="h-4 w-4 mr-2" />
                {isArabic ? "عرض" : "View"}
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit?.(policy)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {isArabic ? "تعديل" : "Edit"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canSubmitForReview && (
                <DropdownMenuItem onClick={() => onSubmitForReview?.(policy)}>
                  <Send className="h-4 w-4 mr-2" />
                  {isArabic ? "إرسال للمراجعة" : "Submit for Review"}
                </DropdownMenuItem>
              )}
              {canReturnToDraft && (
                <DropdownMenuItem onClick={() => onReturnToDraft?.(policy)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isArabic ? "إعادة للمسودة" : "Return to Draft"}
                </DropdownMenuItem>
              )}
              {canApprove && (
                <DropdownMenuItem onClick={() => onApprove?.(policy)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isArabic ? "اعتماد" : "Approve"}
                </DropdownMenuItem>
              )}
              {canPublish && (
                <DropdownMenuItem onClick={() => onPublish?.(policy)}>
                  <Send className="h-4 w-4 mr-2" />
                  {isArabic ? "نشر" : "Publish"}
                </DropdownMenuItem>
              )}
              {canArchive && (
                <DropdownMenuItem onClick={() => onArchive?.(policy)}>
                  <Archive className="h-4 w-4 mr-2" />
                  {isArabic ? "أرشفة" : "Archive"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
