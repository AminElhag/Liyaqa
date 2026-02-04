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
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@liyaqa/shared/components/ui/dialog";
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
import { Plus, AlertTriangle } from "lucide-react";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { getBreachColumns } from "@/components/admin/breach-columns";
import {
  useBreaches,
  useBreachStats,
  useReportBreach,
  useStartBreachInvestigation,
  useContainBreach,
  useResolveBreach,
  useRecordSdaiaNotification,
} from "@liyaqa/shared/queries/use-data-protection";
import type {
  DataBreach,
  BreachParams,
  BreachType,
  BreachSource,
  BreachStatus,
  SecuritySeverity,
} from "@liyaqa/shared/types/data-protection";

export default function BreachRegisterPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBreach, setSelectedBreach] = useState<DataBreach | null>(null);
  const [filters, setFilters] = useState<BreachParams>({});

  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    discoveredAt: new Date().toISOString().split("T")[0],
    occurredAt: "",
    breachType: "CONFIDENTIALITY" as BreachType,
    breachSource: "UNKNOWN" as BreachSource,
    affectedDataTypes: "",
    affectedRecordsCount: "",
    severity: "MEDIUM" as SecuritySeverity,
  });

  const [resolveForm, setResolveForm] = useState({
    rootCause: "",
    remediation: "",
  });

  const [sdaiaReference, setSdaiaReference] = useState("");

  const { data: breaches, isLoading } = useBreaches(filters);
  const { data: stats, isLoading: loadingStats } = useBreachStats();

  const reportBreach = useReportBreach();
  const startInvestigation = useStartBreachInvestigation();
  const containBreach = useContainBreach();
  const resolveBreach = useResolveBreach();
  const recordSdaiaNotification = useRecordSdaiaNotification();

  const handleReport = () => {
    reportBreach.mutate(
      {
        title: reportForm.title,
        description: reportForm.description || undefined,
        discoveredAt: reportForm.discoveredAt,
        occurredAt: reportForm.occurredAt || undefined,
        breachType: reportForm.breachType,
        breachSource: reportForm.breachSource,
        affectedDataTypes: reportForm.affectedDataTypes
          ? reportForm.affectedDataTypes.split(",").map((s) => s.trim())
          : undefined,
        affectedRecordsCount: reportForm.affectedRecordsCount
          ? parseInt(reportForm.affectedRecordsCount)
          : undefined,
        severity: reportForm.severity,
      },
      {
        onSuccess: () => {
          setReportDialogOpen(false);
          setReportForm({
            title: "",
            description: "",
            discoveredAt: new Date().toISOString().split("T")[0],
            occurredAt: "",
            breachType: "CONFIDENTIALITY",
            breachSource: "UNKNOWN",
            affectedDataTypes: "",
            affectedRecordsCount: "",
            severity: "MEDIUM",
          });
        },
      }
    );
  };

  const handleResolve = () => {
    if (!selectedBreach) return;
    resolveBreach.mutate(
      {
        id: selectedBreach.id,
        request: {
          rootCause: resolveForm.rootCause,
          remediation: resolveForm.remediation,
        },
      },
      {
        onSuccess: () => {
          setResolveDialogOpen(false);
          setSelectedBreach(null);
          setResolveForm({ rootCause: "", remediation: "" });
        },
      }
    );
  };

  const handleNotifySdaia = () => {
    if (!selectedBreach) return;
    recordSdaiaNotification.mutate(
      {
        id: selectedBreach.id,
        reference: sdaiaReference,
      },
      {
        onSuccess: () => {
          setNotifyDialogOpen(false);
          setSelectedBreach(null);
          setSdaiaReference("");
        },
      }
    );
  };

  const columns = getBreachColumns({
    locale,
    onView: (breach) => {
      setSelectedBreach(breach);
      setViewDialogOpen(true);
    },
    onInvestigate: (breach) => startInvestigation.mutate(breach.id),
    onContain: (breach) => containBreach.mutate(breach.id),
    onResolve: (breach) => {
      setSelectedBreach(breach);
      setResolveDialogOpen(true);
    },
    onNotifySdaia: (breach) => {
      setSelectedBreach(breach);
      setNotifyDialogOpen(true);
    },
  });

  const breachTypeLabels: Record<BreachType, { en: string; ar: string }> = {
    CONFIDENTIALITY: { en: "Confidentiality", ar: "السرية" },
    INTEGRITY: { en: "Integrity", ar: "السلامة" },
    AVAILABILITY: { en: "Availability", ar: "التوفر" },
    COMBINED: { en: "Combined", ar: "مجتمع" },
  };

  const breachSourceLabels: Record<BreachSource, { en: string; ar: string }> = {
    EXTERNAL_ATTACK: { en: "External Attack", ar: "هجوم خارجي" },
    INTERNAL_ACTOR: { en: "Internal Actor", ar: "فاعل داخلي" },
    SYSTEM_ERROR: { en: "System Error", ar: "خطأ نظامي" },
    HUMAN_ERROR: { en: "Human Error", ar: "خطأ بشري" },
    THIRD_PARTY: { en: "Third Party", ar: "طرف ثالث" },
    PHYSICAL: { en: "Physical", ar: "مادي" },
    UNKNOWN: { en: "Unknown", ar: "غير معروف" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "سجل الانتهاكات" : "Breach Register"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "تسجيل وإدارة انتهاكات البيانات وفقاً للمادة 29 من PDPL"
              : "Record and manage data breaches per PDPL Article 29"}
          </p>
        </div>
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? "الإبلاغ عن انتهاك" : "Report Breach"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isArabic ? "الإبلاغ عن انتهاك بيانات" : "Report Data Breach"}</DialogTitle>
              <DialogDescription>
                {isArabic
                  ? "تسجيل انتهاك بيانات جديد - يجب إشعار سدايا خلال 72 ساعة"
                  : "Record a new data breach - SDAIA must be notified within 72 hours"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>{isArabic ? "العنوان" : "Title"}</Label>
                <Input
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  placeholder={isArabic ? "وصف موجز للانتهاك" : "Brief description of breach"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الوصف" : "Description"}</Label>
                <Textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  placeholder={isArabic ? "تفاصيل الانتهاك" : "Details of the breach"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? "تاريخ الاكتشاف" : "Discovery Date"}</Label>
                  <Input
                    type="date"
                    value={reportForm.discoveredAt}
                    onChange={(e) => setReportForm({ ...reportForm, discoveredAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "تاريخ الحدوث" : "Occurrence Date"}</Label>
                  <Input
                    type="date"
                    value={reportForm.occurredAt}
                    onChange={(e) => setReportForm({ ...reportForm, occurredAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? "نوع الانتهاك" : "Breach Type"}</Label>
                  <Select
                    value={reportForm.breachType}
                    onValueChange={(v) => setReportForm({ ...reportForm, breachType: v as BreachType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(breachTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {isArabic ? label.ar : label.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "المصدر" : "Source"}</Label>
                  <Select
                    value={reportForm.breachSource}
                    onValueChange={(v) => setReportForm({ ...reportForm, breachSource: v as BreachSource })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(breachSourceLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {isArabic ? label.ar : label.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الخطورة" : "Severity"}</Label>
                <Select
                  value={reportForm.severity}
                  onValueChange={(v) => setReportForm({ ...reportForm, severity: v as SecuritySeverity })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">{isArabic ? "منخفض" : "Low"}</SelectItem>
                    <SelectItem value="MEDIUM">{isArabic ? "متوسط" : "Medium"}</SelectItem>
                    <SelectItem value="HIGH">{isArabic ? "عالي" : "High"}</SelectItem>
                    <SelectItem value="CRITICAL">{isArabic ? "حرج" : "Critical"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "أنواع البيانات المتأثرة" : "Affected Data Types"}</Label>
                <Input
                  value={reportForm.affectedDataTypes}
                  onChange={(e) => setReportForm({ ...reportForm, affectedDataTypes: e.target.value })}
                  placeholder={isArabic ? "مثل: الأسماء، البريد الإلكتروني" : "e.g., Names, Emails, Phone numbers"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "عدد السجلات المتأثرة" : "Affected Records Count"}</Label>
                <Input
                  type="number"
                  value={reportForm.affectedRecordsCount}
                  onChange={(e) => setReportForm({ ...reportForm, affectedRecordsCount: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleReport} disabled={!reportForm.title || reportBreach.isPending}>
                {isArabic ? "الإبلاغ" : "Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* SDAIA Alert */}
      {(stats?.sdaiaPendingNotification ?? 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              {isArabic ? "إشعار سدايا مطلوب" : "SDAIA Notification Required"}
            </CardTitle>
            <CardDescription className="text-red-700">
              {isArabic
                ? `${stats?.sdaiaPendingNotification} انتهاك(ات) تتطلب إشعار سدايا خلال 72 ساعة وفقاً للمادة 29 من PDPL`
                : `${stats?.sdaiaPendingNotification} breach(es) require SDAIA notification within 72 hours per PDPL Article 29`}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "إجمالي الانتهاكات" : "Total Breaches"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalBreaches ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "مفتوحة" : "Open"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{stats?.openBreaches ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "انتهاكات حرجة" : "Critical Breaches"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{stats?.criticalBreaches ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "متوسط الحل" : "Avg. Resolution"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.averageResolutionDays?.toFixed(1) ?? "-"}</p>
                <p className="text-xs text-muted-foreground">{isArabic ? "أيام" : "days"}</p>
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
          <div className="flex gap-4">
            <Select
              value={filters.status || "all"}
              onValueChange={(v) =>
                setFilters({ ...filters, status: v === "all" ? undefined : (v as BreachStatus) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "جميع الحالات" : "All Statuses"}</SelectItem>
                <SelectItem value="REPORTED">{isArabic ? "مُبلغ عنه" : "Reported"}</SelectItem>
                <SelectItem value="INVESTIGATING">{isArabic ? "قيد التحقيق" : "Investigating"}</SelectItem>
                <SelectItem value="CONTAINED">{isArabic ? "تم الاحتواء" : "Contained"}</SelectItem>
                <SelectItem value="RESOLVED">{isArabic ? "تم الحل" : "Resolved"}</SelectItem>
                <SelectItem value="CLOSED">{isArabic ? "مغلق" : "Closed"}</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Breaches Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "سجل الانتهاكات" : "Breach Register"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "جميع انتهاكات البيانات المسجلة"
              : "All recorded data breaches"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <DataTable
              columns={columns}
              data={breaches?.content ?? []}
              searchKey="title"
              searchPlaceholder={isArabic ? "البحث عن الانتهاكات..." : "Search breaches..."}
            />
          )}
        </CardContent>
      </Card>

      {/* View Breach Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تفاصيل الانتهاك" : "Breach Details"}</DialogTitle>
          </DialogHeader>
          {selectedBreach && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "رقم الانتهاك" : "Breach #"}</Label>
                  <p className="font-mono">{selectedBreach.breachNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "النوع" : "Type"}</Label>
                  <p>{isArabic ? breachTypeLabels[selectedBreach.breachType].ar : breachTypeLabels[selectedBreach.breachType].en}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "المصدر" : "Source"}</Label>
                  <p>{selectedBreach.breachSource ? (isArabic ? breachSourceLabels[selectedBreach.breachSource].ar : breachSourceLabels[selectedBreach.breachSource].en) : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "السجلات المتأثرة" : "Affected Records"}</Label>
                  <p>{selectedBreach.affectedRecordsCount?.toLocaleString() ?? "-"}</p>
                </div>
              </div>
              {selectedBreach.description && (
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "الوصف" : "Description"}</Label>
                  <p className="text-sm">{selectedBreach.description}</p>
                </div>
              )}
              {selectedBreach.rootCause && (
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "السبب الجذري" : "Root Cause"}</Label>
                  <p className="text-sm">{selectedBreach.rootCause}</p>
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

      {/* Resolve Breach Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? "حل الانتهاك" : "Resolve Breach"}</DialogTitle>
            <DialogDescription>
              {isArabic
                ? "أدخل السبب الجذري وإجراءات المعالجة"
                : "Enter the root cause and remediation actions"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isArabic ? "السبب الجذري" : "Root Cause"}</Label>
              <Textarea
                value={resolveForm.rootCause}
                onChange={(e) => setResolveForm({ ...resolveForm, rootCause: e.target.value })}
                placeholder={isArabic ? "ما الذي سبب هذا الانتهاك؟" : "What caused this breach?"}
              />
            </div>
            <div className="space-y-2">
              <Label>{isArabic ? "إجراءات المعالجة" : "Remediation Actions"}</Label>
              <Textarea
                value={resolveForm.remediation}
                onChange={(e) => setResolveForm({ ...resolveForm, remediation: e.target.value })}
                placeholder={isArabic ? "ما الإجراءات المتخذة لمنع التكرار؟" : "What actions were taken to prevent recurrence?"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolveForm.rootCause || !resolveForm.remediation || resolveBreach.isPending}
            >
              {isArabic ? "حل" : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SDAIA Notification Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? "تسجيل إشعار سدايا" : "Record SDAIA Notification"}</DialogTitle>
            <DialogDescription>
              {isArabic
                ? "أدخل رقم مرجع الإشعار المقدم لسدايا"
                : "Enter the notification reference number provided to SDAIA"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isArabic ? "رقم المرجع" : "Reference Number"}</Label>
              <Input
                value={sdaiaReference}
                onChange={(e) => setSdaiaReference(e.target.value)}
                placeholder={isArabic ? "مثل: SDAIA-2024-00123" : "e.g., SDAIA-2024-00123"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleNotifySdaia}
              disabled={!sdaiaReference || recordSdaiaNotification.isPending}
            >
              {isArabic ? "تسجيل" : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
