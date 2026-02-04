"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { getInvoiceColumns } from "@liyaqa/shared/components/platform/invoice-columns";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useClientInvoices,
  useClientInvoiceStats,
  useIssueClientInvoice,
  useCancelClientInvoice,
  useClientInvoicePdf,
} from "@liyaqa/shared/queries/platform/use-client-invoices";
import type {
  ClientInvoiceSummary,
  ClientInvoiceStatus,
} from "@liyaqa/shared/types/platform/client-invoice";

type StatusFilter = "ALL" | ClientInvoiceStatus;

export default function ClientInvoicesPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Permissions
  const canEdit = user?.role === "PLATFORM_ADMIN";

  // Query params
  const queryParams = {
    page,
    size: pageSize,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    sortBy: "createdAt",
    sortDirection: "desc" as const,
  };

  // Data fetching
  const { data, isLoading, error } = useClientInvoices(queryParams);
  const { data: stats } = useClientInvoiceStats();

  // Mutations
  const issueInvoice = useIssueClientInvoice();
  const cancelInvoice = useCancelClientInvoice();
  const downloadPdf = useClientInvoicePdf();

  // Bilingual texts
  const texts = {
    title: locale === "ar" ? "فواتير العملاء" : "Client Invoices",
    description:
      locale === "ar"
        ? "إدارة فواتير العملاء في المنصة"
        : "Manage client invoices for the platform",
    newInvoice: locale === "ar" ? "فاتورة جديدة" : "New Invoice",
    total: locale === "ar" ? "الإجمالي" : "Total",
    draft: locale === "ar" ? "مسودة" : "Draft",
    issued: locale === "ar" ? "صادرة" : "Issued",
    paid: locale === "ar" ? "مدفوعة" : "Paid",
    partiallyPaid: locale === "ar" ? "مدفوعة جزئياً" : "Partially Paid",
    overdue: locale === "ar" ? "متأخرة" : "Overdue",
    cancelled: locale === "ar" ? "ملغاة" : "Cancelled",
    filterStatus: locale === "ar" ? "تصفية بالحالة" : "Filter by Status",
    all: locale === "ar" ? "الكل" : "All",
    noInvoices: locale === "ar" ? "لا توجد فواتير" : "No invoices found",
    loadingError:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    issueSuccess: locale === "ar" ? "تم إصدار الفاتورة" : "Invoice issued",
    cancelSuccess: locale === "ar" ? "تم إلغاء الفاتورة" : "Invoice cancelled",
    cancelConfirm:
      locale === "ar"
        ? "هل أنت متأكد من إلغاء هذه الفاتورة؟"
        : "Are you sure you want to cancel this invoice?",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    recordPaymentComingSoon:
      locale === "ar"
        ? "سيتم تنفيذ تسجيل الدفعة قريباً"
        : "Record payment will be implemented soon",
  };

  // Handlers
  const handleView = (invoice: ClientInvoiceSummary) => {
    router.push(`/${locale}/client-invoices/${invoice.id}`);
  };

  const handleDownloadPdf = (invoice: ClientInvoiceSummary) => {
    downloadPdf.mutate(invoice.id, {
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleIssue = (invoice: ClientInvoiceSummary) => {
    issueInvoice.mutate(
      { id: invoice.id },
      {
        onSuccess: () => {
          toast({ title: texts.issueSuccess });
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleRecordPayment = (invoice: ClientInvoiceSummary) => {
    // Navigate to detail page where payment can be recorded
    router.push(`/${locale}/client-invoices/${invoice.id}`);
  };

  const handleCancel = (invoice: ClientInvoiceSummary) => {
    if (!confirm(texts.cancelConfirm)) return;

    cancelInvoice.mutate(invoice.id, {
      onSuccess: () => {
        toast({ title: texts.cancelSuccess });
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Columns
  const columns = useMemo(
    () =>
      getInvoiceColumns({
        locale,
        onView: handleView,
        onDownloadPdf: handleDownloadPdf,
        onIssue: handleIssue,
        onRecordPayment: handleRecordPayment,
        onCancel: handleCancel,
        canEdit,
      }),
    [locale, canEdit]
  );

  // Data
  const invoices = data?.content || [];
  const totalElements = data?.totalElements || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {texts.loadingError}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/${locale}/client-invoices/new`}>
              <Plus className="me-2 h-4 w-4" />
              {texts.newInvoice}
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.total}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.draft}</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-500">
              {stats?.draft || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.issued}</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.issued || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.paid}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.paid || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.partiallyPaid}</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.partiallyPaid || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.overdue}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.overdue || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.cancelled}</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">
              {stats?.cancelled || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as StatusFilter);
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.filterStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="DRAFT">{texts.draft}</SelectItem>
                  <SelectItem value="ISSUED">{texts.issued}</SelectItem>
                  <SelectItem value="PAID">{texts.paid}</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">{texts.partiallyPaid}</SelectItem>
                  <SelectItem value="OVERDUE">{texts.overdue}</SelectItem>
                  <SelectItem value="CANCELLED">{texts.cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loading />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {texts.noInvoices}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={invoices}
              manualPagination
              pageCount={data?.totalPages || 1}
              pageIndex={page}
              pageSize={pageSize}
              totalRows={totalElements}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
