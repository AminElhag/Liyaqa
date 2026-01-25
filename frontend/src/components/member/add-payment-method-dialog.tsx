"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreditCard, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAddPaymentMethod } from "@/queries/use-payment-methods";
import { toast } from "sonner";
import type {
  PaymentMethodType,
  PaymentProviderType,
  AddPaymentMethodRequest,
} from "@/types/payment-method";

const PAYMENT_TYPES: { value: PaymentMethodType; label: { en: string; ar: string } }[] = [
  { value: "CARD", label: { en: "Credit/Debit Card", ar: "بطاقة ائتمان/خصم" } },
  { value: "MADA", label: { en: "Mada Card", ar: "بطاقة مدى" } },
  { value: "STCPAY", label: { en: "STC Pay", ar: "STC Pay" } },
  { value: "APPLE_PAY", label: { en: "Apple Pay", ar: "Apple Pay" } },
];

const CARD_BRANDS = ["VISA", "MASTERCARD", "MADA", "AMEX"];

const addPaymentMethodSchema = z.object({
  paymentType: z.enum(["CARD", "MADA", "STCPAY", "APPLE_PAY"]),
  cardLastFour: z
    .string()
    .regex(/^\d{4}$/, "Must be 4 digits")
    .optional()
    .or(z.literal("")),
  cardBrand: z.string().optional(),
  cardExpMonth: z.coerce.number().min(1).max(12).optional().or(z.literal("")),
  cardExpYear: z.coerce.number().min(2024).max(2050).optional().or(z.literal("")),
  nickname: z.string().max(100).optional(),
  setAsDefault: z.boolean().default(false),
});

type FormValues = z.infer<typeof addPaymentMethodSchema>;

interface AddPaymentMethodDialogProps {
  trigger?: React.ReactNode;
}

export function AddPaymentMethodDialog({ trigger }: AddPaymentMethodDialogProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [open, setOpen] = React.useState(false);

  const addPaymentMethod = useAddPaymentMethod();

  const form = useForm<FormValues>({
    resolver: zodResolver(addPaymentMethodSchema),
    defaultValues: {
      paymentType: "CARD",
      cardLastFour: "",
      cardBrand: "",
      cardExpMonth: "",
      cardExpYear: "",
      nickname: "",
      setAsDefault: false,
    },
  });

  const watchedPaymentType = form.watch("paymentType");
  const isCardType = watchedPaymentType === "CARD" || watchedPaymentType === "MADA";

  const onSubmit = async (values: FormValues) => {
    try {
      const request: AddPaymentMethodRequest = {
        paymentType: values.paymentType,
        providerType: "MANUAL" as PaymentProviderType, // Manual entry for now
        cardLastFour: values.cardLastFour || undefined,
        cardBrand: values.cardBrand || undefined,
        cardExpMonth: values.cardExpMonth ? Number(values.cardExpMonth) : undefined,
        cardExpYear: values.cardExpYear ? Number(values.cardExpYear) : undefined,
        nickname: values.nickname || undefined,
        setAsDefault: values.setAsDefault,
      };

      await addPaymentMethod.mutateAsync(request);

      toast.success(
        isArabic ? "تمت إضافة طريقة الدفع بنجاح" : "Payment method added successfully"
      );
      setOpen(false);
      form.reset();
    } catch {
      toast.error(
        isArabic ? "فشل في إضافة طريقة الدفع" : "Failed to add payment method"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 me-2" />
            {isArabic ? "إضافة طريقة دفع" : "Add Payment Method"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {isArabic ? "إضافة طريقة دفع جديدة" : "Add New Payment Method"}
          </DialogTitle>
          <DialogDescription>
            {isArabic
              ? "أدخل تفاصيل طريقة الدفع الخاصة بك"
              : "Enter your payment method details"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Payment Type */}
            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? "نوع الدفع" : "Payment Type"}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {isArabic ? type.label.ar : type.label.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Card-specific fields */}
            {isCardType && (
              <>
                {/* Card Brand */}
                <FormField
                  control={form.control}
                  name="cardBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? "نوع البطاقة" : "Card Brand"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={isArabic ? "اختر نوع البطاقة" : "Select card brand"}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CARD_BRANDS.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last 4 Digits */}
                <FormField
                  control={form.control}
                  name="cardLastFour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isArabic ? "آخر 4 أرقام" : "Last 4 Digits"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          maxLength={4}
                          placeholder="1234"
                          inputMode="numeric"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expiry Date */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cardExpMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isArabic ? "شهر الانتهاء" : "Expiry Month"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                              <SelectItem key={month} value={month.toString()}>
                                {String(month).padStart(2, "0")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardExpYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isArabic ? "سنة الانتهاء" : "Expiry Year"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="YYYY" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 15 }, (_, i) => 2024 + i).map(
                              (year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* Nickname */}
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isArabic ? "اسم مستعار (اختياري)" : "Nickname (optional)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={isArabic ? "مثال: بطاقتي الشخصية" : "e.g., My personal card"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Set as Default */}
            <FormField
              control={form.control}
              name="setAsDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    {isArabic
                      ? "تعيين كطريقة الدفع الافتراضية"
                      : "Set as default payment method"}
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={addPaymentMethod.isPending}>
                {addPaymentMethod.isPending && (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                )}
                {isArabic ? "إضافة" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
