"use client";

import { use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronLeft, Edit, Tag, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  useProductCategory,
  useActivateProductCategory,
  useDeactivateProductCategory,
} from "@liyaqa/shared/queries/use-products";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { getLocalizedText } from "@liyaqa/shared/utils";
import { DEPARTMENT_LABELS } from "@liyaqa/shared/types/product";

interface CategoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const { toast } = useToast();

  const { data: category, isLoading, error } = useProductCategory(id);
  const activateCategory = useActivateProductCategory();
  const deactivateCategory = useDeactivateProductCategory();

  const texts = {
    back: locale === "ar" ? "العودة للفئات" : "Back to categories",
    edit: locale === "ar" ? "تعديل" : "Edit",
    details: locale === "ar" ? "التفاصيل" : "Details",
    name: locale === "ar" ? "الاسم" : "Name",
    description: locale === "ar" ? "الوصف" : "Description",
    department: locale === "ar" ? "القسم" : "Department",
    icon: locale === "ar" ? "الأيقونة" : "Icon",
    sortOrder: locale === "ar" ? "ترتيب العرض" : "Sort Order",
    status: locale === "ar" ? "الحالة" : "Status",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    notFound: locale === "ar" ? "لم يتم العثور على الفئة" : "Category not found",
    noDescription: locale === "ar" ? "لا يوجد وصف" : "No description",
  };

  const handleActivate = async () => {
    try {
      await activateCategory.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التفعيل" : "Activated",
        description: locale === "ar" ? "تم تفعيل الفئة بنجاح" : "Category activated successfully",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في تفعيل الفئة" : "Failed to activate category",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateCategory.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم إلغاء التفعيل" : "Deactivated",
        description: locale === "ar" ? "تم إلغاء تفعيل الفئة بنجاح" : "Category deactivated successfully",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في إلغاء تفعيل الفئة" : "Failed to deactivate category",
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
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href={`/${locale}/product-categories`}>
              <ChevronLeft className="h-4 w-4 me-1" />
              {texts.back}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900">
            {getLocalizedText(category.name, locale)}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={category.isActive ? "default" : "secondary"}>
              {category.isActive ? texts.active : texts.inactive}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {category.isActive ? (
            <Button
              variant="outline"
              onClick={handleDeactivate}
              disabled={deactivateCategory.isPending}
            >
              <XCircle className="h-4 w-4 me-2" />
              {texts.deactivate}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleActivate}
              disabled={activateCategory.isPending}
            >
              <CheckCircle className="h-4 w-4 me-2" />
              {texts.activate}
            </Button>
          )}
          <Button asChild>
            <Link href={`/${locale}/product-categories/${id}/edit`}>
              <Edit className="h-4 w-4 me-2" />
              {texts.edit}
            </Link>
          </Button>
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.details}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.name} (EN)</p>
              <p className="font-medium">{category.name.en}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.name} (AR)</p>
              <p className="font-medium" dir="rtl">
                {category.name.ar || "-"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.description} (EN)</p>
              <p className="font-medium">
                {category.description?.en || texts.noDescription}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.description} (AR)</p>
              <p className="font-medium" dir="rtl">
                {category.description?.ar || texts.noDescription}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.department}</p>
              <p className="font-medium">
                {DEPARTMENT_LABELS[category.department][locale as "en" | "ar"]}
                {category.customDepartment && ` (${category.customDepartment})`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.icon}</p>
              <p className="font-medium">{category.icon || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.sortOrder}</p>
              <p className="font-medium">{category.sortOrder}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
