"use client";

import { use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ProductCategoryForm,
  type ProductCategoryFormData,
} from "@/components/forms/product-category-form";
import { useProductCategory, useUpdateProductCategory } from "@/queries/use-products";
import { useToast } from "@/hooks/use-toast";
import { getLocalizedText } from "@/lib/utils";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const { data: category, isLoading, error } = useProductCategory(id);
  const updateCategory = useUpdateProductCategory();

  const texts = {
    back: locale === "ar" ? "العودة للفئة" : "Back to category",
    title: locale === "ar" ? "تعديل الفئة" : "Edit Category",
    notFound: locale === "ar" ? "لم يتم العثور على الفئة" : "Category not found",
    success: locale === "ar" ? "تم الحفظ" : "Saved",
    successDesc: locale === "ar" ? "تم حفظ التغييرات بنجاح" : "Changes saved successfully",
    error: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "فشل في حفظ التغييرات" : "Failed to save changes",
  };

  const handleSubmit = async (data: ProductCategoryFormData) => {
    try {
      await updateCategory.mutateAsync({
        id,
        data: {
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
        },
      });
      toast({
        title: texts.success,
        description: texts.successDesc,
      });
      router.push(`/${locale}/product-categories/${id}`);
    } catch {
      toast({
        title: texts.error,
        description: texts.errorDesc,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/product-categories`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <Tag className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>{texts.notFound}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/product-categories/${id}`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">{texts.title}</h1>
        <p className="text-neutral-500">{getLocalizedText(category.name, locale)}</p>
      </div>

      <ProductCategoryForm
        category={category}
        onSubmit={handleSubmit}
        isPending={updateCategory.isPending}
      />
    </div>
  );
}
