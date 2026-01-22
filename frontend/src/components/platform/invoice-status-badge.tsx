"use client";

import { Badge } from "@/components/ui/badge";
import type { ClientInvoiceStatus } from "@/types/platform/client-invoice";

interface InvoiceStatusBadgeProps {
  status: ClientInvoiceStatus;
  locale?: string;
}

const STATUS_CONFIG: Record<
  ClientInvoiceStatus,
  { label: { en: string; ar: string }; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  DRAFT: {
    label: { en: "Draft", ar: "مسودة" },
    variant: "secondary",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  ISSUED: {
    label: { en: "Issued", ar: "صادرة" },
    variant: "outline",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  PAID: {
    label: { en: "Paid", ar: "مدفوعة" },
    variant: "default",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  PARTIALLY_PAID: {
    label: { en: "Partially Paid", ar: "مدفوعة جزئياً" },
    variant: "outline",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  OVERDUE: {
    label: { en: "Overdue", ar: "متأخرة" },
    variant: "destructive",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  CANCELLED: {
    label: { en: "Cancelled", ar: "ملغاة" },
    variant: "secondary",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

export function InvoiceStatusBadge({ status, locale = "en" }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {locale === "ar" ? config.label.ar : config.label.en}
    </Badge>
  );
}
