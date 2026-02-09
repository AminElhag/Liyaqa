import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";
import type { PlatformUserStatus } from '@/types';

interface PlatformUserStatusBadgeProps {
  status: PlatformUserStatus;
}

const STATUS_CONFIG: Record<
  PlatformUserStatus,
  {
    labelEn: string;
    labelAr: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  ACTIVE: {
    labelEn: "Active",
    labelAr: "نشط",
    variant: "default",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  INACTIVE: {
    labelEn: "Inactive",
    labelAr: "غير نشط",
    variant: "secondary",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  SUSPENDED: {
    labelEn: "Suspended",
    labelAr: "موقوف",
    variant: "destructive",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
};

export function PlatformUserStatusBadge({
  status,
}: PlatformUserStatusBadgeProps) {
  const { i18n } = useTranslation();
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {i18n.language === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
