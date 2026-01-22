"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm, type ProductFormData } from "@/components/forms/product-form";
import { useCreateProduct, useProducts, useProductCategories } from "@/queries/use-products";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function NewProductPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const createProduct = useCreateProduct();
  const { data: categoriesData, isLoading: categoriesLoading } = useProductCategories({ active: true, size: 100 });
  const { data: productsData, isLoading: productsLoading } = useProducts({ status: "ACTIVE", size: 100 });

  const texts = {
    back: locale === "ar" ? "العودة للمنتجات" : "Back to products",
    title: locale === "ar" ? "إضافة منتج جديد" : "Add New Product",
    subtitle: locale === "ar" ? "أدخل معلومات المنتج الجديد" : "Enter the new product details",
    success: locale === "ar" ? "تم الإنشاء" : "Created",
    successDesc: locale === "ar" ? "تم إنشاء المنتج بنجاح" : "Product created successfully",
    error: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "فشل في إنشاء المنتج" : "Failed to create product",
  };

  const handleSubmit = async (data: ProductFormData) => {
    try {
      const result = await createProduct.mutateAsync({
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
        sku: data.sku || undefined,
        productType: data.productType,
        categoryId: data.categoryId || undefined,
        listPrice: data.listPrice,
        currency: data.currency,
        taxRate: data.taxRate,
        stockPricing: data.enableStockPricing
          ? {
              lowStockThreshold: data.lowStockThreshold,
              lowStockPrice: data.lowStockPrice ?? undefined,
              outOfStockPrice: data.outOfStockPrice ?? undefined,
            }
          : undefined,
        stockQuantity: data.trackInventory ? data.stockQuantity ?? undefined : undefined,
        trackInventory: data.trackInventory,
        hasExpiration: data.hasExpiration,
        expirationDays: data.hasExpiration ? data.expirationDays ?? undefined : undefined,
        zoneAccess: data.zoneAccess,
        accessDurationDays: data.zoneAccess.length > 0 ? data.accessDurationDays ?? undefined : undefined,
        isSingleUse: data.isSingleUse,
        maxQuantityPerOrder: data.maxQuantityPerOrder ?? undefined,
        sortOrder: data.sortOrder,
        imageUrl: data.imageUrl || undefined,
        bundleItems: data.productType === "BUNDLE" ? data.bundleItems : undefined,
      });
      toast({
        title: texts.success,
        description: texts.successDesc,
      });
      router.push(`/${locale}/products/${result.id}`);
    } catch {
      toast({
        title: texts.error,
        description: texts.errorDesc,
        variant: "destructive",
      });
    }
  };

  if (categoriesLoading || productsLoading) {
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

  const categories = categoriesData?.content || [];
  const availableProducts = (productsData?.content || []).map(p => ({
    id: p.id,
    name: p.name,
    productType: p.productType,
    status: p.status,
    listPrice: p.listPrice,
    isAvailable: p.isAvailable,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/products`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">{texts.title}</h1>
        <p className="text-neutral-500">{texts.subtitle}</p>
      </div>

      <ProductForm
        categories={categories}
        availableProducts={availableProducts}
        onSubmit={handleSubmit}
        isPending={createProduct.isPending}
      />
    </div>
  );
}
