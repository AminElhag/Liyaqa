import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";
import type { OrganizationStatus } from '@/types';

interface ClientStatusBadgeProps {
  status: OrganizationStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  OrganizationStatus,
  {
    labelEn: string;
    labelAr: string;
    className: string;
  }
> = {
  PENDING: {
    labelEn: "Pending",
    labelAr: "قيد الانتظار",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  ACTIVE: {
    labelEn: "Active",
    labelAr: "نشط",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  SUSPENDED: {
    labelEn: "Suspended",
    labelAr: "موقوف",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  CLOSED: {
    labelEn: "Closed",
    labelAr: "مغلق",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export function ClientStatusBadge({ status, className }: ClientStatusBadgeProps) {
  const { i18n } = useTranslation();
  const config = STATUS_CONFIG[status];

  return (
    <Badge className={config.className || className}>
      {i18n.language === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}

export { STATUS_CONFIG as CLIENT_STATUS_CONFIG };
