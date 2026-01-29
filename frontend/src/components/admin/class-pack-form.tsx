"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { DollarSign, Package, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClassPack } from "@/types/scheduling";

// Zod schema
const classPackSchema = z.object({
  nameEn: z.string().min(1, "Name is required"),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  classCount: z.coerce.number().min(1, "Must have at least 1 class"),
  priceAmount: z.coerce.number().min(0, "Price cannot be negative"),
  priceCurrency: z.string().default("SAR"),
  taxRate: z.coerce.number().min(0).max(100).default(15),
  validityDays: z.coerce.number().min(0).optional(),
  sortOrder: z.coerce.number().default(0),
  imageUrl: z.string().optional(),
});

export type ClassPackFormData = z.infer<typeof classPackSchema>;

interface ClassPackFormProps {
  initialData?: ClassPack;
  onSubmit: (data: ClassPackFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const texts = {
  en: {
    basicInfoTitle: "Basic Information",
    nameEn: "Pack Name (English)",
    nameAr: "Pack Name (Arabic)",
    descriptionEn: "Description (English)",
    descriptionAr: "Description (Arabic)",
    pricingTitle: "Pricing",
    classCount: "Number of Classes",
    classCountHint: "How many class credits this pack includes",
    price: "Price",
    priceHint: "Price before tax",
    taxRate: "Tax Rate (%)",
    taxRateHint: "VAT percentage to apply",
    validityTitle: "Validity",
    validityDays: "Valid for (days)",
    validityDaysHint: "Number of days the pack is valid after purchase. Leave empty for no expiry.",
    displayTitle: "Display Settings",
    sortOrder: "Sort Order",
    sortOrderHint: "Lower numbers appear first",
    imageUrl: "Image URL",
    imageUrlHint: "Optional image for the pack",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    create: "Create Pack",
    creating: "Creating...",
  },
  ar: {
    basicInfoTitle: "المعلومات الأساسية",
    nameEn: "اسم الباقة (إنجليزي)",
    nameAr: "اسم الباقة (عربي)",
    descriptionEn: "الوصف (إنجليزي)",
    descriptionAr: "الوصف (عربي)",
    pricingTitle: "التسعير",
    classCount: "عدد الحصص",
    classCountHint: "كم حصة تتضمنها هذه الباقة",
    price: "السعر",
    priceHint: "السعر قبل الضريبة",
    taxRate: "نسبة الضريبة (%)",
    taxRateHint: "نسبة ضريبة القيمة المضافة",
    validityTitle: "الصلاحية",
    validityDays: "صالحة لمدة (أيام)",
    validityDaysHint: "عدد الأيام التي تكون فيها الباقة صالحة بعد الشراء. اتركها فارغة لعدم انتهاء الصلاحية.",
    displayTitle: "إعدادات العرض",
    sortOrder: "ترتيب العرض",
    sortOrderHint: "الأرقام الأقل تظهر أولاً",
    imageUrl: "رابط الصورة",
    imageUrlHint: "صورة اختيارية للباقة",
    cancel: "إلغاء",
    save: "حفظ",
    saving: "جاري الحفظ...",
    create: "إنشاء الباقة",
    creating: "جاري الإنشاء...",
  },
};

export function ClassPackForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ClassPackFormProps) {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassPackFormData>({
    resolver: zodResolver(classPackSchema),
    defaultValues: initialData
      ? {
          nameEn: initialData.name.en,
          nameAr: initialData.name.ar || "",
          descriptionEn: initialData.description?.en || "",
          descriptionAr: initialData.description?.ar || "",
          classCount: initialData.classCount,
          priceAmount: initialData.price.amount,
          priceCurrency: initialData.price.currency,
          taxRate: initialData.taxRate,
          validityDays: initialData.validityDays || undefined,
          sortOrder: initialData.sortOrder,
          imageUrl: initialData.imageUrl || "",
        }
      : {
          nameEn: "",
          nameAr: "",
          descriptionEn: "",
          descriptionAr: "",
          classCount: 10,
          priceAmount: 0,
          priceCurrency: "SAR",
          taxRate: 15,
          validityDays: undefined,
          sortOrder: 0,
          imageUrl: "",
        },
  });

  const formValues = watch();

  const handleFormSubmit = handleSubmit(onSubmit);

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t.basicInfoTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameEn">{t.nameEn} *</Label>
              <Input
                id="nameEn"
                {...register("nameEn")}
                placeholder="10 Class Pack"
                className={cn(errors.nameEn && "border-destructive")}
              />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">{t.nameAr}</Label>
              <Input
                id="nameAr"
                {...register("nameAr")}
                placeholder="باقة ١٠ حصص"
                dir="rtl"
              />
            </div>
          </div>

          {/* Description fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">{t.descriptionEn}</Label>
              <Textarea
                id="descriptionEn"
                {...register("descriptionEn")}
                rows={3}
                placeholder="Get 10 class credits to use any time..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionAr">{t.descriptionAr}</Label>
              <Textarea
                id="descriptionAr"
                {...register("descriptionAr")}
                rows={3}
                dir="rtl"
                placeholder="احصل على ١٠ رصيد حصص لاستخدامها في أي وقت..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {t.pricingTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Class Count */}
          <div className="space-y-2">
            <Label htmlFor="classCount">{t.classCount} *</Label>
            <Input
              id="classCount"
              type="number"
              min={1}
              {...register("classCount")}
              className={cn(errors.classCount && "border-destructive")}
            />
            <p className="text-xs text-muted-foreground">{t.classCountHint}</p>
            {errors.classCount && (
              <p className="text-sm text-destructive">{errors.classCount.message}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label>{t.price} *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  {...register("priceAmount")}
                  className={cn("ps-10", errors.priceAmount && "border-destructive")}
                  placeholder="0.00"
                />
              </div>
              <Select
                value={formValues.priceCurrency || "SAR"}
                onValueChange={(value) => setValue("priceCurrency", value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{t.priceHint}</p>
            {errors.priceAmount && (
              <p className="text-sm text-destructive">{errors.priceAmount.message}</p>
            )}
          </div>

          {/* Tax Rate */}
          <div className="space-y-2">
            <Label htmlFor="taxRate">{t.taxRate}</Label>
            <div className="relative">
              <Input
                id="taxRate"
                type="number"
                min={0}
                max={100}
                step={0.01}
                {...register("taxRate")}
                className="pe-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{t.taxRateHint}</p>
          </div>
        </CardContent>
      </Card>

      {/* Validity */}
      <Card>
        <CardHeader>
          <CardTitle>{t.validityTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="validityDays">{t.validityDays}</Label>
            <Input
              id="validityDays"
              type="number"
              min={0}
              {...register("validityDays")}
              placeholder="30"
            />
            <p className="text-xs text-muted-foreground">{t.validityDaysHint}</p>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t.displayTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">{t.sortOrder}</Label>
              <Input
                id="sortOrder"
                type="number"
                {...register("sortOrder")}
              />
              <p className="text-xs text-muted-foreground">{t.sortOrderHint}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t.imageUrl}</Label>
              <Input
                id="imageUrl"
                {...register("imageUrl")}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">{t.imageUrlHint}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {isEdit ? t.saving : t.creating}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 me-2" />
              {isEdit ? t.save : t.create}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
