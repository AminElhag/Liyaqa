import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, type LeadStatus } from "@/types/lead";
import { useLocale } from "next-intl";

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const label = LEAD_STATUS_LABELS[status];
  const colorClass = LEAD_STATUS_COLORS[status];

  return (
    <Badge className={`${colorClass} ${className || ""}`}>
      {isArabic ? label.ar : label.en}
    </Badge>
  );
}
