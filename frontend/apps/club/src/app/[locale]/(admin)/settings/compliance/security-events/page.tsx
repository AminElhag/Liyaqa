"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { getSecurityEventColumns } from "@/components/admin/security-event-columns";
import {
  useSecurityEvents,
  useSecurityStats,
  useInvestigateEvent,
} from "@liyaqa/shared/queries/use-security-events";
import type { SecurityEvent, SecurityEventParams, SecurityEventType, SecuritySeverity } from "@liyaqa/shared/types/security-event";

export default function SecurityEventsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [filters, setFilters] = useState<SecurityEventParams>({});
  const [investigateDialogOpen, setInvestigateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [investigationNotes, setInvestigationNotes] = useState("");

  const { data: events, isLoading } = useSecurityEvents(filters);
  const { data: stats, isLoading: loadingStats } = useSecurityStats();

  const investigateEvent = useInvestigateEvent();

  const handleView = (event: SecurityEvent) => {
    setSelectedEvent(event);
    setViewDialogOpen(true);
  };

  const handleInvestigate = (event: SecurityEvent) => {
    setSelectedEvent(event);
    setInvestigationNotes("");
    setInvestigateDialogOpen(true);
  };

  const submitInvestigation = () => {
    if (!selectedEvent) return;
    investigateEvent.mutate(
      {
        id: selectedEvent.id,
        request: { notes: investigationNotes || undefined },
      },
      {
        onSuccess: () => {
          setInvestigateDialogOpen(false);
          setSelectedEvent(null);
          setInvestigationNotes("");
        },
      }
    );
  };

  const columns = getSecurityEventColumns({
    locale,
    onView: handleView,
    onInvestigate: handleInvestigate,
  });

  const eventTypeOptions: { value: SecurityEventType; label: { en: string; ar: string } }[] = [
    { value: "LOGIN_SUCCESS", label: { en: "Login Success", ar: "تسجيل دخول ناجح" } },
    { value: "LOGIN_FAILURE", label: { en: "Login Failure", ar: "فشل تسجيل الدخول" } },
    { value: "PASSWORD_CHANGE", label: { en: "Password Change", ar: "تغيير كلمة المرور" } },
    { value: "PERMISSION_DENIED", label: { en: "Permission Denied", ar: "رفض الصلاحية" } },
    { value: "SUSPICIOUS_ACTIVITY", label: { en: "Suspicious Activity", ar: "نشاط مشبوه" } },
    { value: "BRUTE_FORCE_ATTEMPT", label: { en: "Brute Force", ar: "محاولة اختراق" } },
    { value: "DATA_EXPORT", label: { en: "Data Export", ar: "تصدير بيانات" } },
    { value: "PII_ACCESS", label: { en: "PII Access", ar: "الوصول لبيانات شخصية" } },
    { value: "DATA_BREACH_SUSPECTED", label: { en: "Data Breach Suspected", ar: "اشتباه في اختراق" } },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isArabic ? "سجل الأحداث الأمنية" : "Security Events Log"}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? "مراقبة وتحقيق الأحداث الأمنية في النظام"
            : "Monitor and investigate security events in the system"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "إجمالي الأحداث" : "Total Events"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalEvents ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "أحداث حرجة" : "Critical Events"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{stats?.criticalEvents ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "أحداث عالية الخطورة" : "High Severity"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{stats?.highSeverityEvents ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "غير محققة" : "Uninvestigated"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">{stats?.uninvestigatedEvents ?? 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "الفلاتر" : "Filters"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Select
              value={filters.eventType || "all"}
              onValueChange={(v) =>
                setFilters({ ...filters, eventType: v === "all" ? undefined : (v as SecurityEventType) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? "نوع الحدث" : "Event Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "جميع الأنواع" : "All Types"}</SelectItem>
                {eventTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {isArabic ? opt.label.ar : opt.label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.severity || "all"}
              onValueChange={(v) =>
                setFilters({ ...filters, severity: v === "all" ? undefined : (v as SecuritySeverity) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? "الخطورة" : "Severity"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "جميع المستويات" : "All Severities"}</SelectItem>
                <SelectItem value="LOW">{isArabic ? "منخفض" : "Low"}</SelectItem>
                <SelectItem value="MEDIUM">{isArabic ? "متوسط" : "Medium"}</SelectItem>
                <SelectItem value="HIGH">{isArabic ? "عالي" : "High"}</SelectItem>
                <SelectItem value="CRITICAL">{isArabic ? "حرج" : "Critical"}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.investigated === undefined ? "all" : filters.investigated ? "yes" : "no"}
              onValueChange={(v) =>
                setFilters({
                  ...filters,
                  investigated: v === "all" ? undefined : v === "yes",
                })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? "تم التحقيق" : "Investigated"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "الكل" : "All"}</SelectItem>
                <SelectItem value="yes">{isArabic ? "نعم" : "Yes"}</SelectItem>
                <SelectItem value="no">{isArabic ? "لا" : "No"}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder={isArabic ? "من" : "From"}
                value={filters.startDate || ""}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                className="w-40"
              />
              <Input
                type="date"
                placeholder={isArabic ? "إلى" : "To"}
                value={filters.endDate || ""}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "سجل الأحداث" : "Events Log"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "جميع الأحداث الأمنية المسجلة"
              : "All recorded security events"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <DataTable
              columns={columns}
              data={events?.content ?? []}
              searchKey="action"
              searchPlaceholder={isArabic ? "البحث..." : "Search..."}
            />
          )}
        </CardContent>
      </Card>

      {/* View Event Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تفاصيل الحدث" : "Event Details"}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "نوع الحدث" : "Event Type"}</Label>
                  <p className="font-medium">{selectedEvent.eventType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "الخطورة" : "Severity"}</Label>
                  <p className="font-medium">{selectedEvent.severity}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "عنوان IP" : "Source IP"}</Label>
                  <p className="font-mono">{selectedEvent.sourceIp || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "درجة المخاطر" : "Risk Score"}</Label>
                  <p className="font-medium">{selectedEvent.riskScore}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "الإجراء" : "Action"}</Label>
                  <p>{selectedEvent.action || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "النتيجة" : "Outcome"}</Label>
                  <p>{selectedEvent.outcome || "-"}</p>
                </div>
              </div>
              {selectedEvent.details && (
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "التفاصيل" : "Details"}</Label>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                </div>
              )}
              {selectedEvent.investigated && selectedEvent.investigationNotes && (
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "ملاحظات التحقيق" : "Investigation Notes"}</Label>
                  <p className="text-sm">{selectedEvent.investigationNotes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              {isArabic ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Investigate Event Dialog */}
      <Dialog open={investigateDialogOpen} onOpenChange={setInvestigateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? "تحقيق في الحدث" : "Investigate Event"}</DialogTitle>
            <DialogDescription>
              {isArabic
                ? "أضف ملاحظات التحقيق وقم بوضع علامة على الحدث كمحقق"
                : "Add investigation notes and mark the event as investigated"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isArabic ? "ملاحظات التحقيق" : "Investigation Notes"}</Label>
              <Textarea
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
                placeholder={isArabic ? "أدخل ملاحظات التحقيق..." : "Enter investigation notes..."}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestigateDialogOpen(false)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={submitInvestigation} disabled={investigateEvent.isPending}>
              {isArabic ? "تأكيد التحقيق" : "Mark as Investigated"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
