"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "next-intl";
import type { CertificationStatus } from "@/types/trainer-portal";

interface CertificationStatusBadgeProps {
  status: CertificationStatus;
  isVerified?: boolean;
}

const statusConfig: Record<
  CertificationStatus,
  {
    variant: "success" | "warning" | "default" | "secondary" | "destructive";
    labelEn: string;
    labelAr: string;
  }
> = {
  ACTIVE: {
    variant: "success",
    labelEn: "Active",
    labelAr: "نشط",
  },
  EXPIRED: {
    variant: "destructive",
    labelEn: "Expired",
    labelAr: "منتهي",
  },
  PENDING_VERIFICATION: {
    variant: "warning",
    labelEn: "Pending Verification",
    labelAr: "قيد التحقق",
  },
};

export function CertificationStatusBadge({
  status,
  isVerified,
}: CertificationStatusBadgeProps) {
  const locale = useLocale();
  const config = statusConfig[status];

  const label = locale === "ar" ? config.labelAr : config.labelEn;
  const verifiedText = locale === "ar" ? " (موثق)" : " (Verified)";

  return (
    <Badge variant={config.variant}>
      {label}
      {status === "ACTIVE" && isVerified && (
        <span className="ml-1">{verifiedText}</span>
      )}
    </Badge>
  );
}
