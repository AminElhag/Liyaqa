"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { DollarSign } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { useRecordClientPayment } from "@liyaqa/shared/queries/platform/use-client-invoices";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import type { ClientInvoice, ClientPaymentMethod } from "@liyaqa/shared/types/platform/client-invoice";

interface RecordPaymentDialogProps {
  invoice: ClientInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_METHODS: { value: ClientPaymentMethod; en: string; ar: string }[] = [
  { value: "BANK_TRANSFER", en: "Bank Transfer", ar: "تحويل بنكي" },
  { value: "CREDIT_CARD", en: "Credit Card", ar: "بطاقة ائتمان" },
  { value: "CASH", en: "Cash", ar: "نقدي" },
  { value: "CHECK", en: "Check", ar: "شيك" },
  { value: "OTHER", en: "Other", ar: "أخرى" },
];

export function RecordPaymentDialog({
  invoice,
  open,
  onOpenChange,
}: RecordPaymentDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const recordPayment = useRecordClientPayment();

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<ClientPaymentMethod>("BANK_TRANSFER");
  const [reference, setReference] = useState("");

  const texts = {
    title: locale === "ar" ? "تسجيل دفعة" : "Record Payment",
    description:
      locale === "ar"
        ? "تسجيل دفعة لهذه الفاتورة"
        : "Record a payment for this invoice",
    remainingBalance: locale === "ar" ? "الرصيد المتبقي" : "Remaining Balance",
    amount: locale === "ar" ? "مبلغ الدفعة" : "Payment Amount",
    paymentMethod: locale === "ar" ? "طريقة الدفع" : "Payment Method",
    reference: locale === "ar" ? "رقم المرجع (اختياري)" : "Reference (Optional)",
    referencePlaceholder:
      locale === "ar"
        ? "رقم التحويل أو الشيك..."
        : "Transfer number, check number...",
    currency: locale === "ar" ? "ريال" : "SAR",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    record: locale === "ar" ? "تسجيل" : "Record Payment",
    recording: locale === "ar" ? "جاري التسجيل..." : "Recording...",
    successTitle: locale === "ar" ? "تم التسجيل" : "Recorded",
    successDesc:
      locale === "ar"
        ? "تم تسجيل الدفعة بنجاح"
        : "Payment recorded successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    payFullAmount: locale === "ar" ? "دفع كامل المبلغ" : "Pay Full Amount",
  };

  const handleRecordPayment = () => {
    if (!invoice || !amount || !paymentMethod) return;

    recordPayment.mutate(
      {
        id: invoice.id,
        data: {
          amountValue: parseFloat(amount),
          amountCurrency: invoice.totalAmount.currency,
          paymentMethod,
          reference: reference.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.successDesc,
          });
          resetForm();
          onOpenChange(false);
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

  const resetForm = () => {
    setAmount("");
    setPaymentMethod("BANK_TRANSFER");
    setReference("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      resetForm();
      // Pre-fill with remaining balance
      if (invoice?.remainingBalance) {
        setAmount(invoice.remainingBalance.amount.toString());
      }
    }
    onOpenChange(isOpen);
  };

  const handlePayFullAmount = () => {
    if (invoice?.remainingBalance) {
      setAmount(invoice.remainingBalance.amount.toString());
    }
  };

  const formatCurrency = (value: number, currency: string) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Remaining Balance (read-only) */}
          {invoice?.remainingBalance && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{texts.remainingBalance}</p>
              <p className="text-xl font-semibold">
                {formatCurrency(
                  invoice.remainingBalance.amount,
                  invoice.remainingBalance.currency
                )}
              </p>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              {texts.amount} <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              <span className="text-sm text-muted-foreground">
                {texts.currency}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePayFullAmount}
              >
                {texts.payFullAmount}
              </Button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">
              {texts.paymentMethod} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as ClientPaymentMethod)}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {locale === "ar" ? method.ar : method.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">{texts.reference}</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={texts.referencePlaceholder}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {texts.cancel}
          </Button>
          <Button
            onClick={handleRecordPayment}
            disabled={recordPayment.isPending || !amount || parseFloat(amount) <= 0}
          >
            {recordPayment.isPending ? texts.recording : texts.record}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
