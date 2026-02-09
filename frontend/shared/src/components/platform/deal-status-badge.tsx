"use client";

import { useLocale } from "next-intl";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import type { DealStatus } from "@liyaqa/shared/types/platform";

interface DealStatusBadgeProps {
  status: DealStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  DealStatus,
  {
    labelEn: string;
    labelAr: string;
    variant: "default" | "secondary" | "success" | "warning" | "danger" | "info";
    className?: string;
  }
> = {
  LEAD: {
    labelEn: "Lead",
    labelAr: "عميل محتمل",
    variant: "secondary",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  CONTACTED: {
    labelEn: "Contacted",
    labelAr: "تم التواصل",
    variant: "info",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  DEMO_SCHEDULED: {
    labelEn: "Demo Scheduled",
    labelAr: "عرض مجدول",
    variant: "info",
    className: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  DEMO_DONE: {
    labelEn: "Demo Done",
    labelAr: "تم العرض",
    variant: "info",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
  PROPOSAL_SENT: {
    labelEn: "Proposal Sent",
    labelAr: "تم إرسال العرض",
    variant: "warning",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  NEGOTIATION: {
    labelEn: "Negotiation",
    labelAr: "تفاوض",
    variant: "success",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  WON: {
    labelEn: "Won",
    labelAr: "تم الفوز",
    variant: "success",
    className: "bg-green-500 text-white border-green-600",
  },
  LOST: {
    labelEn: "Lost",
    labelAr: "خسارة",
    variant: "danger",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  CHURNED: {
    labelEn: "Churned",
    labelAr: "منسحب",
    variant: "danger",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

export function DealStatusBadge({ status, className }: DealStatusBadgeProps) {
  const locale = useLocale();
  const config = STATUS_CONFIG[status];

  return (
    <Badge className={config.className || className}>
      {locale === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}

export { STATUS_CONFIG as DEAL_STATUS_CONFIG };
