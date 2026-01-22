"use client";

import { useLocale } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DepartmentForm, type DepartmentFormData } from "@/components/forms/department-form";
import { useDepartment, useUpdateDepartment } from "@/queries/use-departments";
import { useToast } from "@/hooks/use-toast";

export default function EditDepartmentPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const { data: department, isLoading, error } = useDepartment(id);
  const updateDepartment = useUpdateDepartment();

  const handleSubmit = async (data: DepartmentFormData) => {
    try {
      // Only include description if it has content (backend requires non-blank en if provided)
      const descEn = data.description?.en?.trim();
      const descAr = data.description?.ar?.trim();
      const hasDescription = descEn || descAr;

      await updateDepartment.mutateAsync({
        id,
        data: {
          name: { en: data.name.en, ar: data.name.ar || undefined },
          description: hasDescription ? {
            en: descEn || descAr || "", // Use en if available, else ar as fallback
            ar: descAr || undefined,
          } : undefined,
          parentDepartmentId: data.parentDepartmentId || undefined,
          sortOrder: data.sortOrder,
        },
      });

      toast({
        title: locale === "ar" ? "تم الحفظ" : "Saved",
        description: locale === "ar" ? "تم تحديث القسم بنجاح" : "Department updated successfully",
      });

      router.push(`/${locale}/departments/${id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في تحديث القسم" : "Failed to update department",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/departments`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "خطأ" : "Error"}
          </h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            {locale === "ar" ? "فشل في تحميل بيانات القسم" : "Failed to load department data"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/departments/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "تعديل القسم" : "Edit Department"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar" ? "تحديث بيانات القسم" : "Update department information"}
          </p>
        </div>
      </div>

      {/* Form */}
      <DepartmentForm
        department={department}
        onSubmit={handleSubmit}
        isPending={updateDepartment.isPending}
      />
    </div>
  );
}
