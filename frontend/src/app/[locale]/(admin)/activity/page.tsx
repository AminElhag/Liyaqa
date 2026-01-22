"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuditLogs } from "@/queries/use-audit";
import { getAuditColumns } from "@/components/admin/audit-columns";
import type { AuditAction, AuditActionCategory } from "@/types/audit";

const categoryOptions: {
  value: AuditActionCategory;
  labelEn: string;
  labelAr: string;
}[] = [
  { value: "ALL", labelEn: "All Actions", labelAr: "جميع الإجراءات" },
  { value: "AUTHENTICATION", labelEn: "Authentication", labelAr: "المصادقة" },
  { value: "MEMBER", labelEn: "Member", labelAr: "الأعضاء" },
  { value: "SUBSCRIPTION", labelEn: "Subscription", labelAr: "الاشتراكات" },
  { value: "BOOKING", labelEn: "Booking", labelAr: "الحجوزات" },
  { value: "INVOICE", labelEn: "Invoice", labelAr: "الفواتير" },
  { value: "SYSTEM", labelEn: "System", labelAr: "النظام" },
];

const entityTypeOptions = [
  { value: "all", labelEn: "All Types", labelAr: "جميع الأنواع" },
  { value: "User", labelEn: "User", labelAr: "مستخدم" },
  { value: "Member", labelEn: "Member", labelAr: "عضو" },
  { value: "Subscription", labelEn: "Subscription", labelAr: "اشتراك" },
  { value: "Invoice", labelEn: "Invoice", labelAr: "فاتورة" },
  { value: "Attendance", labelEn: "Attendance", labelAr: "حضور" },
  { value: "Booking", labelEn: "Booking", labelAr: "حجز" },
  { value: "Class", labelEn: "Class", labelAr: "فصل" },
];

export default function ActivityPage() {
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState<AuditActionCategory>("ALL");
  const [entityType, setEntityType] = useState("all");

  // Build query params
  const queryParams = useMemo(() => {
    const params: {
      page: number;
      size: number;
      action?: AuditAction;
      entityType?: string;
    } = {
      page,
      size: 20,
    };
    if (entityType && entityType !== "all") params.entityType = entityType;
    return params;
  }, [page, entityType]);

  const { data, isLoading, refetch } = useAuditLogs(queryParams);

  const columns = useMemo(() => getAuditColumns({ locale }), [locale]);

  const texts = {
    title: locale === "ar" ? "سجل النشاط" : "Activity Log",
    subtitle:
      locale === "ar"
        ? "تتبع جميع الإجراءات في النظام"
        : "Track all actions in the system",
    refresh: locale === "ar" ? "تحديث" : "Refresh",
    category: locale === "ar" ? "الفئة" : "Category",
    entityType: locale === "ar" ? "نوع الكيان" : "Entity Type",
    noActivity: locale === "ar" ? "لا يوجد نشاط" : "No activity found",
    mockDataNote:
      locale === "ar"
        ? "ملاحظة: يتم عرض بيانات تجريبية. سيتم ربط البيانات الحقيقية عند اكتمال واجهة برمجة التطبيقات."
        : "Note: Showing mock data. Real data will be connected when backend API is complete.",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Activity className="h-6 w-6" />
            {texts.title}
          </h1>
          <p className="text-neutral-500">{texts.subtitle}</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 me-2" />
          {texts.refresh}
        </Button>
      </div>

      {/* Mock Data Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        {texts.mockDataNote}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-[200px]">
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as AuditActionCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {locale === "ar" ? opt.labelAr : opt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder={texts.entityType} />
                </SelectTrigger>
                <SelectContent>
                  {entityTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {locale === "ar" ? opt.labelAr : opt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !data?.content?.length ? (
            <p className="text-center py-8 text-neutral-500">
              {texts.noActivity}
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={data.content}
              manualPagination
              pageCount={data.totalPages}
              pageIndex={page}
              pageSize={20}
              totalRows={data.totalElements}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
