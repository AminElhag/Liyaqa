"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "next-intl";
import type { EarningStatus } from "@/types/trainer-portal";

interface EarningsStatusBadgeProps {
  status: EarningStatus;
}

const statusConfig: Record<
  EarningStatus,
  {
    variant: "success" | "warning" | "default" | "secondary";
    labelEn: string;
    labelAr: string;
  }
> = {
  PENDING: {
    variant: "warning",
    labelEn: "Pending",
    labelAr: "معلق",
  },
  APPROVED: {
    variant: "default",
    labelEn: "Approved",
    labelAr: "موافق عليه",
  },
  PAID: {
    variant: "success",
    labelEn: "Paid",
    labelAr: "مدفوع",
  },
  CANCELLED: {
    variant: "secondary",
    labelEn: "Cancelled",
    labelAr: "ملغي",
  },
};

export function EarningsStatusBadge({ status }: EarningsStatusBadgeProps) {
  const locale = useLocale();
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {locale === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
