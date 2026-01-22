"use client";

import { use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm, type ProductFormData } from "@/components/forms/product-form";
import {
  useProduct,
  useUpdateProduct,
  useProducts,
  useProductCategories,
} from "@/queries/use-products";
import { useToast } from "@/hooks/use-toast";
import { getLocalizedText } from "@/lib/utils";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const { data: product, isLoading: productLoading, error } = useProduct(id);
  const { data: categoriesData, isLoading: categoriesLoading } = useProductCategories({
    active: true,
    size: 100,
  });
  const { data: productsData, isLoading: productsLoading } = useProducts({
    status: "ACTIVE",
    size: 100,
  });
  const updateProduct = useUpdateProduct();

  const texts = {
    back: locale === "ar" ? "العودة للمنتج" : "Back to product",
    title: locale === "ar" ? "تعديل المنتج" : "Edit Product",
    notFound: locale === "ar" ? "لم يتم العثور على المنتج" : "Product not found",
    success: locale === "ar" ? "تم الحفظ" : "Saved",
    successDesc: locale === "ar" ? "تم حفظ التغييرات بنجاح" : "Changes saved successfully",
    error: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "فشل في حفظ التغييرات" : "Failed to save changes",
  };

  const handleSubmit = async (data: ProductFormData) => {
    try {
      await updateProduct.mutateAsync({
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
          sku: data.sku || undefined,
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
          accessDurationDays:
            data.zoneAccess.length > 0 ? data.accessDurationDays ?? undefined : undefined,
          isSingleUse: data.isSingleUse,
          maxQuantityPerOrder: data.maxQuantityPerOrder ?? undefined,
          sortOrder: data.sortOrder,
          imageUrl: data.imageUrl || undefined,
          bundleItems: product?.productType === "BUNDLE" ? data.bundleItems : undefined,
        },
      });
      toast({
        title: texts.success,
        description: texts.successDesc,
      });
      router.push(`/${locale}/products/${id}`);
    } catch {
      toast({
        title: texts.error,
        description: texts.errorDesc,
        variant: "destructive",
      });
    }
  };

  const isLoading = productLoading || categoriesLoading || productsLoading;

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

  if (error || !product) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/products`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>{texts.notFound}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = categoriesData?.content || [];
  const availableProducts = (productsData?.content || [])
    .filter((p) => p.id !== id) // Exclude current product
    .map((p) => ({
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
          <Link href={`/${locale}/products/${id}`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">{texts.title}</h1>
        <p className="text-neutral-500">{getLocalizedText(product.name, locale)}</p>
      </div>

      <ProductForm
        product={product}
        categories={categories}
        availableProducts={availableProducts}
        onSubmit={handleSubmit}
        isPending={updateProduct.isPending}
      />
    </div>
  );
}
