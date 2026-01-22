"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProductCategoryForm,
  type ProductCategoryFormData,
} from "@/components/forms/product-category-form";
import { useCreateProductCategory } from "@/queries/use-products";
import { useToast } from "@/hooks/use-toast";

export default function NewProductCategoryPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const createCategory = useCreateProductCategory();

  const texts = {
    back: locale === "ar" ? "العودة للفئات" : "Back to categories",
    title: locale === "ar" ? "إضافة فئة جديدة" : "Add New Category",
    subtitle: locale === "ar" ? "أدخل معلومات الفئة الجديدة" : "Enter the new category details",
    success: locale === "ar" ? "تم الإنشاء" : "Created",
    successDesc: locale === "ar" ? "تم إنشاء الفئة بنجاح" : "Category created successfully",
    error: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "فشل في إنشاء الفئة" : "Failed to create category",
  };

  const handleSubmit = async (data: ProductCategoryFormData) => {
    try {
      const result = await createCategory.mutateAsync({
        name: {
          en: data.nameEn,
          ar: data.nameAr || undefined,
        },
        description:
          data.descriptionEn || data.descriptionAr
            ? {
                en: data.descriptionEn || "",
                ar: data.descriptionAr || undefined,
              }
            : undefined,
        icon: data.icon || undefined,
        department: data.department,
        customDepartment: data.customDepartment || undefined,
        sortOrder: data.sortOrder,
      });
      toast({
        title: texts.success,
        description: texts.successDesc,
      });
      router.push(`/${locale}/product-categories/${result.id}`);
    } catch {
      toast({
        title: texts.error,
        description: texts.errorDesc,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/product-categories`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">{texts.title}</h1>
        <p className="text-neutral-500">{texts.subtitle}</p>
      </div>

      <ProductCategoryForm
        onSubmit={handleSubmit}
        isPending={createCategory.isPending}
      />
    </div>
  );
}
