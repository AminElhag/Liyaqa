"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "next-intl";
import type { TrainerClientStatus } from "@/types/trainer-portal";

interface ClientStatusBadgeProps {
  status: TrainerClientStatus;
}

const statusConfig: Record<
  TrainerClientStatus,
  {
    variant: "success" | "warning" | "default" | "secondary";
    labelEn: string;
    labelAr: string;
  }
> = {
  ACTIVE: {
    variant: "success",
    labelEn: "Active",
    labelAr: "نشط",
  },
  ON_HOLD: {
    variant: "warning",
    labelEn: "On Hold",
    labelAr: "معلق",
  },
  COMPLETED: {
    variant: "default",
    labelEn: "Completed",
    labelAr: "مكتمل",
  },
  INACTIVE: {
    variant: "secondary",
    labelEn: "Inactive",
    labelAr: "غير نشط",
  },
};

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  const locale = useLocale();
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {locale === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
