import { Badge } from "./badge";
import { cn } from "../../lib/utils";

// Status type mapping to badge variants and display text
const statusConfig: Record<
  string,
  {
    variant: "success" | "warning" | "danger" | "info" | "secondary";
    labelEn: string;
    labelAr: string;
  }
> = {
  // Member/Subscription statuses
  ACTIVE: { variant: "success", labelEn: "Active", labelAr: "نشط" },
  PENDING: { variant: "warning", labelEn: "Pending", labelAr: "معلق" },
  PENDING_PAYMENT: {
    variant: "warning",
    labelEn: "Pending Payment",
    labelAr: "معلق الدفع",
  },
  SUSPENDED: { variant: "danger", labelEn: "Suspended", labelAr: "موقوف" },
  FROZEN: { variant: "info", labelEn: "Frozen", labelAr: "مجمد" },
  CANCELLED: { variant: "danger", labelEn: "Cancelled", labelAr: "ملغي" },
  EXPIRED: { variant: "secondary", labelEn: "Expired", labelAr: "منتهي" },
  // Invoice statuses
  DRAFT: { variant: "secondary", labelEn: "Draft", labelAr: "مسودة" },
  ISSUED: { variant: "info", labelEn: "Issued", labelAr: "صادرة" },
  PAID: { variant: "success", labelEn: "Paid", labelAr: "مدفوعة" },
  OVERDUE: { variant: "danger", labelEn: "Overdue", labelAr: "متأخرة" },
  PARTIALLY_PAID: {
    variant: "warning",
    labelEn: "Partially Paid",
    labelAr: "مدفوعة جزئياً",
  },
  // Attendance statuses
  CHECKED_IN: {
    variant: "success",
    labelEn: "Checked In",
    labelAr: "مسجل الدخول",
  },
  CHECKED_OUT: {
    variant: "secondary",
    labelEn: "Checked Out",
    labelAr: "مسجل الخروج",
  },
  // Booking statuses
  CONFIRMED: { variant: "success", labelEn: "Confirmed", labelAr: "مؤكد" },
  WAITLISTED: { variant: "warning", labelEn: "Waitlisted", labelAr: "قائمة الانتظار" },
  NO_SHOW: { variant: "danger", labelEn: "No Show", labelAr: "لم يحضر" },
  COMPLETED: { variant: "success", labelEn: "Completed", labelAr: "مكتمل" },
};

interface StatusBadgeProps {
  status: string;
  locale?: string;
  className?: string;
}

export function StatusBadge({
  status,
  locale = "en",
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status] || {
    variant: "secondary" as const,
    labelEn: status,
    labelAr: status,
  };

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {locale === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
