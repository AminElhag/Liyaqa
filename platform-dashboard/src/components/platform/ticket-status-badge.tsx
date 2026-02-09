import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketStatus } from '@/types';

/**
 * Status configuration for support tickets.
 * Colors: OPEN (blue), IN_PROGRESS (amber), WAITING_ON_CLIENT (purple), RESOLVED (green), CLOSED (gray)
 */
// eslint-disable-next-line react-refresh/only-export-components
export const TICKET_STATUS_CONFIG: Record<
  TicketStatus,
  {
    labelEn: string;
    labelAr: string;
    className: string;
  }
> = {
  OPEN: {
    labelEn: "Open",
    labelAr: "مفتوحة",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  IN_PROGRESS: {
    labelEn: "In Progress",
    labelAr: "قيد التنفيذ",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  WAITING_ON_CLIENT: {
    labelEn: "Waiting on Client",
    labelAr: "بانتظار العميل",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  RESOLVED: {
    labelEn: "Resolved",
    labelAr: "تم الحل",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  CLOSED: {
    labelEn: "Closed",
    labelAr: "مغلقة",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

/**
 * Badge component displaying support ticket status with bilingual labels.
 */
export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const { i18n } = useTranslation();
  const config = TICKET_STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {i18n.language === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
