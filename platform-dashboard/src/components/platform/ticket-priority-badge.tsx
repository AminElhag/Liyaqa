import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketPriority } from '@/types';

/**
 * Priority configuration for support tickets.
 * Colors: LOW (slate), MEDIUM (blue), HIGH (orange), URGENT (red)
 */
// eslint-disable-next-line react-refresh/only-export-components
export const TICKET_PRIORITY_CONFIG: Record<
  TicketPriority,
  {
    labelEn: string;
    labelAr: string;
    className: string;
  }
> = {
  LOW: {
    labelEn: "Low",
    labelAr: "منخفضة",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  MEDIUM: {
    labelEn: "Medium",
    labelAr: "متوسطة",
    className: "bg-blue-100 text-blue-600 border-blue-200",
  },
  HIGH: {
    labelEn: "High",
    labelAr: "عالية",
    className: "bg-orange-100 text-orange-600 border-orange-200",
  },
  URGENT: {
    labelEn: "Urgent",
    labelAr: "عاجلة",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

/**
 * Badge component displaying support ticket priority with bilingual labels.
 */
export function TicketPriorityBadge({ priority, className }: TicketPriorityBadgeProps) {
  const { i18n } = useTranslation();
  const config = TICKET_PRIORITY_CONFIG[priority];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {i18n.language === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
