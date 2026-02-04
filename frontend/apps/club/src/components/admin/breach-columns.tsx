"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { formatDate } from "@liyaqa/shared/utils";
import { MoreHorizontal, Bell, Shield, CheckCircle, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { BreachSeverityBadge } from "@/components/compliance/breach-severity-badge";
import type { DataBreach, BreachStatus, BreachType } from "@liyaqa/shared/types/data-protection";

interface GetBreachColumnsOptions {
  locale: string;
  onView?: (breach: DataBreach) => void;
  onInvestigate?: (breach: DataBreach) => void;
  onContain?: (breach: DataBreach) => void;
  onResolve?: (breach: DataBreach) => void;
  onNotifySdaia?: (breach: DataBreach) => void;
  onNotifySubjects?: (breach: DataBreach) => void;
}

const statusColors: Record<BreachStatus, string> = {
  REPORTED: "bg-red-100 text-red-800",
  INVESTIGATING: "bg-yellow-100 text-yellow-800",
  CONTAINED: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-slate-100 text-slate-700",
};

const statusLabels: Record<BreachStatus, { en: string; ar: string }> = {
  REPORTED: { en: "Reported", ar: "مُبلغ عنه" },
  INVESTIGATING: { en: "Investigating", ar: "قيد التحقيق" },
  CONTAINED: { en: "Contained", ar: "تم الاحتواء" },
  RESOLVED: { en: "Resolved", ar: "تم الحل" },
  CLOSED: { en: "Closed", ar: "مغلق" },
};

const typeLabels: Record<BreachType, { en: string; ar: string }> = {
  CONFIDENTIALITY: { en: "Confidentiality", ar: "سرية" },
  INTEGRITY: { en: "Integrity", ar: "سلامة" },
  AVAILABILITY: { en: "Availability", ar: "توفر" },
  COMBINED: { en: "Combined", ar: "مجتمع" },
};

export function getBreachColumns({
  locale,
  onView,
  onInvestigate,
  onContain,
  onResolve,
  onNotifySdaia,
  onNotifySubjects,
}: GetBreachColumnsOptions): ColumnDef<DataBreach>[] {
  const isArabic = locale === "ar";

  return [
    {
      accessorKey: "breachNumber",
      header: isArabic ? "رقم الانتهاك" : "Breach #",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.breachNumber}</span>
      ),
    },
    {
      accessorKey: "title",
      header: isArabic ? "العنوان" : "Title",
      cell: ({ row }) => {
        const breach = row.original;
        const typeLabel = typeLabels[breach.breachType];
        return (
          <div>
            <p className="font-medium">{breach.title}</p>
            <Badge variant="outline" className="text-xs mt-1">
              {isArabic ? typeLabel.ar : typeLabel.en}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "severity",
      header: isArabic ? "الخطورة" : "Severity",
      cell: ({ row }) => (
        <BreachSeverityBadge severity={row.original.severity} isArabic={isArabic} />
      ),
    },
    {
      accessorKey: "status",
      header: isArabic ? "الحالة" : "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const label = statusLabels[status];
        return (
          <Badge className={statusColors[status]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "sdaiaNotifiedAt",
      header: isArabic ? "إشعار SDAIA" : "SDAIA Notified",
      cell: ({ row }) => {
        const breach = row.original;
        if (breach.sdaiaNotifiedAt) {
          return (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {formatDate(breach.sdaiaNotifiedAt, locale)}
            </Badge>
          );
        }
        if (breach.sdaiaNotificationRequired) {
          const isOverdue = breach.isSdaiaOverdue;
          return (
            <Badge className={isOverdue ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
              {isOverdue
                ? (isArabic ? "متأخر!" : "Overdue!")
                : (isArabic ? "مطلوب" : "Required")
              }
            </Badge>
          );
        }
        return (
          <span className="text-muted-foreground">
            {isArabic ? "غير مطلوب" : "Not Required"}
          </span>
        );
      },
    },
    {
      accessorKey: "discoveredAt",
      header: isArabic ? "تاريخ الاكتشاف" : "Discovered",
      cell: ({ row }) => formatDate(row.original.discoveredAt, locale),
    },
    {
      accessorKey: "affectedRecordsCount",
      header: isArabic ? "السجلات المتأثرة" : "Affected Records",
      cell: ({ row }) => {
        const count = row.original.affectedRecordsCount;
        return count ? count.toLocaleString(isArabic ? "ar-SA" : "en-US") : "-";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const breach = row.original;
        const canInvestigate = breach.status === "REPORTED";
        const canContain = breach.status === "INVESTIGATING";
        const canResolve = breach.status === "CONTAINED";
        const canNotifySdaia = breach.sdaiaNotificationRequired && !breach.sdaiaNotifiedAt;
        const canNotifySubjects = breach.individualsNotificationRequired && !breach.individualsNotifiedAt;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(breach)}>
                {isArabic ? "عرض التفاصيل" : "View Details"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canInvestigate && (
                <DropdownMenuItem onClick={() => onInvestigate?.(breach)}>
                  <Search className="h-4 w-4 mr-2" />
                  {isArabic ? "بدء التحقيق" : "Start Investigation"}
                </DropdownMenuItem>
              )}
              {canContain && (
                <DropdownMenuItem onClick={() => onContain?.(breach)}>
                  <Shield className="h-4 w-4 mr-2" />
                  {isArabic ? "تم الاحتواء" : "Mark Contained"}
                </DropdownMenuItem>
              )}
              {canResolve && (
                <DropdownMenuItem onClick={() => onResolve?.(breach)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isArabic ? "حل الانتهاك" : "Resolve Breach"}
                </DropdownMenuItem>
              )}
              {canNotifySdaia && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNotifySdaia?.(breach)}>
                    <Bell className="h-4 w-4 mr-2" />
                    {isArabic ? "إشعار سدايا" : "Notify SDAIA"}
                  </DropdownMenuItem>
                </>
              )}
              {canNotifySubjects && (
                <DropdownMenuItem onClick={() => onNotifySubjects?.(breach)}>
                  <Bell className="h-4 w-4 mr-2" />
                  {isArabic ? "إشعار المتأثرين" : "Notify Affected Individuals"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
