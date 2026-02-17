"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { DollarSign, Package, Loader2, Save, Plus, Trash2, LayoutGrid } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { useActiveClassCategories } from "@liyaqa/shared/queries";
import type { ClassPack, ClassPackAllocationMode } from "@liyaqa/shared/types/scheduling";

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
  allocationMode: z.enum(["FLAT", "PER_CATEGORY"]).default("FLAT"),
  categoryAllocations: z.array(z.object({
    categoryId: z.string().min(1, "Category is required"),
    creditCount: z.coerce.number().min(1, "Must be at least 1"),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.allocationMode === "PER_CATEGORY") {
    const allocations = data.categoryAllocations;
    if (!allocations || allocations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one category allocation is required for per-category mode",
        path: ["categoryAllocations"],
      });
      return;
    }

    // Check for duplicate categories
    const categoryIds = allocations.map((a) => a.categoryId);
    const uniqueIds = new Set(categoryIds);
    if (uniqueIds.size !== categoryIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate categories are not allowed",
        path: ["categoryAllocations"],
      });
    }

    // Check sum matches classCount
    const totalCredits = allocations.reduce((sum, a) => sum + (a.creditCount || 0), 0);
    if (totalCredits !== data.classCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total category credits (${totalCredits}) must equal the class count (${data.classCount})`,
        path: ["categoryAllocations"],
      });
    }
  }
});

export type ClassPackFormData = z.infer<typeof classPackSchema>;

interface ClassPackFormProps {
  initialData?: ClassPack;
  onSubmit: (data: ClassPackFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  hideCategoryAllocations?: boolean;
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
    allocationTitle: "Credit Allocation",
    allocationMode: "Allocation Mode",
    flatCredits: "Flat Credits",
    flatCreditsDesc: "Credits can be used for any valid class",
    perCategory: "Per Category",
    perCategoryDesc: "Credits are allocated to specific class categories",
    categoryAllocations: "Category Allocations",
    selectCategory: "Select category",
    credits: "Credits",
    addCategory: "Add Category",
    totalCredits: "Total",
    noCategoriesHint: "No class categories found. Create categories first.",
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
    allocationTitle: "توزيع الحصص",
    allocationMode: "نوع التوزيع",
    flatCredits: "حصص مفتوحة",
    flatCreditsDesc: "يمكن استخدام الحصص في أي فصل",
    perCategory: "حسب الفئة",
    perCategoryDesc: "توزيع الحصص على فئات محددة",
    categoryAllocations: "توزيع الفئات",
    selectCategory: "اختر الفئة",
    credits: "الحصص",
    addCategory: "إضافة فئة",
    totalCredits: "المجموع",
    noCategoriesHint: "لا توجد فئات. قم بإنشاء فئات أولاً.",
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
  hideCategoryAllocations = false,
}: ClassPackFormProps) {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const isEdit = !!initialData;

  const { data: categories = [] } = useActiveClassCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
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
          allocationMode: initialData.allocationMode || "FLAT",
          categoryAllocations: initialData.categoryAllocations?.map((a) => ({
            categoryId: a.categoryId,
            creditCount: a.creditCount,
          })) || [],
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
          allocationMode: "FLAT",
          categoryAllocations: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "categoryAllocations",
  });

  const formValues = watch();
  const allocationMode = watch("allocationMode");
  const classCount = watch("classCount") || 0;

  const totalAllocatedCredits = (formValues.categoryAllocations || []).reduce(
    (sum, a) => sum + (Number(a.creditCount) || 0),
    0
  );

  // Get category IDs already used in allocations
  const usedCategoryIds = new Set(
    (formValues.categoryAllocations || []).map((a) => a.categoryId)
  );

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

      {/* Credit Allocation - only shown for GX packs */}
      {!hideCategoryAllocations && <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            {t.allocationTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Allocation Mode Toggle */}
          <div className="space-y-2">
            <Label>{t.allocationMode}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue("allocationMode", "FLAT", { shouldValidate: true })}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-start transition-colors",
                  allocationMode === "FLAT"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <span className="font-medium text-sm">{t.flatCredits}</span>
                <span className="text-xs text-muted-foreground">{t.flatCreditsDesc}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("allocationMode", "PER_CATEGORY", { shouldValidate: true });
                  // Add an empty row if none exist
                  if (!formValues.categoryAllocations?.length) {
                    append({ categoryId: "", creditCount: 1 });
                  }
                }}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-start transition-colors",
                  allocationMode === "PER_CATEGORY"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <span className="font-medium text-sm">{t.perCategory}</span>
                <span className="text-xs text-muted-foreground">{t.perCategoryDesc}</span>
              </button>
            </div>
          </div>

          {/* Per-Category Allocation Fields */}
          {allocationMode === "PER_CATEGORY" && (
            <div className="space-y-4">
              <Label>{t.categoryAllocations}</Label>

              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  {t.noCategoriesHint}
                </p>
              ) : (
                <>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-3">
                      {/* Category Select */}
                      <div className="flex-1">
                        <Select
                          value={formValues.categoryAllocations?.[index]?.categoryId || ""}
                          onValueChange={(value) =>
                            setValue(`categoryAllocations.${index}.categoryId`, value, {
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              errors.categoryAllocations?.[index]?.categoryId && "border-destructive"
                            )}
                          >
                            <SelectValue placeholder={t.selectCategory} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => {
                              const isUsed = usedCategoryIds.has(cat.id) &&
                                formValues.categoryAllocations?.[index]?.categoryId !== cat.id;
                              return (
                                <SelectItem
                                  key={cat.id}
                                  value={cat.id}
                                  disabled={isUsed}
                                >
                                  <span className="flex items-center gap-2">
                                    {cat.colorCode && (
                                      <span
                                        className="inline-block h-3 w-3 rounded-full shrink-0"
                                        style={{ backgroundColor: cat.colorCode }}
                                      />
                                    )}
                                    {locale === "ar" ? cat.name.ar || cat.name.en : cat.name.en}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Credit Count */}
                      <div className="w-24">
                        <Input
                          type="number"
                          min={1}
                          {...register(`categoryAllocations.${index}.creditCount`)}
                          placeholder={t.credits}
                          className={cn(
                            errors.categoryAllocations?.[index]?.creditCount && "border-destructive"
                          )}
                        />
                      </div>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add Category Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ categoryId: "", creditCount: 1 })}
                    disabled={fields.length >= categories.length}
                  >
                    <Plus className="h-4 w-4 me-1" />
                    {t.addCategory}
                  </Button>

                  {/* Summary */}
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm",
                      totalAllocatedCredits === classCount
                        ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                        : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
                    )}
                  >
                    <span className="font-medium">{t.totalCredits}</span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        totalAllocatedCredits === classCount
                          ? "text-green-700 dark:text-green-400"
                          : "text-amber-700 dark:text-amber-400"
                      )}
                    >
                      {totalAllocatedCredits} / {classCount}
                    </span>
                  </div>

                  {/* Validation error for categoryAllocations */}
                  {errors.categoryAllocations && !Array.isArray(errors.categoryAllocations) && (
                    <p className="text-sm text-destructive">
                      {(errors.categoryAllocations as { message?: string }).message}
                    </p>
                  )}
                  {errors.categoryAllocations && "root" in errors.categoryAllocations && (
                    <p className="text-sm text-destructive">
                      {(errors.categoryAllocations.root as { message?: string })?.message}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>}

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
