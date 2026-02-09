"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import {
  Activity,
  Filter,
  Calendar,
  LogIn,
  LogOut,
  Key,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Shield,
  UserCheck,
  UserMinus,
  CreditCard,
  XCircle,
  FileText,
  CheckCircle,
  CalendarPlus,
  CalendarX,
  Bell,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Input } from "@liyaqa/shared/components/ui/input";
import { useClientAuditLogs } from "@liyaqa/shared/queries/platform/use-client-audit";
import {
  type AuditAction,
  type AuditLog,
  AUDIT_ACTION_CONFIG,
  getAuditActionLabel,
  getAuditActionColor,
} from "@liyaqa/shared/lib/api/platform/client-audit";
import { formatDateTime } from "@liyaqa/shared/utils";

interface ClientActivityTabProps {
  organizationId: string;
}

const actionIcons: Partial<Record<AuditAction, React.ReactNode>> = {
  CREATE: <Plus className="h-4 w-4" />,
  UPDATE: <Pencil className="h-4 w-4" />,
  DELETE: <Trash2 className="h-4 w-4" />,
  LOGIN: <LogIn className="h-4 w-4" />,
  LOGOUT: <LogOut className="h-4 w-4" />,
  PASSWORD_CHANGE: <Key className="h-4 w-4" />,
  PASSWORD_RESET: <Key className="h-4 w-4" />,
  STATUS_CHANGE: <RefreshCw className="h-4 w-4" />,
  ROLE_CHANGE: <Shield className="h-4 w-4" />,
  CHECK_IN: <UserCheck className="h-4 w-4" />,
  CHECK_OUT: <UserMinus className="h-4 w-4" />,
  SUBSCRIPTION_CREATE: <CreditCard className="h-4 w-4" />,
  SUBSCRIPTION_CANCEL: <XCircle className="h-4 w-4" />,
  SUBSCRIPTION_RENEW: <RefreshCw className="h-4 w-4" />,
  INVOICE_ISSUE: <FileText className="h-4 w-4" />,
  INVOICE_PAY: <CheckCircle className="h-4 w-4" />,
  BOOKING_CREATE: <CalendarPlus className="h-4 w-4" />,
  BOOKING_CANCEL: <CalendarX className="h-4 w-4" />,
  NOTIFICATION_SEND: <Bell className="h-4 w-4" />,
};

const colorClasses: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  red: "bg-red-100 text-red-700 border-red-200",
  green: "bg-green-100 text-green-700 border-green-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  teal: "bg-teal-100 text-teal-700 border-teal-200",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
  sky: "bg-sky-100 text-sky-700 border-sky-200",
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
};

const ALL_ACTIONS = Object.keys(AUDIT_ACTION_CONFIG) as AuditAction[];

export function ClientActivityTab({ organizationId }: ClientActivityTabProps) {
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading, error } = useClientAuditLogs(organizationId, {
    page,
    size: 20,
    action: actionFilter === "all" ? undefined : actionFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy: "createdAt",
    sortDirection: "desc",
  });

  const texts = {
    title: locale === "ar" ? "سجل النشاط" : "Activity Log",
    filterByAction: locale === "ar" ? "تصفية حسب الإجراء" : "Filter by action",
    allActions: locale === "ar" ? "جميع الإجراءات" : "All Actions",
    startDate: locale === "ar" ? "من تاريخ" : "From Date",
    endDate: locale === "ar" ? "إلى تاريخ" : "To Date",
    noActivity: locale === "ar" ? "لا يوجد نشاط" : "No activity found",
    errorLoading: locale === "ar" ? "خطأ في تحميل السجل" : "Error loading activity log",
    loadMore: locale === "ar" ? "تحميل المزيد" : "Load More",
    previous: locale === "ar" ? "السابق" : "Previous",
    showing: locale === "ar" ? "عرض" : "Showing",
    of: locale === "ar" ? "من" : "of",
    results: locale === "ar" ? "نتيجة" : "results",
    by: locale === "ar" ? "بواسطة" : "by",
    unknown: locale === "ar" ? "غير معروف" : "Unknown",
  };

  if (isLoading && page === 0) {
    return (
      <Card className="border-indigo-500/20">
        <CardContent className="py-10 flex justify-center">
          <Loading />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-indigo-500/20">
        <CardContent className="py-6 text-center text-destructive">
          {texts.errorLoading}
        </CardContent>
      </Card>
    );
  }

  const logs = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;

  return (
    <Card className="border-indigo-500/20">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            {texts.title}
          </CardTitle>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value as AuditAction | "all");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="me-2 h-4 w-4" />
                <SelectValue placeholder={texts.filterByAction} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{texts.allActions}</SelectItem>
                {ALL_ACTIONS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {getAuditActionLabel(action, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                className="w-[140px]"
                placeholder={texts.startDate}
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                className="w-[140px]"
                placeholder={texts.endDate}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            {texts.noActivity}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Timeline */}
            <div className="relative">
              {logs.map((log, index) => {
                const color = getAuditActionColor(log.action);
                const icon = actionIcons[log.action] || <Activity className="h-4 w-4" />;

                return (
                  <div
                    key={log.id}
                    className="relative flex gap-4 pb-4 last:pb-0"
                  >
                    {/* Timeline line */}
                    {index < logs.length - 1 && (
                      <div className="absolute left-5 top-10 h-full w-px bg-border" />
                    )}

                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${colorClasses[color] || colorClasses.slate}`}
                    >
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={colorClasses[color] || colorClasses.slate}
                        >
                          {getAuditActionLabel(log.action, locale)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {log.entityType}
                        </span>
                      </div>

                      {log.details && (
                        <p className="text-sm text-muted-foreground">
                          {log.details}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.userName || log.userEmail || texts.unknown}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(log.createdAt, locale)}
                        </span>
                        {log.ipAddress && (
                          <span className="font-mono">{log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {texts.showing} {page * 20 + 1}-{Math.min((page + 1) * 20, totalElements)} {texts.of} {totalElements} {texts.results}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    {texts.previous}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    {texts.loadMore}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
