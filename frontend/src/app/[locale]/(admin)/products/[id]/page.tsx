"use client";

import { use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ChevronLeft,
  Edit,
  Package,
  CheckCircle,
  XCircle,
  StopCircle,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProduct,
  usePublishProduct,
  useActivateProduct,
  useDeactivateProduct,
  useDiscontinueProduct,
} from "@/queries/use-products";
import { useToast } from "@/hooks/use-toast";
import { getLocalizedText, formatCurrency } from "@/lib/utils";
import {
  PRODUCT_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  ZONE_ACCESS_LABELS,
} from "@/types/product";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const { toast } = useToast();

  const { data: product, isLoading, error } = useProduct(id);
  const publishProduct = usePublishProduct();
  const activateProduct = useActivateProduct();
  const deactivateProduct = useDeactivateProduct();
  const discontinueProduct = useDiscontinueProduct();

  const texts = {
    back: locale === "ar" ? "العودة للمنتجات" : "Back to products",
    edit: locale === "ar" ? "تعديل" : "Edit",
    details: locale === "ar" ? "التفاصيل" : "Details",
    pricing: locale === "ar" ? "التسعير" : "Pricing",
    inventory: locale === "ar" ? "المخزون" : "Inventory",
    access: locale === "ar" ? "صلاحية الوصول" : "Access",
    restrictions: locale === "ar" ? "القيود" : "Restrictions",
    bundleItems: locale === "ar" ? "عناصر الحزمة" : "Bundle Items",
    name: locale === "ar" ? "الاسم" : "Name",
    description: locale === "ar" ? "الوصف" : "Description",
    type: locale === "ar" ? "النوع" : "Type",
    category: locale === "ar" ? "الفئة" : "Category",
    sku: locale === "ar" ? "رمز المنتج" : "SKU",
    listPrice: locale === "ar" ? "السعر" : "List Price",
    effectivePrice: locale === "ar" ? "السعر الفعلي" : "Effective Price",
    grossPrice: locale === "ar" ? "السعر الإجمالي" : "Gross Price",
    taxRate: locale === "ar" ? "نسبة الضريبة" : "Tax Rate",
    stockQuantity: locale === "ar" ? "الكمية المتوفرة" : "Stock Quantity",
    trackInventory: locale === "ar" ? "تتبع المخزون" : "Track Inventory",
    zoneAccess: locale === "ar" ? "المناطق المتاحة" : "Zone Access",
    accessDuration: locale === "ar" ? "مدة الوصول" : "Access Duration",
    singleUse: locale === "ar" ? "شراء مرة واحدة" : "Single Use",
    maxQuantity: locale === "ar" ? "الحد الأقصى للكمية" : "Max Quantity",
    expiration: locale === "ar" ? "انتهاء الصلاحية" : "Expiration",
    status: locale === "ar" ? "الحالة" : "Status",
    publish: locale === "ar" ? "نشر" : "Publish",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    discontinue: locale === "ar" ? "إيقاف" : "Discontinue",
    notFound: locale === "ar" ? "لم يتم العثور على المنتج" : "Product not found",
    noDescription: locale === "ar" ? "لا يوجد وصف" : "No description",
    noCategory: locale === "ar" ? "بدون فئة" : "No category",
    unlimited: locale === "ar" ? "غير محدود" : "Unlimited",
    permanent: locale === "ar" ? "دائم" : "Permanent",
    days: locale === "ar" ? "يوم" : "days",
    yes: locale === "ar" ? "نعم" : "Yes",
    no: locale === "ar" ? "لا" : "No",
    quantity: locale === "ar" ? "الكمية" : "Quantity",
    lineValue: locale === "ar" ? "القيمة" : "Value",
    bundleValue: locale === "ar" ? "قيمة الحزمة" : "Bundle Value",
    error: locale === "ar" ? "خطأ" : "Error",
  };

  const handlePublish = async () => {
    try {
      await publishProduct.mutateAsync(id);
      toast({ title: locale === "ar" ? "تم النشر" : "Published" });
    } catch {
      toast({ title: texts.error, variant: "destructive" });
    }
  };

  const handleActivate = async () => {
    try {
      await activateProduct.mutateAsync(id);
      toast({ title: locale === "ar" ? "تم التفعيل" : "Activated" });
    } catch {
      toast({ title: texts.error, variant: "destructive" });
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateProduct.mutateAsync(id);
      toast({ title: locale === "ar" ? "تم إلغاء التفعيل" : "Deactivated" });
    } catch {
      toast({ title: texts.error, variant: "destructive" });
    }
  };

  const handleDiscontinue = async () => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من إيقاف هذا المنتج؟" : "Are you sure you want to discontinue this product?")) {
      return;
    }
    try {
      await discontinueProduct.mutateAsync(id);
      toast({ title: locale === "ar" ? "تم الإيقاف" : "Discontinued" });
    } catch {
      toast({ title: texts.error, variant: "destructive" });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "INACTIVE":
        return "secondary";
      case "DRAFT":
        return "outline";
      case "DISCONTINUED":
        return "destructive";
      default:
        return "secondary";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href={`/${locale}/products`}>
              <ChevronLeft className="h-4 w-4 me-1" />
              {texts.back}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900">
            {getLocalizedText(product.name, locale)}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={getStatusVariant(product.status)}>
              {PRODUCT_STATUS_LABELS[product.status][locale as "en" | "ar"]}
            </Badge>
            <Badge variant="outline">
              {PRODUCT_TYPE_LABELS[product.productType][locale as "en" | "ar"]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {product.status === "DRAFT" && (
            <Button variant="outline" onClick={handlePublish} disabled={publishProduct.isPending}>
              <PlayCircle className="h-4 w-4 me-2" />
              {texts.publish}
            </Button>
          )}
          {product.status === "ACTIVE" && (
            <Button variant="outline" onClick={handleDeactivate} disabled={deactivateProduct.isPending}>
              <XCircle className="h-4 w-4 me-2" />
              {texts.deactivate}
            </Button>
          )}
          {product.status === "INACTIVE" && (
            <>
              <Button variant="outline" onClick={handleActivate} disabled={activateProduct.isPending}>
                <CheckCircle className="h-4 w-4 me-2" />
                {texts.activate}
              </Button>
              <Button variant="outline" onClick={handleDiscontinue} disabled={discontinueProduct.isPending}>
                <StopCircle className="h-4 w-4 me-2" />
                {texts.discontinue}
              </Button>
            </>
          )}
          <Button asChild>
            <Link href={`/${locale}/products/${id}/edit`}>
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
              <p className="font-medium">{product.name.en}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.name} (AR)</p>
              <p className="font-medium" dir="rtl">{product.name.ar || "-"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.description} (EN)</p>
              <p className="font-medium">{product.description?.en || texts.noDescription}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.description} (AR)</p>
              <p className="font-medium" dir="rtl">{product.description?.ar || texts.noDescription}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.sku}</p>
              <p className="font-medium">{product.sku || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.category}</p>
              <p className="font-medium">
                {product.category ? getLocalizedText(product.category.name, locale) : texts.noCategory}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.type}</p>
              <p className="font-medium">
                {PRODUCT_TYPE_LABELS[product.productType][locale as "en" | "ar"]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.pricing}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.listPrice}</p>
              <p className="font-medium text-lg">
                {formatCurrency(product.listPrice.amount, product.listPrice.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.effectivePrice}</p>
              <p className="font-medium text-lg">
                {formatCurrency(product.effectivePrice.amount, product.effectivePrice.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.grossPrice}</p>
              <p className="font-medium text-lg">
                {formatCurrency(product.grossPrice.amount, product.grossPrice.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.taxRate}</p>
              <p className="font-medium">{product.taxRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory (for GOODS) */}
      {product.productType === "GOODS" && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.inventory}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{texts.trackInventory}</p>
                <p className="font-medium">{product.trackInventory ? texts.yes : texts.no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{texts.stockQuantity}</p>
                <p className="font-medium">
                  {product.trackInventory ? (product.stockQuantity ?? 0) : texts.unlimited}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{texts.expiration}</p>
                <p className="font-medium">
                  {product.hasExpiration ? `${product.expirationDays} ${texts.days}` : texts.no}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone Access */}
      {product.zoneAccess.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.access}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.zoneAccess}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {product.zoneAccess.map((zone) => (
                  <Badge key={zone} variant="outline">
                    {ZONE_ACCESS_LABELS[zone][locale as "en" | "ar"]}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.accessDuration}</p>
              <p className="font-medium">
                {product.accessDurationDays
                  ? `${product.accessDurationDays} ${texts.days}`
                  : texts.permanent}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.restrictions}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.singleUse}</p>
              <p className="font-medium">{product.isSingleUse ? texts.yes : texts.no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.maxQuantity}</p>
              <p className="font-medium">{product.maxQuantityPerOrder ?? texts.unlimited}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bundle Items */}
      {product.productType === "BUNDLE" && product.bundleItems && product.bundleItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.bundleItems}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {product.bundleItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{getLocalizedText(item.product.name, locale)}</p>
                    <p className="text-sm text-muted-foreground">
                      {texts.quantity}: {item.quantity}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-medium">
                      {formatCurrency(item.lineValue.amount, item.lineValue.currency)}
                    </p>
                  </div>
                </div>
              ))}
              {product.bundleValue && (
                <div className="flex justify-between pt-3 border-t">
                  <p className="font-medium">{texts.bundleValue}</p>
                  <p className="font-bold">
                    {formatCurrency(product.bundleValue.amount, product.bundleValue.currency)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
