"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveDepartments } from "@/queries/use-departments";
import { getLocalizedText } from "@/lib/utils";
import type { Department } from "@/types/employee";

const departmentFormSchema = z.object({
  name: z.object({
    en: z.string().min(1, "English name is required"),
    ar: z.string().nullish(),
  }),
  description: z.object({
    en: z.string().nullish(),
    ar: z.string().nullish(),
  }).nullish(),
  parentDepartmentId: z.string().nullish(),
  sortOrder: z.number().min(0).default(0),
});

export type DepartmentFormData = z.infer<typeof departmentFormSchema>;

interface DepartmentFormProps {
  department?: Department;
  onSubmit: (data: DepartmentFormData) => void;
  isPending?: boolean;
}

export function DepartmentForm({
  department,
  onSubmit,
  isPending,
}: DepartmentFormProps) {
  const locale = useLocale();
  const { data: departments, isLoading: deptsLoading } = useActiveDepartments();

  // Filter out the current department from parent options to prevent self-reference
  const availableParents = departments?.filter((d) => d.id !== department?.id) || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: {
        en: department?.name.en || "",
        ar: department?.name.ar || "",
      },
      description: {
        en: department?.description?.en || "",
        ar: department?.description?.ar || "",
      },
      parentDepartmentId: department?.parentDepartmentId || "",
      sortOrder: department?.sortOrder || 0,
    },
  });

  const selectedParentId = watch("parentDepartmentId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "المعلومات الأساسية" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name.en">
                {locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *
              </Label>
              <Input
                id="name.en"
                {...register("name.en")}
                placeholder="Department name"
              />
              {errors.name?.en && (
                <p className="text-sm text-destructive">{errors.name.en.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name.ar">
                {locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
              </Label>
              <Input
                id="name.ar"
                {...register("name.ar")}
                placeholder="اسم القسم"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description.en">
                {locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}
              </Label>
              <Textarea
                id="description.en"
                {...register("description.en")}
                placeholder="Department description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description.ar">
                {locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}
              </Label>
              <Textarea
                id="description.ar"
                {...register("description.ar")}
                placeholder="وصف القسم"
                rows={3}
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "التسلسل الهرمي" : "Hierarchy"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="parentDepartmentId">
                {locale === "ar" ? "القسم الأب" : "Parent Department"}
              </Label>
              {deptsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedParentId || "none"}
                  onValueChange={(value) =>
                    setValue("parentDepartmentId", value === "none" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locale === "ar" ? "اختر القسم الأب" : "Select parent department"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {locale === "ar" ? "بدون (قسم رئيسي)" : "None (Root department)"}
                    </SelectItem>
                    {availableParents.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {getLocalizedText(dept.name, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">
                {locale === "ar" ? "ترتيب العرض" : "Sort Order"}
              </Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? locale === "ar"
              ? "جاري الحفظ..."
              : "Saving..."
            : department
              ? locale === "ar"
                ? "حفظ التغييرات"
                : "Save Changes"
              : locale === "ar"
                ? "إنشاء القسم"
                : "Create Department"}
        </Button>
      </div>
    </form>
  );
}
