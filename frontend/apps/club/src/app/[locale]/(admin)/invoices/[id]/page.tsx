"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  Download,
  Send,
  XCircle,
  CreditCard,
  User,
  Calendar,
  FileText,
  Trash2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@liyaqa/shared/components/ui/table";
import {
  useInvoice,
  useInvoicePayments,
  useIssueInvoice,
  useCancelInvoice,
  useDeleteInvoice,
  usePayInvoice,
  useDownloadInvoicePdf,
} from "@liyaqa/shared/queries";
import { formatDate, formatDateTime, formatCurrency } from "@liyaqa/shared/utils";
import type { PaymentMethod } from "@liyaqa/shared/types/billing";

const PAYMENT_METHODS: { value: PaymentMethod; labelEn: string; labelAr: string }[] = [
  { value: "CASH", labelEn: "Cash", labelAr: "نقداً" },
  { value: "CARD", labelEn: "Card", labelAr: "بطاقة" },
  { value: "MADA", labelEn: "Mada", labelAr: "مدى" },
  { value: "BANK_TRANSFER", labelEn: "Bank Transfer", labelAr: "تحويل بنكي" },
  { value: "APPLE_PAY", labelEn: "Apple Pay", labelAr: "Apple Pay" },
  { value: "STC_PAY", labelEn: "STC Pay", labelAr: "STC Pay" },
  { value: "SADAD", labelEn: "SADAD", labelAr: "سداد" },
  { value: "TAMARA", labelEn: "Tamara", labelAr: "تمارا" },
  { value: "ONLINE", labelEn: "Online", labelAr: "أونلاين" },
  { value: "OTHER", labelEn: "Other", labelAr: "أخرى" },
];

export default function InvoiceDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("CASH");
  const [payReference, setPayReference] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const { data: invoice, isLoading, error } = useInvoice(id);
  const { data: payments } = useInvoicePayments(id);

  const issueInvoice = useIssueInvoice();
  const cancelInvoice = useCancelInvoice();
  const deleteInvoice = useDeleteInvoice();
  const payInvoice = usePayInvoice();
  const downloadPdf = useDownloadInvoicePdf();

  const t = {
    back: locale === "ar" ? "العودة للفواتير" : "Back to Invoices",
    invoiceDetails: locale === "ar" ? "تفاصيل الفاتورة" : "Invoice Details",
    invoiceNumber: locale === "ar" ? "رقم الفاتورة" : "Invoice Number",
    issueDate: locale === "ar" ? "تاريخ الإصدار" : "Issue Date",
    dueDate: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date",
    status: locale === "ar" ? "الحالة" : "Status",
    member: locale === "ar" ? "العضو" : "Member",
    lineItems: locale === "ar" ? "البنود" : "Line Items",
    description: locale === "ar" ? "الوصف" : "Description",
    quantity: locale === "ar" ? "الكمية" : "Qty",
    unitPrice: locale === "ar" ? "سعر الوحدة" : "Unit Price",
    taxRate: locale === "ar" ? "الضريبة" : "Tax",
    total: locale === "ar" ? "المجموع" : "Total",
    subtotal: locale === "ar" ? "المجموع الفرعي" : "Subtotal",
    vat: locale === "ar" ? "ضريبة القيمة المضافة" : "VAT",
    totalAmount: locale === "ar" ? "المبلغ الإجمالي" : "Total Amount",
    paidAmount: locale === "ar" ? "المبلغ المدفوع" : "Paid Amount",
    remainingBalance: locale === "ar" ? "المبلغ المتبقي" : "Remaining Balance",
    notes: locale === "ar" ? "ملاحظات" : "Notes",
    download: locale === "ar" ? "تحميل PDF" : "Download PDF",
    issue: locale === "ar" ? "إصدار الفاتورة" : "Issue Invoice",
    cancel: locale === "ar" ? "إلغاء الفاتورة" : "Cancel Invoice",
    delete: locale === "ar" ? "حذف" : "Delete",
    recordPayment: locale === "ar" ? "تسجيل دفعة" : "Record Payment",
    edit: locale === "ar" ? "تعديل" : "Edit",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل الفاتورة" : "Error loading invoice",
    notIssued: locale === "ar" ? "لم تصدر بعد" : "Not issued yet",
    noDueDate: locale === "ar" ? "لم يحدد" : "Not set",
    paymentHistory: locale === "ar" ? "سجل المدفوعات" : "Payment History",
    noPayments: locale === "ar" ? "لا توجد مدفوعات مسجلة" : "No payments recorded",
    paymentAmount: locale === "ar" ? "المبلغ" : "Amount",
    paymentMethod: locale === "ar" ? "طريقة الدفع" : "Payment Method",
    paymentReference: locale === "ar" ? "المرجع" : "Reference",
    paymentNotes: locale === "ar" ? "ملاحظات" : "Notes",
    save: locale === "ar" ? "حفظ" : "Save",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    confirmCancel: locale === "ar" ? "هل أنت متأكد من إلغاء هذه الفاتورة؟" : "Are you sure you want to cancel this invoice?",
    confirmDelete: locale === "ar" ? "هل أنت متأكد من حذف هذه الفاتورة؟" : "Are you sure you want to delete this invoice?",
  };

  const openPaymentDialog = () => {
    if (invoice) {
      setPayAmount(String(invoice.remainingBalance.amount));
    }
    setPayMethod("CASH");
    setPayReference("");
    setPayNotes("");
    setPaymentOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!invoice) return;
    try {
      await payInvoice.mutateAsync({
        id: invoice.id,
        data: {
          amount: parseFloat(payAmount),
          paymentMethod: payMethod,
          paymentReference: payReference || undefined,
          notes: payNotes || undefined,
        },
      });
      setPaymentOpen(false);
    } catch {
      // Error handled by mutation
    }
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
          {t.error}
        </CardContent>
      </Card>
    );
  }

  const currency = invoice.totalAmount.currency;
  const canPay = invoice.status === "ISSUED" || invoice.status === "PARTIALLY_PAID" || invoice.status === "OVERDUE";
  const canCancel = invoice.status === "DRAFT" || invoice.status === "ISSUED" || invoice.status === "OVERDUE";
  const canDelete = invoice.status === "DRAFT" || invoice.status === "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/invoices`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {t.back}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">
              {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} locale={locale} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {invoice.status !== "DRAFT" && (
            <Button
              variant="outline"
              onClick={() => downloadPdf.mutate(invoice.id)}
              disabled={downloadPdf.isPending}
            >
              <Download className="me-2 h-4 w-4" />
              {t.download}
            </Button>
          )}
          {invoice.status === "DRAFT" && (
            <Button
              onClick={() => issueInvoice.mutate(invoice.id)}
              disabled={issueInvoice.isPending}
            >
              <Send className="me-2 h-4 w-4" />
              {t.issue}
            </Button>
          )}
          {canPay && (
            <Button onClick={openPaymentDialog}>
              <CreditCard className="me-2 h-4 w-4" />
              {t.recordPayment}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm(t.confirmCancel)) {
                  cancelInvoice.mutate(invoice.id);
                }
              }}
              disabled={cancelInvoice.isPending}
            >
              <XCircle className="me-2 h-4 w-4" />
              {t.cancel}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => {
                if (confirm(t.confirmDelete)) {
                  deleteInvoice.mutate(invoice.id, {
                    onSuccess: () => router.push(`/${locale}/invoices`),
                  });
                }
              }}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t.delete}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Invoice Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t.invoiceDetails}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t.invoiceNumber}</p>
                <p className="font-mono font-medium">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.status}</p>
                <StatusBadge status={invoice.status} locale={locale} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.issueDate}</p>
                <p>{invoice.issueDate ? formatDate(invoice.issueDate, locale) : t.notIssued}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.dueDate}</p>
                <p>{invoice.dueDate ? formatDate(invoice.dueDate, locale) : t.noDueDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t.member}
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
          <CardTitle>{t.lineItems}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.description}</TableHead>
                <TableHead className="text-center">{t.quantity}</TableHead>
                <TableHead className="text-end">{t.unitPrice}</TableHead>
                <TableHead className="text-end">{t.taxRate}</TableHead>
                <TableHead className="text-end">{t.total}</TableHead>
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
                  <TableCell className="text-end">{item.taxRate}%</TableCell>
                  <TableCell className="text-end font-medium">
                    {formatCurrency(item.lineGrossTotal.amount, currency, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-end">
                  {t.subtotal}
                </TableCell>
                <TableCell className="text-end">
                  {formatCurrency(invoice.subtotal.amount, currency, locale)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-end">
                  {t.vat}
                </TableCell>
                <TableCell className="text-end">
                  {formatCurrency(invoice.vatAmount.amount, currency, locale)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-end font-bold">
                  {t.totalAmount}
                </TableCell>
                <TableCell className="text-end font-bold text-lg">
                  {formatCurrency(invoice.totalAmount.amount, currency, locale)}
                </TableCell>
              </TableRow>
              {invoice.paidAmount && invoice.paidAmount.amount > 0 && (
                <>
                  <TableRow>
                    <TableCell colSpan={4} className="text-end text-green-600">
                      {t.paidAmount}
                    </TableCell>
                    <TableCell className="text-end text-green-600">
                      -{formatCurrency(invoice.paidAmount.amount, currency, locale)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-end font-bold">
                      {t.remainingBalance}
                    </TableCell>
                    <TableCell className="text-end font-bold text-lg text-amber-600">
                      {formatCurrency(invoice.remainingBalance.amount, currency, locale)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t.paymentHistory}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!payments || payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {t.noPayments}
              </p>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {formatCurrency(payment.amount.amount, payment.amount.currency, locale)}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(payment.paidAt, locale)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {PAYMENT_METHODS.find((m) => m.value === payment.paymentMethod)?.[
                          locale === "ar" ? "labelAr" : "labelEn"
                        ] || payment.paymentMethod}
                      </p>
                      {payment.paymentReference && (
                        <p className="text-xs text-muted-foreground">
                          {locale === "ar" ? "المرجع:" : "Ref:"} {payment.paymentReference}
                        </p>
                      )}
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>{t.notes}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <LocalizedText text={invoice.notes} />
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.recordPayment}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.paymentAmount} *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.remainingBalance.amount}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.paymentMethod} *</Label>
              <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {locale === "ar" ? method.labelAr : method.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.paymentReference}</Label>
              <Input
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.paymentNotes}</Label>
              <Input
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={
                payInvoice.isPending ||
                !payAmount ||
                parseFloat(payAmount) <= 0 ||
                parseFloat(payAmount) > invoice.remainingBalance.amount
              }
            >
              {payInvoice.isPending ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
