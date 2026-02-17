"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import type { ClassCategory } from "@liyaqa/shared/types/scheduling";

const COLOR_PRESETS = [
  "#FF6B4A", "#EF4444", "#F59E0B", "#22C55E",
  "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4",
];

const schema = z.object({
  nameEn: z.string().min(1, "Name (English) is required"),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  colorCode: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type ClassCategoryFormData = z.infer<typeof schema>;

interface ClassCategoryFormProps {
  defaultValues?: Partial<ClassCategoryFormData>;
  onSubmit: (data: ClassCategoryFormData) => void;
  isSubmitting?: boolean;
  category?: ClassCategory;
}

export function ClassCategoryForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: ClassCategoryFormProps) {
  const locale = useLocale() as "en" | "ar";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClassCategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameEn: "",
      nameAr: "",
      descriptionEn: "",
      descriptionAr: "",
      colorCode: "",
      icon: "",
      sortOrder: 0,
      ...defaultValues,
    },
  });

  const selectedColor = watch("colorCode");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "معلومات الفئة" : "Category Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameEn">
                {locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}
              </Label>
              <Input id="nameEn" {...register("nameEn")} />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">
                {locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
              </Label>
              <Input id="nameAr" dir="rtl" {...register("nameAr")} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">
                {locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}
              </Label>
              <Textarea id="descriptionEn" rows={3} {...register("descriptionEn")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionAr">
                {locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}
              </Label>
              <Textarea id="descriptionAr" dir="rtl" rows={3} {...register("descriptionAr")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "المظهر" : "Appearance"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{locale === "ar" ? "اللون" : "Color"}</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("colorCode", color)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <Input
                className="w-24 h-8"
                placeholder="#HEX"
                {...register("colorCode")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">
                {locale === "ar" ? "أيقونة (Lucide)" : "Icon (Lucide name)"}
              </Label>
              <Input
                id="icon"
                placeholder="e.g. dumbbell, heart, waves"
                {...register("icon")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">
                {locale === "ar" ? "الترتيب" : "Sort Order"}
              </Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                {...register("sortOrder")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? locale === "ar"
              ? "جاري الحفظ..."
              : "Saving..."
            : locale === "ar"
              ? "حفظ"
              : "Save"}
        </Button>
      </div>
    </form>
  );
}
