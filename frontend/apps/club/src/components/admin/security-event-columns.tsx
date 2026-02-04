"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { formatDate, formatTime } from "@liyaqa/shared/utils";
import { MoreHorizontal, Search, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import type { SecurityEvent, SecurityEventType, SecuritySeverity, SecurityOutcome } from "@liyaqa/shared/types/security-event";

interface GetSecurityEventColumnsOptions {
  locale: string;
  onView?: (event: SecurityEvent) => void;
  onInvestigate?: (event: SecurityEvent) => void;
}

const severityColors: Record<SecuritySeverity, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

const severityLabels: Record<SecuritySeverity, { en: string; ar: string }> = {
  LOW: { en: "Low", ar: "منخفض" },
  MEDIUM: { en: "Medium", ar: "متوسط" },
  HIGH: { en: "High", ar: "عالي" },
  CRITICAL: { en: "Critical", ar: "حرج" },
};

const outcomeColors: Record<SecurityOutcome, string> = {
  SUCCESS: "bg-green-100 text-green-800",
  FAILURE: "bg-red-100 text-red-800",
  BLOCKED: "bg-orange-100 text-orange-800",
  UNKNOWN: "bg-slate-100 text-slate-700",
};

const outcomeLabels: Record<SecurityOutcome, { en: string; ar: string }> = {
  SUCCESS: { en: "Success", ar: "نجاح" },
  FAILURE: { en: "Failure", ar: "فشل" },
  BLOCKED: { en: "Blocked", ar: "محظور" },
  UNKNOWN: { en: "Unknown", ar: "غير معروف" },
};

const eventTypeLabels: Record<SecurityEventType, { en: string; ar: string }> = {
  LOGIN_SUCCESS: { en: "Login Success", ar: "تسجيل دخول ناجح" },
  LOGIN_FAILURE: { en: "Login Failure", ar: "فشل تسجيل الدخول" },
  LOGOUT: { en: "Logout", ar: "تسجيل خروج" },
  PASSWORD_CHANGE: { en: "Password Change", ar: "تغيير كلمة المرور" },
  PASSWORD_RESET: { en: "Password Reset", ar: "إعادة تعيين كلمة المرور" },
  MFA_ENABLED: { en: "MFA Enabled", ar: "تفعيل المصادقة الثنائية" },
  MFA_DISABLED: { en: "MFA Disabled", ar: "تعطيل المصادقة الثنائية" },
  SESSION_TIMEOUT: { en: "Session Timeout", ar: "انتهاء الجلسة" },
  SESSION_REVOKED: { en: "Session Revoked", ar: "إلغاء الجلسة" },
  PERMISSION_DENIED: { en: "Permission Denied", ar: "رفض الصلاحية" },
  RATE_LIMITED: { en: "Rate Limited", ar: "تقييد المعدل" },
  SUSPICIOUS_ACTIVITY: { en: "Suspicious Activity", ar: "نشاط مشبوه" },
  BRUTE_FORCE_ATTEMPT: { en: "Brute Force", ar: "محاولة اختراق" },
  DATA_EXPORT: { en: "Data Export", ar: "تصدير بيانات" },
  BULK_DELETE: { en: "Bulk Delete", ar: "حذف جماعي" },
  ADMIN_ACTION: { en: "Admin Action", ar: "إجراء إداري" },
  CONFIGURATION_CHANGE: { en: "Config Change", ar: "تغيير الإعدادات" },
  API_KEY_CREATED: { en: "API Key Created", ar: "إنشاء مفتاح API" },
  API_KEY_REVOKED: { en: "API Key Revoked", ar: "إلغاء مفتاح API" },
  PII_ACCESS: { en: "PII Access", ar: "الوصول لبيانات شخصية" },
  SENSITIVE_DATA_ACCESS: { en: "Sensitive Data Access", ar: "الوصول لبيانات حساسة" },
  DATA_BREACH_SUSPECTED: { en: "Data Breach Suspected", ar: "اشتباه في اختراق بيانات" },
};

export function getSecurityEventColumns({
  locale,
  onView,
  onInvestigate,
}: GetSecurityEventColumnsOptions): ColumnDef<SecurityEvent>[] {
  const isArabic = locale === "ar";

  return [
    {
      accessorKey: "createdAt",
      header: isArabic ? "الوقت" : "Timestamp",
      cell: ({ row }) => (
        <div className="text-sm">
          <p className="font-medium">{formatDate(row.original.createdAt, locale)}</p>
          <p className="text-muted-foreground">{formatTime(row.original.createdAt, locale)}</p>
        </div>
      ),
    },
    {
      accessorKey: "eventType",
      header: isArabic ? "النوع" : "Event Type",
      cell: ({ row }) => {
        const type = row.original.eventType;
        const label = eventTypeLabels[type];
        return (
          <span className="text-sm font-medium">
            {isArabic ? label.ar : label.en}
          </span>
        );
      },
    },
    {
      accessorKey: "severity",
      header: isArabic ? "الخطورة" : "Severity",
      cell: ({ row }) => {
        const severity = row.original.severity;
        const label = severityLabels[severity];
        return (
          <Badge className={severityColors[severity]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "sourceIp",
      header: isArabic ? "عنوان IP" : "Source IP",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.sourceIp || "-"}</span>
      ),
    },
    {
      accessorKey: "action",
      header: isArabic ? "الإجراء" : "Action",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.action || "-"}</span>
      ),
    },
    {
      accessorKey: "outcome",
      header: isArabic ? "النتيجة" : "Outcome",
      cell: ({ row }) => {
        const outcome = row.original.outcome;
        if (!outcome) return "-";
        const label = outcomeLabels[outcome];
        return (
          <Badge className={outcomeColors[outcome]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "riskScore",
      header: isArabic ? "درجة المخاطر" : "Risk Score",
      cell: ({ row }) => {
        const score = row.original.riskScore;
        const getScoreColor = (s: number) => {
          if (s >= 80) return "text-red-600";
          if (s >= 60) return "text-orange-600";
          if (s >= 40) return "text-yellow-600";
          return "text-green-600";
        };
        return (
          <span className={`font-medium ${getScoreColor(score)}`}>{score}</span>
        );
      },
    },
    {
      accessorKey: "investigated",
      header: isArabic ? "تم التحقيق" : "Investigated",
      cell: ({ row }) => {
        if (row.original.investigated) {
          return (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {isArabic ? "نعم" : "Yes"}
            </Badge>
          );
        }
        return (
          <Badge variant="outline">
            {isArabic ? "لا" : "No"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const event = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(event)}>
                {isArabic ? "عرض التفاصيل" : "View Details"}
              </DropdownMenuItem>
              {!event.investigated && (
                <DropdownMenuItem onClick={() => onInvestigate?.(event)}>
                  <Search className="h-4 w-4 mr-2" />
                  {isArabic ? "تحقيق" : "Investigate"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
