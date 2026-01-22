"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepartmentForm, type DepartmentFormData } from "@/components/forms/department-form";
import { useCreateDepartment } from "@/queries/use-departments";
import { useToast } from "@/hooks/use-toast";

export default function NewDepartmentPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createDepartment = useCreateDepartment();

  const handleSubmit = async (data: DepartmentFormData) => {
    try {
      // Only include description if it has content (backend requires non-blank en if provided)
      const descEn = data.description?.en?.trim();
      const descAr = data.description?.ar?.trim();
      const hasDescription = descEn || descAr;

      await createDepartment.mutateAsync({
        name: { en: data.name.en, ar: data.name.ar || undefined },
        description: hasDescription ? {
          en: descEn || descAr || "", // Use en if available, else ar as fallback
          ar: descAr || undefined,
        } : undefined,
        parentDepartmentId: data.parentDepartmentId || undefined,
        sortOrder: data.sortOrder,
      });

      toast({
        title: locale === "ar" ? "تم الإنشاء" : "Created",
        description: locale === "ar" ? "تم إنشاء القسم بنجاح" : "Department created successfully",
      });

      router.push(`/${locale}/departments`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في إنشاء القسم" : "Failed to create department",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/departments`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "إضافة قسم جديد" : "Add New Department"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar" ? "إنشاء قسم جديد في الهيكل التنظيمي" : "Create a new department in the organization structure"}
          </p>
        </div>
      </div>

      {/* Form */}
      <DepartmentForm
        onSubmit={handleSubmit}
        isPending={createDepartment.isPending}
      />
    </div>
  );
}
