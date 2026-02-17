"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { cn } from "@liyaqa/shared/utils";
import {
  useAuditLogs,
  useAuditActions,
  useAuditResourceTypes,
  useExportAuditLogs,
} from "@liyaqa/shared/queries/platform/use-audit-log";
import type { PlatformAuditLogFilters, PlatformAuditAction, PlatformAuditResourceType } from "@liyaqa/shared/types/platform/audit-log";

export default function AuditLogPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [filters, setFilters] = useState<PlatformAuditLogFilters>({
    page: 0,
    size: 50,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const texts = {
    title: isRtl ? "سجل المراجعة" : "Audit Log",
    subtitle: isRtl ? "تتبع جميع الإجراءات والتغييرات في المنصة" : "Track all actions and changes across the platform",
    search: isRtl ? "بحث..." : "Search...",
    action: isRtl ? "الإجراء" : "Action",
    resourceType: isRtl ? "نوع المورد" : "Resource Type",
    actor: isRtl ? "المنفذ" : "Actor",
    resource: isRtl ? "المورد" : "Resource",
    timestamp: isRtl ? "الوقت" : "Timestamp",
    details: isRtl ? "التفاصيل" : "Details",
    ipAddress: isRtl ? "عنوان IP" : "IP Address",
    all: isRtl ? "الكل" : "All",
    export: isRtl ? "تصدير CSV" : "Export CSV",
    dateFrom: isRtl ? "من تاريخ" : "From Date",
    dateTo: isRtl ? "إلى تاريخ" : "To Date",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    noLogs: isRtl ? "لا توجد سجلات" : "No audit logs found",
    previous: isRtl ? "السابق" : "Previous",
    next: isRtl ? "التالي" : "Next",
    page: isRtl ? "صفحة" : "Page",
    of: isRtl ? "من" : "of",
    system: isRtl ? "النظام" : "System",
    exporting: isRtl ? "جاري التصدير..." : "Exporting...",
  };

  const { data: logsData, isLoading: logsLoading, refetch } = useAuditLogs({
    ...filters,
    search: searchTerm || undefined,
  });
  const { data: actions } = useAuditActions();
  const { data: resourceTypes } = useAuditResourceTypes();
  const exportMutation = useExportAuditLogs();

  const logs = logsData?.content || [];
  const totalPages = logsData?.totalPages || 0;
  const currentPage = filters.page || 0;

  const getActionColor = (action: string) => {
    if (action.includes("DELETE") || action.includes("DEACTIVATED") || action.includes("REVOKED") || action.includes("LOST")) return "destructive";
    if (action.includes("CREATE") || action.includes("ACTIVATED") || action.includes("WON")) return "default";
    if (action.includes("UPDATE") || action.includes("CHANGED") || action.includes("RENEWED")) return "secondary";
    return "outline";
  };

  const handleExport = () => {
    exportMutation.mutate({
      ...filters,
      search: searchTerm || undefined,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div className={isRtl ? "text-right" : ""}>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {texts.title}
          </h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 me-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 me-1" />
            {exportMutation.isPending ? texts.exporting : texts.export}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className={cn("flex flex-col md:flex-row gap-4", isRtl && "md:flex-row-reverse")}>
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={texts.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select
              value={filters.action || "ALL"}
              onValueChange={(v) =>
                setFilters({ ...filters, action: v === "ALL" ? undefined : v as PlatformAuditAction, page: 0 })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={texts.action} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                {actions?.map((a) => (
                  <SelectItem key={a.name} value={a.name}>
                    {a.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.resourceType || "ALL"}
              onValueChange={(v) =>
                setFilters({ ...filters, resourceType: v === "ALL" ? undefined : v as PlatformAuditResourceType, page: 0 })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={texts.resourceType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                {resourceTypes?.map((rt) => (
                  <SelectItem key={rt.name} value={rt.name}>
                    {rt.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined, page: 0 })}
              className="w-40"
              placeholder={texts.dateFrom}
            />
            <Input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined, page: 0 })}
              className="w-40"
              placeholder={texts.dateTo}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="pt-6">
          {logsLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{texts.loading}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{texts.noLogs}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn("border-b text-muted-foreground", isRtl && "text-right")}>
                      <th className="pb-3 font-medium">{texts.timestamp}</th>
                      <th className="pb-3 font-medium">{texts.action}</th>
                      <th className="pb-3 font-medium">{texts.actor}</th>
                      <th className="pb-3 font-medium">{texts.resourceType}</th>
                      <th className="pb-3 font-medium">{texts.ipAddress}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 text-xs whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString(locale)}
                        </td>
                        <td className="py-3">
                          <Badge variant={getActionColor(log.action)} className="text-xs">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-xs font-medium">
                              {log.actorName || texts.system}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {log.actorType}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs">
                            {log.resourceType}
                          </Badge>
                          {log.resourceId && (
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate max-w-[120px]">
                              {log.resourceId}
                            </p>
                          )}
                        </td>
                        <td className="py-3 text-xs font-mono">
                          {log.ipAddress || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={cn("flex items-center justify-between mt-4 pt-4 border-t", isRtl && "flex-row-reverse")}>
                  <p className="text-sm text-muted-foreground">
                    {texts.page} {currentPage + 1} {texts.of} {totalPages}
                  </p>
                  <div className={cn("flex gap-2", isRtl && "flex-row-reverse")}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ ...filters, page: currentPage - 1 })}
                      disabled={currentPage === 0}
                    >
                      {texts.previous}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ ...filters, page: currentPage + 1 })}
                      disabled={currentPage >= totalPages - 1}
                    >
                      {texts.next}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
