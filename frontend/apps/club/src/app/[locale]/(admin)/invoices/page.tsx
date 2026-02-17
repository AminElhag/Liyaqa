"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Eye,
  FileText,
  Send,
  XCircle,
  CreditCard,
  Download,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  useInvoices,
  useInvoiceSummary,
  useDeleteInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useDownloadInvoicePdf,
} from "@liyaqa/shared/queries";
import type { Invoice, InvoiceStatus } from "@liyaqa/shared/types/billing";
import { formatDate, formatCurrency } from "@liyaqa/shared/utils";

export default function InvoicesPage() {
  const locale = useLocale();
  const router = useRouter();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">(
    "ALL"
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Fetch invoices
  const { data, isLoading, error } = useInvoices({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    search: search || undefined,
    page,
    size: pageSize,
  });

  // Fetch summary
  const { data: summary } = useInvoiceSummary();

  // Mutations
  const deleteInvoice = useDeleteInvoice();
  const issueInvoice = useIssueInvoice();
  const cancelInvoice = useCancelInvoice();
  const downloadPdf = useDownloadInvoicePdf();

  const t = {
    title: locale === "ar" ? "الفواتير" : "Invoices",
    description:
      locale === "ar"
        ? "إنشاء وإدارة وتتبع الفواتير"
        : "Create, manage, and track invoices",
    newInvoice: locale === "ar" ? "فاتورة جديدة" : "New Invoice",
    status: locale === "ar" ? "الحالة" : "Status",
    all: locale === "ar" ? "جميع الحالات" : "All Statuses",
    draft: locale === "ar" ? "مسودة" : "Draft",
    issued: locale === "ar" ? "صادرة" : "Issued",
    paid: locale === "ar" ? "مدفوعة" : "Paid",
    partiallyPaid: locale === "ar" ? "مدفوعة جزئياً" : "Partially Paid",
    overdue: locale === "ar" ? "متأخرة" : "Overdue",
    cancelled: locale === "ar" ? "ملغاة" : "Cancelled",
    invoiceNumber: locale === "ar" ? "رقم الفاتورة" : "Invoice #",
    member: locale === "ar" ? "العضو" : "Member",
    total: locale === "ar" ? "الإجمالي" : "Total",
    issueDate: locale === "ar" ? "تاريخ الإصدار" : "Issue Date",
    dueDate: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date",
    remaining: locale === "ar" ? "المتبقي" : "Remaining",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    download: locale === "ar" ? "تحميل PDF" : "Download PDF",
    issue: locale === "ar" ? "إصدار" : "Issue",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    recordPayment: locale === "ar" ? "تسجيل دفعة" : "Record Payment",
    delete: locale === "ar" ? "حذف" : "Delete",
    search: locale === "ar" ? "بحث في الفواتير..." : "Search invoices...",
    noInvoices: locale === "ar" ? "لا توجد فواتير" : "No invoices found",
    error:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل الفواتير"
        : "Error loading invoices",
    paidLabel: locale === "ar" ? "المدفوع:" : "Paid:",
    confirmCancel:
      locale === "ar"
        ? "هل أنت متأكد من إلغاء هذه الفاتورة؟"
        : "Are you sure you want to cancel this invoice?",
    confirmDelete:
      locale === "ar"
        ? "هل أنت متأكد من حذف هذه الفاتورة؟"
        : "Are you sure you want to delete this invoice?",
  };

  // Table columns
  const columns: ColumnDef<Invoice>[] = useMemo(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: t.invoiceNumber,
        cell: ({ row }) => (
          <Link
            href={`/${locale}/invoices/${row.original.id}`}
            className="font-mono font-medium text-primary hover:underline"
          >
            {row.original.invoiceNumber}
          </Link>
        ),
      },
      {
        accessorKey: "memberName",
        header: t.member,
        cell: ({ row }) => (
          <Link
            href={`/${locale}/members/${row.original.memberId}`}
            className="hover:underline"
          >
            <p className="font-medium">
              {row.original.memberName ? (
                <LocalizedText text={row.original.memberName} />
              ) : (
                <span className="text-muted-foreground">
                  {row.original.memberId.slice(0, 8)}...
                </span>
              )}
            </p>
            {row.original.memberEmail && (
              <p className="text-sm text-muted-foreground">
                {row.original.memberEmail}
              </p>
            )}
          </Link>
        ),
      },
      {
        accessorKey: "status",
        header: t.status,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} locale={locale} />
        ),
      },
      {
        accessorKey: "issueDate",
        header: t.issueDate,
        cell: ({ row }) =>
          row.original.issueDate ? (
            formatDate(row.original.issueDate, locale)
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "dueDate",
        header: t.dueDate,
        cell: ({ row }) =>
          row.original.dueDate ? (
            formatDate(row.original.dueDate, locale)
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "totalAmount",
        header: t.total,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              {formatCurrency(
                row.original.totalAmount.amount,
                row.original.totalAmount.currency,
                locale
              )}
            </p>
            {row.original.paidAmount &&
              row.original.paidAmount.amount > 0 &&
              row.original.paidAmount.amount <
                row.original.totalAmount.amount && (
                <p className="text-sm text-muted-foreground">
                  {t.paidLabel}{" "}
                  {formatCurrency(
                    row.original.paidAmount.amount,
                    row.original.paidAmount.currency,
                    locale
                  )}
                </p>
              )}
          </div>
        ),
      },
      {
        accessorKey: "remainingBalance",
        header: t.remaining,
        cell: ({ row }) => (
          <span
            className={
              row.original.remainingBalance.amount > 0
                ? "font-medium text-amber-600"
                : "text-muted-foreground"
            }
          >
            {formatCurrency(
              row.original.remainingBalance.amount,
              row.original.remainingBalance.currency,
              locale
            )}
          </span>
        ),
      },
      {
        id: "actions",
        header: t.actions,
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
                <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/${locale}/invoices/${invoice.id}`)
                  }
                >
                  <Eye className="me-2 h-4 w-4" />
                  {t.view}
                </DropdownMenuItem>
                {invoice.status !== "DRAFT" && (
                  <DropdownMenuItem
                    onClick={() => downloadPdf.mutate(invoice.id)}
                    disabled={downloadPdf.isPending}
                  >
                    <Download className="me-2 h-4 w-4" />
                    {t.download}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {invoice.status === "DRAFT" && (
                  <DropdownMenuItem
                    onClick={() => issueInvoice.mutate(invoice.id)}
                  >
                    <Send className="me-2 h-4 w-4" />
                    {t.issue}
                  </DropdownMenuItem>
                )}
                {(invoice.status === "ISSUED" ||
                  invoice.status === "PARTIALLY_PAID" ||
                  invoice.status === "OVERDUE") && (
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/${locale}/invoices/${invoice.id}`)
                    }
                  >
                    <CreditCard className="me-2 h-4 w-4" />
                    {t.recordPayment}
                  </DropdownMenuItem>
                )}
                {(invoice.status === "DRAFT" ||
                  invoice.status === "ISSUED" ||
                  invoice.status === "OVERDUE") && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(t.confirmCancel)) {
                        cancelInvoice.mutate(invoice.id);
                      }
                    }}
                  >
                    <XCircle className="me-2 h-4 w-4" />
                    {t.cancel}
                  </DropdownMenuItem>
                )}
                {(invoice.status === "DRAFT" ||
                  invoice.status === "CANCELLED") && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(t.confirmDelete)) {
                        deleteInvoice.mutate(invoice.id);
                      }
                    }}
                  >
                    <Trash2 className="me-2 h-4 w-4" />
                    {t.delete}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      locale,
      t,
      router,
      deleteInvoice,
      issueInvoice,
      cancelInvoice,
      downloadPdf,
    ]
  );

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {t.error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/invoices/new`}>
            <Plus className="me-2 h-4 w-4" />
            {t.newInvoice}
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.draft}</p>
                  <p className="text-2xl font-bold">{summary.draftCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.issued}</p>
                  <p className="text-2xl font-bold">{summary.pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.overdue}</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {summary.overdueCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.paid}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.paidCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={t.search}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full sm:w-[280px]"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as InvoiceStatus | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t.all}</SelectItem>
                <SelectItem value="DRAFT">{t.draft}</SelectItem>
                <SelectItem value="ISSUED">{t.issued}</SelectItem>
                <SelectItem value="PAID">{t.paid}</SelectItem>
                <SelectItem value="PARTIALLY_PAID">
                  {t.partiallyPaid}
                </SelectItem>
                <SelectItem value="OVERDUE">{t.overdue}</SelectItem>
                <SelectItem value="CANCELLED">{t.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loading />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data?.content || []}
              manualPagination
              pageCount={data?.totalPages || 1}
              pageIndex={page}
              pageSize={pageSize}
              totalRows={data?.totalElements}
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
