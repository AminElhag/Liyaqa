"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Send,
  Download,
  DollarSign,
  XCircle,
  Building2,
  Calendar,
  FileText,
  Receipt,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { InvoiceStatusBadge } from "@/components/platform/invoice-status-badge";
import { RecordPaymentDialog } from "@/components/platform/record-payment-dialog";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useClientInvoice,
  useIssueClientInvoice,
  useCancelClientInvoice,
  useClientInvoicePdf,
} from "@liyaqa/shared/queries/platform/use-client-invoices";
import { usePlatformClient } from "@liyaqa/shared/queries/platform/use-platform-clients";
import type { LocalizedText, Money } from "@liyaqa/shared/types/api";

function getLocalizedText(text: LocalizedText | undefined, locale: string): string {
  if (!text) return "-";
  return locale === "ar" ? text.ar || text.en : text.en;
}

export default function ClientInvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Permissions
  const canEdit = user?.role === "PLATFORM_ADMIN";

  // Dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Data fetching
  const { data: invoice, isLoading, error } = useClientInvoice(invoiceId);
  const { data: organization } = usePlatformClient(invoice?.organizationId || "");

  // Mutations
  const issueInvoice = useIssueClientInvoice();
  const cancelInvoice = useCancelClientInvoice();
  const downloadPdf = useClientInvoicePdf();

  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    edit: locale === "ar" ? "تعديل" : "Edit",
    issue: locale === "ar" ? "إصدار" : "Issue",
    download: locale === "ar" ? "تحميل PDF" : "Download PDF",
    recordPayment: locale === "ar" ? "تسجيل دفعة" : "Record Payment",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    notFound: locale === "ar" ? "الفاتورة غير موجودة" : "Invoice not found",
    errorLoading:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",

    // Sections
    invoiceInfo: locale === "ar" ? "معلومات الفاتورة" : "Invoice Information",
    lineItems: locale === "ar" ? "بنود الفاتورة" : "Line Items",
    totals: locale === "ar" ? "الإجماليات" : "Totals",
    billingPeriod: locale === "ar" ? "فترة الفوترة" : "Billing Period",
    notes: locale === "ar" ? "الملاحظات" : "Notes",
    timestamps: locale === "ar" ? "التواريخ" : "Timestamps",

    // Fields
    invoiceNumber: locale === "ar" ? "رقم الفاتورة" : "Invoice Number",
    organization: locale === "ar" ? "المؤسسة" : "Organization",
    issueDate: locale === "ar" ? "تاريخ الإصدار" : "Issue Date",
    dueDate: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date",
    paidDate: locale === "ar" ? "تاريخ الدفع" : "Paid Date",
    description: locale === "ar" ? "الوصف" : "Description",
    quantity: locale === "ar" ? "الكمية" : "Qty",
    unitPrice: locale === "ar" ? "سعر الوحدة" : "Unit Price",
    lineTotal: locale === "ar" ? "المجموع" : "Total",
    subtotal: locale === "ar" ? "المجموع الفرعي" : "Subtotal",
    vatRate: locale === "ar" ? "نسبة الضريبة" : "VAT Rate",
    vatAmount: locale === "ar" ? "مبلغ الضريبة" : "VAT Amount",
    totalAmount: locale === "ar" ? "المبلغ الإجمالي" : "Total Amount",
    paidAmount: locale === "ar" ? "المبلغ المدفوع" : "Paid Amount",
    remainingBalance: locale === "ar" ? "المتبقي" : "Remaining Balance",
    periodStart: locale === "ar" ? "بداية الفترة" : "Period Start",
    periodEnd: locale === "ar" ? "نهاية الفترة" : "Period End",
    notesEn: locale === "ar" ? "ملاحظات (إنجليزي)" : "Notes (English)",
    notesAr: locale === "ar" ? "ملاحظات (عربي)" : "Notes (Arabic)",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created At",
    updatedAt: locale === "ar" ? "آخر تحديث" : "Last Updated",
    noNotes: locale === "ar" ? "لا توجد ملاحظات" : "No notes",
    notSet: locale === "ar" ? "غير محدد" : "Not set",

    // Actions
    issueSuccess: locale === "ar" ? "تم إصدار الفاتورة" : "Invoice issued",
    cancelSuccess: locale === "ar" ? "تم إلغاء الفاتورة" : "Invoice cancelled",
    cancelConfirm:
      locale === "ar"
        ? "هل أنت متأكد من إلغاء هذه الفاتورة؟"
        : "Are you sure you want to cancel this invoice?",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };

  const formatCurrency = (money: Money) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: money.currency,
      minimumFractionDigits: 2,
    }).format(money.amount);

  const formatDate = (dateString: string | undefined, includeTime = false) => {
    if (!dateString) return texts.notSet;
    return new Date(dateString).toLocaleDateString(
      locale === "ar" ? "ar-SA" : "en-SA",
      includeTime
        ? {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        : {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
    );
  };

  // Handlers
  const handleIssue = () => {
    issueInvoice.mutate(
      { id: invoiceId },
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

  const handleDownload = () => {
    downloadPdf.mutate(invoiceId, {
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleRecordPayment = () => {
    setPaymentDialogOpen(true);
  };

  const handleCancel = () => {
    if (!confirm(texts.cancelConfirm)) return;

    cancelInvoice.mutate(invoiceId, {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorLoading : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  const status = invoice.status;

  // Action availability based on status
  const canDownload = status !== "DRAFT";
  const canIssueInvoice = status === "DRAFT";
  const canRecordPaymentAction = ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(status);
  const canCancelInvoice = ["DRAFT", "ISSUED"].includes(status);
  const canEditInvoice = status === "DRAFT";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/client-invoices`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Receipt className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status} locale={locale} />
            </div>
            {organization && (
              <p className="mt-1 text-muted-foreground">
                {getLocalizedText(organization.name, locale)}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {canEditInvoice && (
              <Button variant="outline" asChild>
                <Link href={`/${locale}/client-invoices/${invoiceId}/edit`}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </Link>
              </Button>
            )}
            {canDownload && (
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={downloadPdf.isPending}
              >
                <Download className="me-2 h-4 w-4" />
                {texts.download}
              </Button>
            )}
            {canIssueInvoice && (
              <Button
                variant="outline"
                onClick={handleIssue}
                disabled={issueInvoice.isPending}
              >
                <Send className="me-2 h-4 w-4 text-blue-600" />
                {texts.issue}
              </Button>
            )}
            {canRecordPaymentAction && (
              <Button variant="outline" onClick={handleRecordPayment}>
                <DollarSign className="me-2 h-4 w-4 text-green-600" />
                {texts.recordPayment}
              </Button>
            )}
            {canCancelInvoice && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelInvoice.isPending}
              >
                <XCircle className="me-2 h-4 w-4" />
                {texts.cancel}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invoice Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>{texts.invoiceInfo}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.invoiceNumber}</p>
                <p className="font-mono font-medium">{invoice.invoiceNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.organization}</p>
                <p className="font-medium">
                  {organization
                    ? getLocalizedText(organization.name, locale)
                    : invoice.organizationId.slice(0, 8)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.issueDate}</p>
                <p className="font-medium">{formatDate(invoice.issueDate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.dueDate}</p>
                <p className={`font-medium ${invoice.isOverdue ? "text-destructive" : ""}`}>
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            </div>
            {invoice.paidDate && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.paidDate}</p>
                <p className="font-medium text-green-600">{formatDate(invoice.paidDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totals Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>{texts.totals}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{texts.subtotal}</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {texts.vatAmount} ({invoice.vatRate}%)
                </span>
                <span className="font-medium">{formatCurrency(invoice.vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">{texts.totalAmount}</span>
                <span className="font-bold text-lg">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
            {invoice.paidAmount && invoice.paidAmount.amount > 0 && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.paidAmount}</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(invoice.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">{texts.remainingBalance}</span>
                  <span
                    className={`font-bold ${
                      invoice.remainingBalance.amount > 0 ? "text-amber-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(invoice.remainingBalance)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <CardTitle>{texts.lineItems}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-start text-sm font-medium text-muted-foreground">
                      {texts.description}
                    </th>
                    <th className="py-2 text-center text-sm font-medium text-muted-foreground">
                      {texts.quantity}
                    </th>
                    <th className="py-2 text-end text-sm font-medium text-muted-foreground">
                      {texts.unitPrice}
                    </th>
                    <th className="py-2 text-end text-sm font-medium text-muted-foreground">
                      {texts.lineTotal}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3">
                        <p className="font-medium">
                          {getLocalizedText(item.description, locale)}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.itemType}</p>
                      </td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-end">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-end font-medium">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Billing Period Card */}
        {(invoice.billingPeriodStart || invoice.billingPeriodEnd) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>{texts.billingPeriod}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{texts.periodStart}</p>
                  <p className="font-medium">{formatDate(invoice.billingPeriodStart)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{texts.periodEnd}</p>
                  <p className="font-medium">{formatDate(invoice.billingPeriodEnd)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes Card */}
        {invoice.notes && (invoice.notes.en || invoice.notes.ar) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>{texts.notes}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {invoice.notes.en && (
                <div>
                  <p className="text-sm text-muted-foreground">{texts.notesEn}</p>
                  <p className="mt-1 whitespace-pre-wrap">{invoice.notes.en}</p>
                </div>
              )}
              {invoice.notes.ar && (
                <div>
                  <p className="text-sm text-muted-foreground">{texts.notesAr}</p>
                  <p className="mt-1 whitespace-pre-wrap" dir="rtl">
                    {invoice.notes.ar}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timestamps Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>{texts.timestamps}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.createdAt}</p>
                  <p className="font-medium">{formatDate(invoice.createdAt, true)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.updatedAt}</p>
                  <p className="font-medium">{formatDate(invoice.updatedAt, true)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <RecordPaymentDialog
        invoice={invoice}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />
    </div>
  );
}
