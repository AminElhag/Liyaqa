"use client";

import { Badge } from "@liyaqa/shared/components/ui/badge";
import type { SecuritySeverity } from "@liyaqa/shared/types/data-protection";

interface BreachSeverityBadgeProps {
  severity: SecuritySeverity;
  isArabic?: boolean;
}

const severityLabels: Record<SecuritySeverity, { en: string; ar: string }> = {
  LOW: { en: "Low", ar: "منخفض" },
  MEDIUM: { en: "Medium", ar: "متوسط" },
  HIGH: { en: "High", ar: "عالي" },
  CRITICAL: { en: "Critical", ar: "حرج" },
};

const severityColors: Record<SecuritySeverity, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export function BreachSeverityBadge({
  severity,
  isArabic = false,
}: BreachSeverityBadgeProps) {
  const label = severityLabels[severity];

  return (
    <Badge className={severityColors[severity]}>
      {isArabic ? label.ar : label.en}
    </Badge>
  );
}
