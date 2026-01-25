"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Voucher, CreateVoucherRequest, DiscountType } from "@/types/voucher";
import { DISCOUNT_TYPE_LABELS } from "@/types/voucher";

const voucherFormSchema = z.object({
  code: z.string().min(3).max(50),
  nameEn: z.string().min(1).max(255),
  nameAr: z.string().max(255).optional(),
  discountType: z.enum(["FIXED_AMOUNT", "PERCENTAGE", "FREE_TRIAL", "GIFT_CARD"]),
  discountAmount: z.number().positive().optional().nullable(),
  discountCurrency: z.string().length(3).default("SAR"),
  discountPercent: z.number().min(0.01).max(100).optional().nullable(),
  freeTrialDays: z.number().int().positive().optional().nullable(),
  giftCardBalance: z.number().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerMember: z.number().int().positive().default(1),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  firstTimeMemberOnly: z.boolean().default(false),
  minimumPurchase: z.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type VoucherFormData = z.infer<typeof voucherFormSchema>;

interface VoucherFormProps {
  voucher?: Voucher;
  onSubmit: (data: CreateVoucherRequest) => void;
  isPending?: boolean;
}

export function VoucherForm({ voucher, onSubmit, isPending }: VoucherFormProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const isEdit = !!voucher;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherFormSchema),
    defaultValues: {
      code: voucher?.code || "",
      nameEn: voucher?.nameEn || "",
      nameAr: voucher?.nameAr || "",
      discountType: voucher?.discountType || "FIXED_AMOUNT",
      discountAmount: voucher?.discountAmount || undefined,
      discountCurrency: voucher?.discountCurrency || "SAR",
      discountPercent: voucher?.discountPercent || undefined,
      freeTrialDays: voucher?.freeTrialDays || undefined,
      giftCardBalance: voucher?.giftCardBalance || undefined,
      maxUses: voucher?.maxUses || undefined,
      maxUsesPerMember: voucher?.maxUsesPerMember || 1,
      validFrom: voucher?.validFrom?.split("T")[0] || undefined,
      validUntil: voucher?.validUntil?.split("T")[0] || undefined,
      firstTimeMemberOnly: voucher?.firstTimeMemberOnly || false,
      minimumPurchase: voucher?.minimumPurchase || undefined,
      isActive: voucher?.isActive ?? true,
    },
  });

  const discountType = watch("discountType");

  const handleFormSubmit = (data: VoucherFormData) => {
    onSubmit({
      code: data.code.toUpperCase(),
      nameEn: data.nameEn,
      nameAr: data.nameAr || undefined,
      discountType: data.discountType,
      discountAmount: data.discountAmount || undefined,
      discountCurrency: data.discountCurrency,
      discountPercent: data.discountPercent || undefined,
      freeTrialDays: data.freeTrialDays || undefined,
      giftCardBalance: data.giftCardBalance || undefined,
      maxUses: data.maxUses || undefined,
      maxUsesPerMember: data.maxUsesPerMember,
      validFrom: data.validFrom ? new Date(data.validFrom).toISOString() : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
      firstTimeMemberOnly: data.firstTimeMemberOnly,
      minimumPurchase: data.minimumPurchase || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "المعلومات الأساسية" : "Basic Information"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                {isArabic ? "الكود" : "Code"}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="SUMMER2024"
                disabled={isEdit}
                className="uppercase"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountType">
                {isArabic ? "نوع الخصم" : "Discount Type"}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="discountType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEdit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(DISCOUNT_TYPE_LABELS) as DiscountType[]).map((type) => (
                        <SelectItem key={type} value={type}>
                          {isArabic ? DISCOUNT_TYPE_LABELS[type].ar : DISCOUNT_TYPE_LABELS[type].en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameEn">
                {isArabic ? "الاسم (إنجليزي)" : "Name (English)"}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nameEn"
                {...register("nameEn")}
                placeholder="Summer Sale"
              />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameAr">{isArabic ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
              <Input
                id="nameAr"
                {...register("nameAr")}
                placeholder="تخفيضات الصيف"
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discount Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "إعدادات الخصم" : "Discount Settings"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(discountType === "FIXED_AMOUNT" || discountType === "GIFT_CARD") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountAmount">
                  {discountType === "GIFT_CARD"
                    ? isArabic
                      ? "رصيد البطاقة"
                      : "Card Balance"
                    : isArabic
                    ? "مبلغ الخصم"
                    : "Discount Amount"}
                </Label>
                <Input
                  id={discountType === "GIFT_CARD" ? "giftCardBalance" : "discountAmount"}
                  type="number"
                  step="0.01"
                  {...register(discountType === "GIFT_CARD" ? "giftCardBalance" : "discountAmount", {
                    valueAsNumber: true,
                  })}
                  placeholder="50.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountCurrency">{isArabic ? "العملة" : "Currency"}</Label>
                <Controller
                  name="discountCurrency"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          )}

          {discountType === "PERCENTAGE" && (
            <div className="space-y-2">
              <Label htmlFor="discountPercent">
                {isArabic ? "نسبة الخصم (%)" : "Discount Percentage (%)"}
              </Label>
              <Input
                id="discountPercent"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                {...register("discountPercent", { valueAsNumber: true })}
                placeholder="20"
              />
            </div>
          )}

          {discountType === "FREE_TRIAL" && (
            <div className="space-y-2">
              <Label htmlFor="freeTrialDays">
                {isArabic ? "أيام التجربة المجانية" : "Free Trial Days"}
              </Label>
              <Input
                id="freeTrialDays"
                type="number"
                step="1"
                min="1"
                {...register("freeTrialDays", { valueAsNumber: true })}
                placeholder="7"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="minimumPurchase">
              {isArabic ? "الحد الأدنى للشراء" : "Minimum Purchase"}
            </Label>
            <Input
              id="minimumPurchase"
              type="number"
              step="0.01"
              {...register("minimumPurchase", { valueAsNumber: true })}
              placeholder={isArabic ? "اختياري" : "Optional"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "حدود الاستخدام" : "Usage Limits"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUses">
                {isArabic ? "الحد الأقصى للاستخدام" : "Max Uses"}
              </Label>
              <Input
                id="maxUses"
                type="number"
                step="1"
                min="1"
                {...register("maxUses", { valueAsNumber: true })}
                placeholder={isArabic ? "غير محدود" : "Unlimited"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUsesPerMember">
                {isArabic ? "الحد لكل عضو" : "Max Uses Per Member"}
              </Label>
              <Input
                id="maxUsesPerMember"
                type="number"
                step="1"
                min="1"
                {...register("maxUsesPerMember", { valueAsNumber: true })}
                defaultValue={1}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="firstTimeMemberOnly">
                {isArabic ? "للأعضاء الجدد فقط" : "First-time Members Only"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? "السماح فقط للأعضاء الجدد باستخدام هذه القسيمة"
                  : "Only allow new members to use this voucher"}
              </p>
            </div>
            <Controller
              name="firstTimeMemberOnly"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Validity Period */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "فترة الصلاحية" : "Validity Period"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">{isArabic ? "تاريخ البدء" : "Valid From"}</Label>
              <Input id="validFrom" type="date" {...register("validFrom")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">{isArabic ? "تاريخ الانتهاء" : "Valid Until"}</Label>
              <Input id="validUntil" type="date" {...register("validUntil")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isArabic
              ? "جاري الحفظ..."
              : "Saving..."
            : isEdit
            ? isArabic
              ? "تحديث القسيمة"
              : "Update Voucher"
            : isArabic
            ? "إنشاء القسيمة"
            : "Create Voucher"}
        </Button>
      </div>
    </form>
  );
}
