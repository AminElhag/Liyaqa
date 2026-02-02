import { Badge } from "@/components/ui/badge";
import { LEAD_PRIORITY_LABELS, LEAD_PRIORITY_COLORS, type LeadPriority } from "@/types/lead";
import { useLocale } from "next-intl";

interface LeadPriorityBadgeProps {
  priority: LeadPriority;
  className?: string;
}

export function LeadPriorityBadge({ priority, className }: LeadPriorityBadgeProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const label = LEAD_PRIORITY_LABELS[priority];
  const colorClass = LEAD_PRIORITY_COLORS[priority];

  return (
    <Badge className={`${colorClass} ${className || ""}`}>
      {isArabic ? label.ar : label.en}
    </Badge>
  );
}
