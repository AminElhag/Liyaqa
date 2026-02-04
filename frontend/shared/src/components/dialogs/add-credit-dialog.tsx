"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Plus, Loader2, Wallet, CreditCard } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useToast } from "../hooks/use-toast";
import { useAddCredit } from "../queries/use-wallet";
import { WALLET_PAYMENT_METHODS, type WalletPaymentMethod } from "../../types/wallet";
import type { UUID } from "../../types/api";

const addCreditSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(1, "Minimum amount is 1"),
  currency: z.string().default("SAR"),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type AddCreditFormData = z.infer<typeof addCreditSchema>;

interface AddCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: UUID;
  onSuccess?: () => void;
}

export function AddCreditDialog({
  open,
  onOpenChange,
  memberId,
  onSuccess,
}: AddCreditDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCredit = useAddCredit();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddCreditFormData>({
    resolver: zodResolver(addCreditSchema),
    defaultValues: {
      amount: 100,
      currency: "SAR",
      description: "",
      paymentMethod: "CASH",
    },
  });

  const watchPaymentMethod = watch("paymentMethod");

  const texts = {
    title: locale === "ar" ? "إضافة رصيد" : "Add Credit",
    description:
      locale === "ar"
        ? "أضف رصيدًا إلى محفظة العضو. سيتم تطبيق الدفع التلقائي على الاشتراكات المعلقة."
        : "Add credit to the member's wallet. Auto-pay will apply to pending subscriptions.",
    amount: locale === "ar" ? "المبلغ" : "Amount",
    currency: locale === "ar" ? "العملة" : "Currency",
    descriptionLabel: locale === "ar" ? "الوصف (اختياري)" : "Description (Optional)",
    paymentMethod: locale === "ar" ? "طريقة الدفع" : "Payment Method",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    addCredit: locale === "ar" ? "إضافة رصيد" : "Add Credit",
    adding: locale === "ar" ? "جاري الإضافة..." : "Adding...",
    successTitle: locale === "ar" ? "تمت إضافة الرصيد" : "Credit Added",
    successDescription:
      locale === "ar"
        ? "تمت إضافة الرصيد بنجاح إلى محفظة العضو"
        : "Credit has been successfully added to the member's wallet",
    errorTitle: locale === "ar" ? "خطأ في إضافة الرصيد" : "Error Adding Credit",
    selectPaymentMethod: locale === "ar" ? "اختر طريقة الدفع" : "Select payment method",
    paymentMethods: {
      CASH: locale === "ar" ? "نقدي" : "Cash",
      CARD: locale === "ar" ? "بطاقة" : "Card",
      BANK_TRANSFER: locale === "ar" ? "تحويل بنكي" : "Bank Transfer",
      ONLINE: locale === "ar" ? "إلكتروني" : "Online",
      MADA: locale === "ar" ? "مدى" : "Mada",
      PAYTABS: locale === "ar" ? "بيتابس" : "PayTabs",
      STC_PAY: locale === "ar" ? "STC Pay" : "STC Pay",
    },
    amountPlaceholder: locale === "ar" ? "أدخل المبلغ" : "Enter amount",
    descriptionPlaceholder:
      locale === "ar" ? "أدخل وصفًا (اختياري)..." : "Enter description (optional)...",
  };

  const onSubmit = async (data: AddCreditFormData) => {
    setIsSubmitting(true);
    try {
      await addCredit.mutateAsync({
        memberId,
        data: {
          amount: data.amount,
          currency: data.currency,
          description: data.description || undefined,
          paymentMethod: data.paymentMethod || undefined,
        },
      });

      toast({
        title: texts.successTitle,
        description: texts.successDescription,
      });

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-500" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">{texts.amount}</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={1}
                placeholder={texts.amountPlaceholder}
                className="flex-1"
                {...register("amount", { valueAsNumber: true })}
              />
              <Select
                value={watch("currency")}
                onValueChange={(value) => setValue("currency", value)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {texts.paymentMethod}
            </Label>
            <Select
              value={watchPaymentMethod}
              onValueChange={(value) => setValue("paymentMethod", value as WalletPaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.selectPaymentMethod} />
              </SelectTrigger>
              <SelectContent>
                {WALLET_PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {texts.paymentMethods[method]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{texts.descriptionLabel}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={texts.descriptionPlaceholder}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {texts.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {texts.adding}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 me-2" />
                  {texts.addCredit}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
