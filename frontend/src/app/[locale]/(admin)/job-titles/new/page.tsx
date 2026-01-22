"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobTitleForm, type JobTitleFormData } from "@/components/forms/job-title-form";
import { useCreateJobTitle } from "@/queries/use-job-titles";
import { useToast } from "@/hooks/use-toast";

export default function NewJobTitlePage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createJobTitle = useCreateJobTitle();

  const handleSubmit = async (data: JobTitleFormData) => {
    try {
      // Only include description if it has content (backend requires non-blank en if provided)
      const descEn = data.description?.en?.trim();
      const descAr = data.description?.ar?.trim();
      const hasDescription = descEn || descAr;

      await createJobTitle.mutateAsync({
        name: { en: data.name.en, ar: data.name.ar || undefined },
        description: hasDescription ? {
          en: descEn || descAr || "", // Use en if available, else ar as fallback
          ar: descAr || undefined,
        } : undefined,
        departmentId: data.departmentId || undefined,
        defaultRole: data.defaultRole,
        sortOrder: data.sortOrder,
      });

      toast({
        title: locale === "ar" ? "تم الإنشاء" : "Created",
        description: locale === "ar" ? "تم إنشاء المسمى الوظيفي بنجاح" : "Job title created successfully",
      });

      router.push(`/${locale}/job-titles`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في إنشاء المسمى الوظيفي" : "Failed to create job title",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/job-titles`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "إضافة مسمى وظيفي جديد" : "Add New Job Title"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar" ? "إنشاء مسمى وظيفي جديد مع تحديد الصلاحيات" : "Create a new job title with role permissions"}
          </p>
        </div>
      </div>

      {/* Form */}
      <JobTitleForm
        onSubmit={handleSubmit}
        isPending={createJobTitle.isPending}
      />
    </div>
  );
}
