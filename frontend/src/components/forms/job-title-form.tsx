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
import type { JobTitle, Role } from "@/types/employee";

const jobTitleFormSchema = z.object({
  name: z.object({
    en: z.string().min(1, "English name is required"),
    ar: z.string().nullish(),
  }),
  description: z.object({
    en: z.string().nullish(),
    ar: z.string().nullish(),
  }).nullish(),
  departmentId: z.string().nullish(),
  defaultRole: z.enum([
    "SUPER_ADMIN",
    "PLATFORM_ADMIN",
    "SALES_REP",
    "SUPPORT_REP",
    "CLUB_ADMIN",
    "STAFF",
    "TRAINER",
    "MEMBER",
  ]).default("STAFF"),
  sortOrder: z.number().min(0).default(0),
});

export type JobTitleFormData = z.infer<typeof jobTitleFormSchema>;

interface JobTitleFormProps {
  jobTitle?: JobTitle;
  onSubmit: (data: JobTitleFormData) => void;
  isPending?: boolean;
}

const roleOptions: { value: Role; labelEn: string; labelAr: string }[] = [
  { value: "SUPER_ADMIN", labelEn: "Super Admin", labelAr: "مدير أعلى" },
  { value: "CLUB_ADMIN", labelEn: "Club Admin", labelAr: "مدير النادي" },
  { value: "STAFF", labelEn: "Staff", labelAr: "موظف" },
  { value: "TRAINER", labelEn: "Trainer", labelAr: "مدرب" },
];

export function JobTitleForm({
  jobTitle,
  onSubmit,
  isPending,
}: JobTitleFormProps) {
  const locale = useLocale();
  const { data: departments, isLoading: deptsLoading } = useActiveDepartments();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobTitleFormData>({
    resolver: zodResolver(jobTitleFormSchema),
    defaultValues: {
      name: {
        en: jobTitle?.name.en || "",
        ar: jobTitle?.name.ar || "",
      },
      description: {
        en: jobTitle?.description?.en || "",
        ar: jobTitle?.description?.ar || "",
      },
      departmentId: jobTitle?.departmentId || "",
      defaultRole: jobTitle?.defaultRole || "STAFF",
      sortOrder: jobTitle?.sortOrder || 0,
    },
  });

  const selectedDeptId = watch("departmentId");
  const selectedRole = watch("defaultRole");

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
                placeholder="Job title"
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
                placeholder="المسمى الوظيفي"
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
                placeholder="Job description"
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
                placeholder="وصف الوظيفة"
                rows={3}
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role & Department */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "الدور والقسم" : "Role & Department"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultRole">
                {locale === "ar" ? "الدور الافتراضي" : "Default Role"} *
              </Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setValue("defaultRole", value as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {locale === "ar" ? role.labelAr : role.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {locale === "ar"
                  ? "يحدد صلاحيات الوصول للوحة التحكم"
                  : "Determines dashboard access permissions"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId">
                {locale === "ar" ? "القسم" : "Department"}
              </Label>
              {deptsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedDeptId || "none"}
                  onValueChange={(value) =>
                    setValue("departmentId", value === "none" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locale === "ar" ? "اختر القسم" : "Select department"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {locale === "ar" ? "بدون قسم" : "No department"}
                    </SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {getLocalizedText(dept.name, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2 max-w-xs">
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
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? locale === "ar"
              ? "جاري الحفظ..."
              : "Saving..."
            : jobTitle
              ? locale === "ar"
                ? "حفظ التغييرات"
                : "Save Changes"
              : locale === "ar"
                ? "إنشاء المسمى الوظيفي"
                : "Create Job Title"}
        </Button>
      </div>
    </form>
  );
}
