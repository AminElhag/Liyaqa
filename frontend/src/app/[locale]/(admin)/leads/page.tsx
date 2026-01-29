"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Plus, Users, RefreshCw, Filter, LayoutGrid, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { getLeadColumns } from "@/components/admin/lead-columns";
import {
  useLeads,
  useDeleteLead,
  useMarkLeadContacted,
  useTransitionLeadStatus,
  usePipelineStats,
} from "@/queries/use-leads";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Lead, LeadStatus, LeadSource } from "@/types/lead";
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, LEAD_STATUS_COLORS } from "@/types/lead";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function LeadsPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "">("");
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);

  const { data, isLoading, refetch } = useLeads({
    page,
    size: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
  });
  const { data: stats } = usePipelineStats();
  const deleteMutation = useDeleteLead();
  const contactMutation = useMarkLeadContacted();
  const transitionMutation = useTransitionLeadStatus();

  const handleView = (lead: Lead) => {
    router.push(`/${locale}/leads/${lead.id}`);
  };

  const handleEdit = (lead: Lead) => {
    router.push(`/${locale}/leads/${lead.id}?edit=true`);
  };

  const handleDelete = async () => {
    if (!deleteLead) return;
    try {
      await deleteMutation.mutateAsync(deleteLead.id);
      toast.success(isArabic ? "تم حذف العميل المحتمل" : "Lead deleted");
    } catch {
      toast.error(isArabic ? "فشل في الحذف" : "Failed to delete");
    } finally {
      setDeleteLead(null);
    }
  };

  const handleContact = async (lead: Lead) => {
    try {
      await contactMutation.mutateAsync(lead.id);
      toast.success(isArabic ? "تم تحديث الحالة" : "Status updated");
    } catch {
      toast.error(isArabic ? "فشل في التحديث" : "Failed to update");
    }
  };

  const handleTransition = async (lead: Lead, status: LeadStatus) => {
    try {
      await transitionMutation.mutateAsync({ id: lead.id, data: { status } });
      toast.success(isArabic ? "تم تحديث الحالة" : "Status updated");
    } catch {
      toast.error(isArabic ? "فشل في التحديث" : "Failed to update");
    }
  };

  const columns = getLeadColumns({
    isArabic,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: setDeleteLead,
    onContact: handleContact,
    onTransition: handleTransition,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "العملاء المحتملون" : "Leads"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة قمع المبيعات والعملاء المحتملين"
              : "Manage your sales pipeline and prospects"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/leads/dashboard`}>
            <Button variant="outline" size="icon" title={isArabic ? "لوحة المبيعات" : "Sales Dashboard"}>
              <BarChart3 className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/leads/pipeline`}>
            <Button variant="outline" size="icon" title={isArabic ? "عرض كانبان" : "Kanban View"}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href={`/${locale}/leads/new`}>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {isArabic ? "إضافة عميل محتمل" : "Add Lead"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Pipeline Stats */}
      {stats && (
        <div className="grid md:grid-cols-7 gap-4">
          {Object.entries(LEAD_STATUS_LABELS).map(([status, label]) => {
            const count = stats.byStatus[status as LeadStatus] || 0;
            return (
              <Card
                key={status}
                className={`cursor-pointer transition-colors hover:border-primary ${
                  statusFilter === status ? "border-primary" : ""
                }`}
                onClick={() => setStatusFilter(statusFilter === status ? "" : (status as LeadStatus))}
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={LEAD_STATUS_COLORS[status as LeadStatus]}>
                      {isArabic ? label.ar : label.en}
                    </Badge>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {isArabic ? "البحث والتصفية" : "Search & Filter"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              placeholder={isArabic ? "البحث بالاسم أو البريد الإلكتروني..." : "Search by name or email..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={statusFilter || "ALL"}
              onValueChange={(value) => setStatusFilter(value === "ALL" ? "" : value as LeadStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder={isArabic ? "جميع الحالات" : "All Statuses"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{isArabic ? "جميع الحالات" : "All Statuses"}</SelectItem>
                {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {isArabic ? label.ar : label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sourceFilter || "ALL"}
              onValueChange={(value) => setSourceFilter(value === "ALL" ? "" : value as LeadSource)}
            >
              <SelectTrigger>
                <SelectValue placeholder={isArabic ? "جميع المصادر" : "All Sources"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{isArabic ? "جميع المصادر" : "All Sources"}</SelectItem>
                {Object.entries(LEAD_SOURCE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {isArabic ? label.ar : label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isArabic ? "العملاء المحتملون" : "Leads"}
          </CardTitle>
          <CardDescription>
            {stats
              ? isArabic
                ? `${stats.total} عميل محتمل، ${stats.active} نشط`
                : `${stats.total} total leads, ${stats.active} active`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.content ?? []}
            isLoading={isLoading}
            pageCount={data?.totalPages ?? 0}
            pageIndex={page}
            onPageChange={setPage}
            manualPagination
          />
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteLead} onOpenChange={() => setDeleteLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabic ? "حذف العميل المحتمل؟" : "Delete Lead?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? `هل أنت متأكد من حذف "${deleteLead?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${deleteLead?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isArabic ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
