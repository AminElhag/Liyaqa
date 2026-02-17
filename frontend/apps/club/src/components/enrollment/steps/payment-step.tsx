"use client";

import { useLocale } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@liyaqa/shared/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@liyaqa/shared/components/ui/select";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useEnrollmentPreview } from "@liyaqa/shared/queries/use-enrollment";
import { cn } from "@liyaqa/shared/utils";
import { Banknote, CreditCard, Building2, Ticket } from "lucide-react";
import type { EnrollmentFormData } from "../enrollment-schemas";

interface PaymentStepProps {
  form: UseFormReturn<EnrollmentFormData>;
}

const PAYMENT_METHODS = [
  { value: "CASH", icon: Banknote },
  { value: "CARD", icon: CreditCard },
  { value: "MADA", icon: CreditCard },
  { value: "BANK_TRANSFER", icon: Building2 },
] as const;

export function PaymentStep({ form }: PaymentStepProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const planId = form.watch("planId");
  const contractTerm = form.watch("contractTerm");
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const existingMemberId = form.watch("existingMemberId");

  const { data: preview, isLoading: previewLoading } = useEnrollmentPreview({
    planId,
    contractTerm: contractTerm || "MONTHLY",
    discountType: discountType || undefined,
    discountValue: discountValue || undefined,
    existingMemberId: existingMemberId || undefined,
  });

  const texts = {
    feeBreakdown: isAr ? "تفاصيل الرسوم" : "Fee Breakdown",
    membershipFee: isAr ? "رسوم العضوية" : "Membership Fee",
    adminFee: isAr ? "رسوم إدارية" : "Administration Fee",
    joinFee: isAr ? "رسوم الانضمام" : "Joining Fee",
    subtotal: isAr ? "المجموع الفرعي" : "Subtotal",
    vat: isAr ? "ضريبة القيمة المضافة" : "VAT (15%)",
    discount: isAr ? "خصم" : "Discount",
    total: isAr ? "الإجمالي" : "Total",
    paymentMethod: isAr ? "طريقة الدفع" : "Payment Method",
    cash: isAr ? "نقدي" : "Cash",
    card: isAr ? "بطاقة" : "Card",
    mada: isAr ? "مدى" : "Mada",
    bankTransfer: isAr ? "تحويل بنكي" : "Bank Transfer",
    amount: isAr ? "المبلغ المدفوع" : "Amount Paid",
    voucher: isAr ? "كود القسيمة" : "Voucher Code",
    staffDiscount: isAr ? "خصم الموظف" : "Staff Discount",
    discountType: isAr ? "نوع الخصم" : "Discount Type",
    discountValue: isAr ? "قيمة الخصم" : "Discount Value",
    discountReason: isAr ? "سبب الخصم" : "Discount Reason",
    percentage: isAr ? "نسبة مئوية" : "Percentage",
    fixedAmount: isAr ? "مبلغ ثابت" : "Fixed Amount",
    sar: "SAR",
    notApplicable: isAr ? "غير مطبق" : "N/A",
  };

  const methodLabels: Record<string, string> = {
    CASH: texts.cash,
    CARD: texts.card,
    MADA: texts.mada,
    BANK_TRANSFER: texts.bankTransfer,
  };

  // Auto-fill paid amount from preview grand total
  const grandTotal = preview?.grandTotal?.amount;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Fee breakdown panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{texts.feeBreakdown}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {previewLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-5" />
              ))}
            </div>
          ) : preview ? (
            <>
              {preview.membershipFee.applicable && (
                <FeeRow
                  label={isAr ? (preview.membershipFee.label.ar || texts.membershipFee) : (preview.membershipFee.label.en || texts.membershipFee)}
                  amount={preview.membershipFee.grossAmount.amount}
                  currency={preview.membershipFee.grossAmount.currency}
                />
              )}
              {preview.administrationFee.applicable && (
                <FeeRow
                  label={texts.adminFee}
                  amount={preview.administrationFee.grossAmount.amount}
                  currency={preview.administrationFee.grossAmount.currency}
                />
              )}
              {preview.joinFee.applicable && (
                <FeeRow
                  label={texts.joinFee}
                  amount={preview.joinFee.grossAmount.amount}
                  currency={preview.joinFee.grossAmount.currency}
                />
              )}
              <Separator />
              <FeeRow
                label={texts.subtotal}
                amount={preview.subtotal.amount}
                currency={preview.subtotal.currency}
              />
              <FeeRow
                label={texts.vat}
                amount={preview.vatTotal.amount}
                currency={preview.vatTotal.currency}
                muted
              />
              {preview.discountAmount && (
                <FeeRow
                  label={texts.discount}
                  amount={-preview.discountAmount.amount}
                  currency={preview.discountAmount.currency}
                  className="text-green-600"
                />
              )}
              <Separator />
              <FeeRow
                label={texts.total}
                amount={preview.grandTotal.amount}
                currency={preview.grandTotal.currency}
                bold
              />
            </>
          ) : (
            <p className="text-muted-foreground">{texts.notApplicable}</p>
          )}
        </CardContent>
      </Card>

      {/* Payment form */}
      <div className="space-y-6">
        {/* Payment method */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">{texts.paymentMethod}</Label>
          <RadioGroup
            value={form.watch("paymentMethod") ?? ""}
            onValueChange={(v) => {
              form.setValue("paymentMethod", v);
              if (grandTotal && !form.getValues("paidAmount")) {
                form.setValue("paidAmount", grandTotal);
              }
            }}
            className="grid grid-cols-2 gap-2"
          >
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
                  form.watch("paymentMethod") === method.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                )}
              >
                <RadioGroupItem value={method.value} className="sr-only" />
                <method.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{methodLabels[method.value]}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label>{texts.amount}</Label>
          <div className="relative">
            <Input
              {...form.register("paidAmount")}
              type="number"
              step="0.01"
              min="0"
              placeholder={grandTotal?.toString() ?? "0.00"}
              className="pe-14"
            />
            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {texts.sar}
            </span>
          </div>
        </div>

        {/* Voucher */}
        <div className="space-y-2">
          <Label>{texts.voucher}</Label>
          <div className="relative">
            <Ticket className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              {...form.register("voucherCode")}
              placeholder={texts.voucher}
              className="ps-9"
            />
          </div>
        </div>

        {/* Staff discount */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">{texts.staffDiscount}</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">{texts.discountType}</Label>
              <Select
                value={form.watch("discountType") ?? ""}
                onValueChange={(v) => form.setValue("discountType", v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.discountType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">{texts.percentage}</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">{texts.fixedAmount}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{texts.discountValue}</Label>
              <Input
                {...form.register("discountValue")}
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{texts.discountReason}</Label>
            <Input
              {...form.register("discountReason")}
              placeholder={texts.discountReason}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeeRow({
  label,
  amount,
  currency,
  bold,
  muted,
  className,
}: {
  label: string;
  amount: number;
  currency: string;
  bold?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        bold && "font-semibold",
        muted && "text-muted-foreground",
        className
      )}
    >
      <span>{label}</span>
      <span>
        {amount.toLocaleString("en-SA", { minimumFractionDigits: 2 })} {currency}
      </span>
    </div>
  );
}
