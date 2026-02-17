"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useCreateClassCategory } from "@liyaqa/shared/queries/use-class-categories";
import {
  ClassCategoryForm,
  type ClassCategoryFormData,
} from "@/components/admin/class-category-form";

export default function NewClassCategoryPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateClassCategory();

  const handleSubmit = (data: ClassCategoryFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: locale === "ar" ? "تم إنشاء الفئة" : "Category created",
        });
        router.push(`/${locale}/class-categories`);
      },
      onError: (error: Error) => {
        toast({
          title: locale === "ar" ? "فشل الإنشاء" : "Failed to create",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {locale === "ar" ? "فئة صفوف جديدة" : "New Class Category"}
        </h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "إنشاء فئة جديدة لتصنيف الصفوف"
            : "Create a new category to classify classes"}
        </p>
      </div>

      <ClassCategoryForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
