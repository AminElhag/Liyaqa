"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, DollarSign, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useInvoice, usePayInvoice } from "@liyaqa/shared/queries";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";
import { formatCurrency } from "@liyaqa/shared/utils";
import type { PaymentMethod } from "@liyaqa/shared/types/billing";

export default function PayInvoicePage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: invoice, isLoading } = useInvoice(id);
  const payInvoice = usePayInvoice();

  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    title: locale === "ar" ? "تسجيل دفعة" : "Record Payment",
    description:
      locale === "ar"
        ? "تسجيل دفعة لهذه الفاتورة"
        : "Record a payment for this invoice",
    invoiceNumber: locale === "ar" ? "رقم الفاتورة" : "Invoice Number",
    member: locale === "ar" ? "العضو" : "Member",
    totalAmount: locale === "ar" ? "المبلغ الإجمالي" : "Total Amount",
    remainingAmount: locale === "ar" ? "المبلغ المتبقي" : "Remaining Amount",
    amount: locale === "ar" ? "المبلغ" : "Amount",
    paymentMethod: locale === "ar" ? "طريقة الدفع" : "Payment Method",
    paymentReference: locale === "ar" ? "مرجع الدفع" : "Payment Reference",
    cash: locale === "ar" ? "نقدي" : "Cash",
    card: locale === "ar" ? "بطاقة" : "Card",
    bankTransfer: locale === "ar" ? "تحويل بنكي" : "Bank Transfer",
    online: locale === "ar" ? "عبر الإنترنت" : "Online",
    payFull: locale === "ar" ? "دفع المبلغ كاملاً" : "Pay Full Amount",
    submit: locale === "ar" ? "تسجيل الدفعة" : "Record Payment",
    submitting: locale === "ar" ? "جاري التسجيل..." : "Recording...",
    success:
      locale === "ar"
        ? "تم تسجيل الدفعة بنجاح"
        : "Payment recorded successfully",
    viewInvoice: locale === "ar" ? "عرض الفاتورة" : "View Invoice",
    recordAnother: locale === "ar" ? "تسجيل دفعة أخرى" : "Record Another",
    error:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل الفاتورة"
        : "Error loading invoice",
  };

  const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: "CASH", label: texts.cash },
    { value: "CARD", label: texts.card },
    { value: "BANK_TRANSFER", label: texts.bankTransfer },
    { value: "ONLINE", label: texts.online },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError(
        locale === "ar" ? "يرجى إدخال مبلغ صحيح" : "Please enter a valid amount"
      );
      return;
    }

    try {
      await payInvoice.mutateAsync({
        id,
        data: {
          amount: paymentAmount,
          paymentMethod,
          paymentReference: paymentReference || undefined,
        },
      });
      setSuccess(true);
    } catch (err) {
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {texts.error}
        </CardContent>
      </Card>
    );
  }

  const currency = invoice.totalAmount.currency;
  const remaining = invoice.remainingBalance.amount;

  // Success state
  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/invoices/${id}`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">{texts.success}</h2>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button asChild className="flex-1">
                <Link href={`/${locale}/invoices/${id}`}>
                  {texts.viewInvoice}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/invoices/${id}`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground font-mono">
            {invoice.invoiceNumber}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.invoiceNumber}</CardTitle>
            <CardDescription>{invoice.invoiceNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {texts.member}
              </p>
              <p className="font-medium">
                <LocalizedText text={invoice.memberName} />
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {texts.totalAmount}
              </p>
              <p className="text-lg font-bold">
                {formatCurrency(invoice.totalAmount.amount, currency, locale)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {texts.remainingAmount}
              </p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(remaining, currency, locale)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {texts.title}
            </CardTitle>
            <CardDescription>{texts.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{texts.amount} *</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remaining}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAmount(remaining.toString())}
                  >
                    {texts.payFull}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">{texts.paymentMethod} *</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(value as PaymentMethod)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReference">
                  {texts.paymentReference}
                </Label>
                <Input
                  id="paymentReference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Transaction ID, check number, etc."
                />
              </div>

              <Button
                type="submit"
                disabled={payInvoice.isPending}
                className="w-full"
              >
                <DollarSign className="me-2 h-4 w-4" />
                {payInvoice.isPending ? texts.submitting : texts.submit}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
