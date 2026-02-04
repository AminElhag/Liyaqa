"use client";

import { Badge } from "@liyaqa/shared/components/ui/badge";
import type { PolicyStatus } from "@liyaqa/shared/types/policy";

interface PolicyStatusBadgeProps {
  status: PolicyStatus;
  isArabic?: boolean;
}

const statusLabels: Record<PolicyStatus, { en: string; ar: string }> = {
  DRAFT: { en: "Draft", ar: "مسودة" },
  UNDER_REVIEW: { en: "Under Review", ar: "قيد المراجعة" },
  APPROVED: { en: "Approved", ar: "معتمد" },
  PUBLISHED: { en: "Published", ar: "منشور" },
  ARCHIVED: { en: "Archived", ar: "مؤرشف" },
};

const statusColors: Record<PolicyStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export function PolicyStatusBadge({
  status,
  isArabic = false,
}: PolicyStatusBadgeProps) {
  const label = statusLabels[status];

  return (
    <Badge className={statusColors[status]}>
      {isArabic ? label.ar : label.en}
    </Badge>
  );
}
