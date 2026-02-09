import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";
import type { DealStatus } from '@/types';

interface DealStatusBadgeProps {
  status: DealStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  DealStatus,
  {
    labelEn: string;
    labelAr: string;
    variant: "default" | "secondary" | "destructive" | "outline";
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
    variant: "outline",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  DEMO_SCHEDULED: {
    labelEn: "Demo Scheduled",
    labelAr: "عرض مجدول",
    variant: "outline",
    className: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  DEMO_DONE: {
    labelEn: "Demo Done",
    labelAr: "تم العرض",
    variant: "outline",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
  PROPOSAL_SENT: {
    labelEn: "Proposal Sent",
    labelAr: "تم إرسال العرض",
    variant: "outline",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  NEGOTIATION: {
    labelEn: "Negotiation",
    labelAr: "تفاوض",
    variant: "default",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  WON: {
    labelEn: "Won",
    labelAr: "تم الفوز",
    variant: "default",
    className: "bg-green-500 text-white border-green-600",
  },
  LOST: {
    labelEn: "Lost",
    labelAr: "خسارة",
    variant: "destructive",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  CHURNED: {
    labelEn: "Churned",
    labelAr: "منسحب",
    variant: "destructive",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

export function DealStatusBadge({ status, className }: DealStatusBadgeProps) {
  const { i18n } = useTranslation();
  const config = STATUS_CONFIG[status];

  return (
    <Badge className={config.className || className}>
      {i18n.language === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}

export { STATUS_CONFIG as DEAL_STATUS_CONFIG };
