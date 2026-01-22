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
  DollarSign,
  Calendar,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { LocalizedText } from "@/components/ui/localized-text";
import { Loading } from "@/components/ui/spinner";
import {
  useInvoices,
  useDeleteInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useDownloadInvoicePdf,
} from "@/queries";
import type { Invoice, InvoiceStatus } from "@/types/billing";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function InvoicesPage() {
  const locale = useLocale();
  const router = useRouter();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">(
    "ALL"
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch invoices
  const { data, isLoading, error } = useInvoices({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    size: pageSize,
  });

  // Mutations
  const deleteInvoice = useDeleteInvoice();
  const issueInvoice = useIssueInvoice();
  const cancelInvoice = useCancelInvoice();
  const downloadPdf = useDownloadInvoicePdf();

  const texts = {
    title: locale === "ar" ? "الفواتير" : "Invoices",
    description:
      locale === "ar" ? "إدارة فواتير الأعضاء" : "Manage member invoices",
    newInvoice: locale === "ar" ? "فاتورة جديدة" : "New Invoice",
    status: locale === "ar" ? "الحالة" : "Status",
    all: locale === "ar" ? "الكل" : "All",
    draft: locale === "ar" ? "مسودة" : "Draft",
    issued: locale === "ar" ? "صادرة" : "Issued",
    paid: locale === "ar" ? "مدفوعة" : "Paid",
    partiallyPaid: locale === "ar" ? "مدفوعة جزئياً" : "Partially Paid",
    overdue: locale === "ar" ? "متأخرة" : "Overdue",
    cancelled: locale === "ar" ? "ملغاة" : "Cancelled",
    invoiceNumber: locale === "ar" ? "رقم الفاتورة" : "Invoice #",
    member: locale === "ar" ? "العضو" : "Member",
    amount: locale === "ar" ? "المبلغ" : "Amount",
    dueDate: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    download: locale === "ar" ? "تحميل PDF" : "Download PDF",
    issue: locale === "ar" ? "إصدار" : "Issue",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    recordPayment: locale === "ar" ? "تسجيل دفعة" : "Record Payment",
    delete: locale === "ar" ? "حذف" : "Delete",
    noInvoices: locale === "ar" ? "لا توجد فواتير" : "No invoices found",
    error:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل الفواتير"
        : "Error loading invoices",
  };

  // Table columns
  const columns: ColumnDef<Invoice>[] = useMemo(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: texts.invoiceNumber,
        cell: ({ row }) => (
          <span className="font-mono font-medium">
            {row.original.invoiceNumber}
          </span>
        ),
      },
      {
        accessorKey: "memberName",
        header: texts.member,
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
        accessorKey: "totalAmount",
        header: texts.amount,
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
                  {locale === "ar" ? "المدفوع:" : "Paid:"}{" "}
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
        accessorKey: "dueDate",
        header: texts.dueDate,
        cell: ({ row }) =>
          row.original.dueDate ? (
            formatDate(row.original.dueDate, locale)
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "status",
        header: texts.status,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} locale={locale} />
        ),
      },
      {
        id: "actions",
        header: texts.actions,
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
                <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/${locale}/invoices/${invoice.id}`)
                  }
                >
                  <Eye className="me-2 h-4 w-4" />
                  {texts.view}
                </DropdownMenuItem>
                {invoice.status !== "DRAFT" && (
                  <DropdownMenuItem
                    onClick={() => downloadPdf.mutate(invoice.id)}
                    disabled={downloadPdf.isPending}
                  >
                    <Download className="me-2 h-4 w-4" />
                    {texts.download}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {invoice.status === "DRAFT" && (
                  <DropdownMenuItem
                    onClick={() => issueInvoice.mutate(invoice.id)}
                  >
                    <Send className="me-2 h-4 w-4" />
                    {texts.issue}
                  </DropdownMenuItem>
                )}
                {(invoice.status === "ISSUED" ||
                  invoice.status === "PARTIALLY_PAID" ||
                  invoice.status === "OVERDUE") && (
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/${locale}/invoices/${invoice.id}/pay`)
                    }
                  >
                    <DollarSign className="me-2 h-4 w-4" />
                    {texts.recordPayment}
                  </DropdownMenuItem>
                )}
                {(invoice.status === "DRAFT" ||
                  invoice.status === "ISSUED") && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      if (
                        confirm(
                          locale === "ar"
                            ? "هل أنت متأكد من إلغاء هذه الفاتورة؟"
                            : "Are you sure you want to cancel this invoice?"
                        )
                      ) {
                        cancelInvoice.mutate(invoice.id);
                      }
                    }}
                  >
                    <XCircle className="me-2 h-4 w-4" />
                    {texts.cancel}
                  </DropdownMenuItem>
                )}
                {invoice.status === "DRAFT" && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      if (
                        confirm(
                          locale === "ar"
                            ? "هل أنت متأكد من حذف هذه الفاتورة؟"
                            : "Are you sure you want to delete this invoice?"
                        )
                      ) {
                        deleteInvoice.mutate(invoice.id);
                      }
                    }}
                  >
                    {texts.delete}
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
      texts,
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
          {texts.error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/invoices/new`}>
            <Plus className="me-2 h-4 w-4" />
            {texts.newInvoice}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as InvoiceStatus | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="DRAFT">{texts.draft}</SelectItem>
                <SelectItem value="ISSUED">{texts.issued}</SelectItem>
                <SelectItem value="PAID">{texts.paid}</SelectItem>
                <SelectItem value="PARTIALLY_PAID">
                  {texts.partiallyPaid}
                </SelectItem>
                <SelectItem value="OVERDUE">{texts.overdue}</SelectItem>
                <SelectItem value="CANCELLED">{texts.cancelled}</SelectItem>
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
