"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  Download,
  Send,
  XCircle,
  DollarSign,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocalizedText } from "@/components/ui/localized-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { Loading } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  useInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useDownloadInvoicePdf,
} from "@/queries";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function InvoiceDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: invoice, isLoading, error } = useInvoice(id);

  const issueInvoice = useIssueInvoice();
  const cancelInvoice = useCancelInvoice();
  const downloadPdf = useDownloadInvoicePdf();

  const texts = {
    back: locale === "ar" ? "العودة للفواتير" : "Back to Invoices",
    invoiceDetails: locale === "ar" ? "تفاصيل الفاتورة" : "Invoice Details",
    invoiceNumber: locale === "ar" ? "رقم الفاتورة" : "Invoice Number",
    issueDate: locale === "ar" ? "تاريخ الإصدار" : "Issue Date",
    dueDate: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date",
    status: locale === "ar" ? "الحالة" : "Status",
    member: locale === "ar" ? "العضو" : "Member",
    lineItems: locale === "ar" ? "البنود" : "Line Items",
    description: locale === "ar" ? "الوصف" : "Description",
    quantity: locale === "ar" ? "الكمية" : "Quantity",
    unitPrice: locale === "ar" ? "سعر الوحدة" : "Unit Price",
    total: locale === "ar" ? "المجموع" : "Total",
    subtotal: locale === "ar" ? "المجموع الفرعي" : "Subtotal",
    vat: locale === "ar" ? "ضريبة القيمة المضافة" : "VAT",
    totalAmount: locale === "ar" ? "المبلغ الإجمالي" : "Total Amount",
    paidAmount: locale === "ar" ? "المبلغ المدفوع" : "Paid Amount",
    remainingBalance: locale === "ar" ? "المبلغ المتبقي" : "Remaining Balance",
    notes: locale === "ar" ? "ملاحظات" : "Notes",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    download: locale === "ar" ? "تحميل PDF" : "Download PDF",
    issue: locale === "ar" ? "إصدار الفاتورة" : "Issue Invoice",
    cancel: locale === "ar" ? "إلغاء الفاتورة" : "Cancel Invoice",
    recordPayment: locale === "ar" ? "تسجيل دفعة" : "Record Payment",
    error:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل الفاتورة"
        : "Error loading invoice",
    notIssued: locale === "ar" ? "لم تصدر بعد" : "Not issued yet",
    noDueDate:
      locale === "ar" ? "لم يحدد تاريخ استحقاق" : "No due date set",
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
          {texts.error}
        </CardContent>
      </Card>
    );
  }

  const currency = invoice.totalAmount.currency;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/invoices`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">
              {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} locale={locale} />
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status !== "DRAFT" && (
            <Button
              variant="outline"
              onClick={() => downloadPdf.mutate(invoice.id)}
              disabled={downloadPdf.isPending}
            >
              <Download className="me-2 h-4 w-4" />
              {texts.download}
            </Button>
          )}
          {invoice.status === "DRAFT" && (
            <Button
              onClick={() => issueInvoice.mutate(invoice.id)}
              disabled={issueInvoice.isPending}
            >
              <Send className="me-2 h-4 w-4" />
              {texts.issue}
            </Button>
          )}
          {(invoice.status === "ISSUED" ||
            invoice.status === "PARTIALLY_PAID" ||
            invoice.status === "OVERDUE") && (
            <Button asChild>
              <Link href={`/${locale}/invoices/${id}/pay`}>
                <DollarSign className="me-2 h-4 w-4" />
                {texts.recordPayment}
              </Link>
            </Button>
          )}
          {(invoice.status === "DRAFT" || invoice.status === "ISSUED") && (
            <Button
              variant="destructive"
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
              disabled={cancelInvoice.isPending}
            >
              <XCircle className="me-2 h-4 w-4" />
              {texts.cancel}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {texts.invoiceDetails}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {texts.invoiceNumber}
                </p>
                <p className="font-mono">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {texts.status}
                </p>
                <StatusBadge status={invoice.status} locale={locale} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {texts.issueDate}
                  </p>
                  <p>
                    {invoice.issueDate
                      ? formatDate(invoice.issueDate, locale)
                      : texts.notIssued}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {texts.dueDate}
                  </p>
                  <p>
                    {invoice.dueDate
                      ? formatDate(invoice.dueDate, locale)
                      : texts.noDueDate}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {texts.member}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/${locale}/members/${invoice.memberId}`}
              className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <p className="font-medium text-lg">
                <LocalizedText text={invoice.memberName} />
              </p>
              <p className="text-muted-foreground">{invoice.memberEmail}</p>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.lineItems}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{texts.description}</TableHead>
                <TableHead className="text-center">{texts.quantity}</TableHead>
                <TableHead className="text-end">{texts.unitPrice}</TableHead>
                <TableHead className="text-end">{texts.total}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <LocalizedText text={item.description} />
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-end">
                    {formatCurrency(item.unitPrice.amount, currency, locale)}
                  </TableCell>
                  <TableCell className="text-end font-medium">
                    {formatCurrency(item.lineTotal.amount, currency, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-end">
                  {texts.subtotal}
                </TableCell>
                <TableCell className="text-end">
                  {formatCurrency(invoice.subtotal.amount, currency, locale)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-end">
                  {texts.vat} ({invoice.vatRate}%)
                </TableCell>
                <TableCell className="text-end">
                  {formatCurrency(invoice.vatAmount.amount, currency, locale)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-end font-bold">
                  {texts.totalAmount}
                </TableCell>
                <TableCell className="text-end font-bold text-lg">
                  {formatCurrency(invoice.totalAmount.amount, currency, locale)}
                </TableCell>
              </TableRow>
              {invoice.paidAmount && invoice.paidAmount.amount > 0 && (
                <>
                  <TableRow>
                    <TableCell colSpan={3} className="text-end text-green-600">
                      {texts.paidAmount}
                    </TableCell>
                    <TableCell className="text-end text-green-600">
                      -{formatCurrency(invoice.paidAmount.amount, currency, locale)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="text-end font-bold">
                      {texts.remainingBalance}
                    </TableCell>
                    <TableCell className="text-end font-bold text-lg">
                      {formatCurrency(
                        invoice.remainingBalance.amount,
                        currency,
                        locale
                      )}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.notes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <LocalizedText text={invoice.notes} />
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
