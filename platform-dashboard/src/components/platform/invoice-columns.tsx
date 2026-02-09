import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Download, Send, DollarSign, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import type { ClientInvoiceSummary, Money } from "@/types";

interface GetInvoiceColumnsOptions {
  locale: string;
  onView: (invoice: ClientInvoiceSummary) => void;
  onDownloadPdf: (invoice: ClientInvoiceSummary) => void;
  onIssue: (invoice: ClientInvoiceSummary) => void;
  onRecordPayment: (invoice: ClientInvoiceSummary) => void;
  onCancel: (invoice: ClientInvoiceSummary) => void;
  canEdit: boolean;
}

export function getInvoiceColumns({
  locale,
  onView,
  onDownloadPdf,
  onIssue,
  onRecordPayment,
  onCancel,
  canEdit,
}: GetInvoiceColumnsOptions): ColumnDef<ClientInvoiceSummary>[] {
  const texts = {
    invoiceNumber: locale === "ar" ? "رقم الفاتورة" : "Invoice #",
    organization: locale === "ar" ? "المؤسسة" : "Organization",
    totalAmount: locale === "ar" ? "المبلغ الإجمالي" : "Total Amount",
    dueDate: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date",
    status: locale === "ar" ? "الحالة" : "Status",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    downloadPdf: locale === "ar" ? "تحميل PDF" : "Download PDF",
    issue: locale === "ar" ? "إصدار" : "Issue",
    recordPayment: locale === "ar" ? "تسجيل دفعة" : "Record Payment",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    notSet: locale === "ar" ? "غير محدد" : "Not set",
  };

  const formatMoney = (money: Money) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: money.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(money.amount);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return texts.notSet;
    return new Date(dateString).toLocaleDateString(
      locale === "ar" ? "ar-SA" : "en-SA",
      { year: "numeric", month: "short", day: "numeric" }
    );
  };

  return [
    {
      accessorKey: "invoiceNumber",
      header: texts.invoiceNumber,
      cell: ({ row }) => (
        <span className="font-mono font-medium text-primary">
          {row.original.invoiceNumber}
        </span>
      ),
    },
    {
      accessorKey: "organizationId",
      header: texts.organization,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.organizationId.slice(0, 8)}...
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: texts.totalAmount,
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatMoney(row.original.totalAmount)}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: texts.dueDate,
      cell: ({ row }) => (
        <span className={row.original.isOverdue ? "text-destructive font-medium" : ""}>
          {formatDate(row.original.dueDate)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => (
        <InvoiceStatusBadge status={row.original.status} />
      ),
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const invoice = row.original;
        const status = invoice.status;

        // Determine available actions based on status
        const canDownload = status !== "DRAFT";
        const canIssueInvoice = status === "DRAFT";
        const canRecordPaymentAction = ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(status);
        const canCancelInvoice = ["DRAFT", "ISSUED"].includes(status);

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
              <DropdownMenuItem onClick={() => onView(invoice)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              {canDownload && (
                <DropdownMenuItem onClick={() => onDownloadPdf(invoice)}>
                  <Download className="me-2 h-4 w-4" />
                  {texts.downloadPdf}
                </DropdownMenuItem>
              )}
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  {canIssueInvoice && (
                    <DropdownMenuItem onClick={() => onIssue(invoice)}>
                      <Send className="me-2 h-4 w-4 text-blue-600" />
                      {texts.issue}
                    </DropdownMenuItem>
                  )}
                  {canRecordPaymentAction && (
                    <DropdownMenuItem onClick={() => onRecordPayment(invoice)}>
                      <DollarSign className="me-2 h-4 w-4 text-green-600" />
                      {texts.recordPayment}
                    </DropdownMenuItem>
                  )}
                  {canCancelInvoice && (
                    <DropdownMenuItem
                      onClick={() => onCancel(invoice)}
                      className="text-destructive"
                    >
                      <XCircle className="me-2 h-4 w-4" />
                      {texts.cancel}
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
