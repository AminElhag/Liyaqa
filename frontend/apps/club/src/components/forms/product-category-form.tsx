"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import type { ProductCategory, Department } from "@liyaqa/shared/types/product";
import { DEPARTMENT_LABELS } from "@liyaqa/shared/types/product";

const schema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  icon: z.string().optional(),
  department: z.enum([
    "FOOD_AND_BEVERAGE",
    "MERCHANDISE",
    "EQUIPMENT",
    "SERVICES",
    "SUPPLEMENTS",
    "RENTALS",
    "OTHER",
  ] as const),
  customDepartment: z.string().optional(),
  sortOrder: z.number().min(0).default(0),
});

export type ProductCategoryFormData = z.infer<typeof schema>;

interface ProductCategoryFormProps {
  category?: ProductCategory;
  onSubmit: (data: ProductCategoryFormData) => Promise<void>;
  isPending?: boolean;
}

const DEPARTMENTS: Department[] = [
  "FOOD_AND_BEVERAGE",
  "MERCHANDISE",
  "EQUIPMENT",
  "SERVICES",
  "SUPPLEMENTS",
  "RENTALS",
  "OTHER",
];

const ICONS = [
  { value: "coffee", label: "Coffee" },
  { value: "utensils", label: "Utensils" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "shirt", label: "Shirt" },
  { value: "pill", label: "Pill" },
  { value: "key", label: "Key" },
  { value: "package", label: "Package" },
  { value: "tag", label: "Tag" },
  { value: "star", label: "Star" },
  { value: "gift", label: "Gift" },
];

export function ProductCategoryForm({
  category,
  onSubmit,
  isPending,
}: ProductCategoryFormProps) {
  const locale = useLocale();

  const texts = {
    basicInfo: locale === "ar" ? "المعلومات الأساسية" : "Basic Information",
    nameEn: locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
    descriptionEn:
      locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)",
    descriptionAr: locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)",
    classification: locale === "ar" ? "التصنيف" : "Classification",
    department: locale === "ar" ? "القسم" : "Department",
    customDepartment:
      locale === "ar" ? "اسم القسم المخصص" : "Custom Department Name",
    display: locale === "ar" ? "العرض" : "Display",
    icon: locale === "ar" ? "الأيقونة" : "Icon",
    selectIcon: locale === "ar" ? "اختر أيقونة" : "Select icon",
    sortOrder: locale === "ar" ? "ترتيب العرض" : "Sort Order",
    save: locale === "ar" ? "حفظ" : "Save",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductCategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameEn: category?.name.en || "",
      nameAr: category?.name.ar || "",
      descriptionEn: category?.description?.en || "",
      descriptionAr: category?.description?.ar || "",
      icon: category?.icon || "",
      department: category?.department || "OTHER",
      customDepartment: category?.customDepartment || "",
      sortOrder: category?.sortOrder ?? 0,
    },
  });

  const selectedDepartment = watch("department");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.basicInfo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameEn">{texts.nameEn}</Label>
              <Input id="nameEn" {...register("nameEn")} />
              {errors.nameEn && (
                <p className="text-sm text-destructive">
                  {errors.nameEn.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">{texts.nameAr}</Label>
              <Input id="nameAr" dir="rtl" {...register("nameAr")} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">{texts.descriptionEn}</Label>
              <Textarea id="descriptionEn" {...register("descriptionEn")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionAr">{texts.descriptionAr}</Label>
              <Textarea
                id="descriptionAr"
                dir="rtl"
                {...register("descriptionAr")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.classification}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{texts.department}</Label>
            <Select
              value={selectedDepartment}
              onValueChange={(value) =>
                setValue("department", value as Department)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {DEPARTMENT_LABELS[dept][locale as "en" | "ar"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDepartment === "OTHER" && (
            <div className="space-y-2">
              <Label htmlFor="customDepartment">{texts.customDepartment}</Label>
              <Input id="customDepartment" {...register("customDepartment")} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Display */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.display}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{texts.icon}</Label>
              <Select
                value={watch("icon") || ""}
                onValueChange={(value) => setValue("icon", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectIcon} />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">{texts.sortOrder}</Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? texts.saving : texts.save}
        </Button>
      </div>
    </form>
  );
}
