"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import { Checkbox } from "@liyaqa/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import type {
  Product,
  ProductType,
  ProductCategory,
  ZoneAccessType,
  ProductSummary,
} from "@liyaqa/shared/types/product";
import {
  PRODUCT_TYPE_LABELS,
  ZONE_ACCESS_LABELS,
} from "@liyaqa/shared/types/product";
import { getLocalizedText } from "@liyaqa/shared/utils";

const bundleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().min(1),
});

const schema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  sku: z.string().optional(),
  productType: z.enum(["GOODS", "SERVICE", "BUNDLE"] as const),
  categoryId: z.string().uuid().optional().nullable(),
  listPrice: z.number().min(0, "Price must be non-negative"),
  currency: z.string().default("SAR"),
  taxRate: z.number().min(0).max(100).default(15),
  // Stock pricing
  enableStockPricing: z.boolean().default(false),
  lowStockThreshold: z.number().min(0).default(10),
  lowStockPrice: z.number().min(0).optional().nullable(),
  outOfStockPrice: z.number().min(0).optional().nullable(),
  // Inventory
  trackInventory: z.boolean().default(false),
  stockQuantity: z.number().min(0).optional().nullable(),
  // Expiration
  hasExpiration: z.boolean().default(false),
  expirationDays: z.number().min(1).optional().nullable(),
  // Zone access
  zoneAccess: z.array(z.enum([
    "LOCKER_ROOM",
    "SAUNA",
    "POOL",
    "SPA",
    "VIP_AREA",
    "STUDIO",
    "OTHER",
  ] as const)).default([]),
  accessDurationDays: z.number().min(1).optional().nullable(),
  // Restrictions
  isSingleUse: z.boolean().default(false),
  maxQuantityPerOrder: z.number().min(1).optional().nullable(),
  // Display
  sortOrder: z.number().min(0).default(0),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  // Bundle items
  bundleItems: z.array(bundleItemSchema).optional(),
});

export type ProductFormData = z.infer<typeof schema>;

interface ProductFormProps {
  product?: Product;
  categories: ProductCategory[];
  availableProducts: ProductSummary[]; // For bundle item selection
  onSubmit: (data: ProductFormData) => Promise<void>;
  isPending?: boolean;
}

const PRODUCT_TYPES: ProductType[] = ["GOODS", "SERVICE", "BUNDLE"];

const ZONE_TYPES: ZoneAccessType[] = [
  "LOCKER_ROOM",
  "SAUNA",
  "POOL",
  "SPA",
  "VIP_AREA",
  "STUDIO",
  "OTHER",
];

export function ProductForm({
  product,
  categories,
  availableProducts,
  onSubmit,
  isPending,
}: ProductFormProps) {
  const locale = useLocale();

  const texts = {
    basicInfo: locale === "ar" ? "المعلومات الأساسية" : "Basic Information",
    nameEn: locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
    descriptionEn: locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)",
    descriptionAr: locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)",
    sku: locale === "ar" ? "رمز المنتج" : "SKU",
    classification: locale === "ar" ? "التصنيف" : "Classification",
    productType: locale === "ar" ? "نوع المنتج" : "Product Type",
    category: locale === "ar" ? "الفئة" : "Category",
    selectCategory: locale === "ar" ? "اختر فئة" : "Select category",
    noCategory: locale === "ar" ? "بدون فئة" : "No category",
    pricing: locale === "ar" ? "التسعير" : "Pricing",
    listPrice: locale === "ar" ? "السعر" : "List Price",
    currency: locale === "ar" ? "العملة" : "Currency",
    taxRate: locale === "ar" ? "نسبة الضريبة (%)" : "Tax Rate (%)",
    stockPricing: locale === "ar" ? "تسعير حسب المخزون" : "Stock-based Pricing",
    enableStockPricing: locale === "ar" ? "تفعيل التسعير حسب المخزون" : "Enable stock-based pricing",
    lowStockThreshold: locale === "ar" ? "حد المخزون المنخفض" : "Low Stock Threshold",
    lowStockPrice: locale === "ar" ? "سعر المخزون المنخفض" : "Low Stock Price",
    outOfStockPrice: locale === "ar" ? "سعر نفاد المخزون" : "Out of Stock Price",
    inventory: locale === "ar" ? "المخزون" : "Inventory",
    trackInventory: locale === "ar" ? "تتبع المخزون" : "Track Inventory",
    stockQuantity: locale === "ar" ? "الكمية المتوفرة" : "Stock Quantity",
    zoneAccess: locale === "ar" ? "صلاحية الوصول للمناطق" : "Zone Access",
    selectZones: locale === "ar" ? "اختر المناطق المتاحة" : "Select zones this product grants access to",
    accessDuration: locale === "ar" ? "مدة الوصول (أيام)" : "Access Duration (days)",
    restrictions: locale === "ar" ? "القيود" : "Restrictions",
    singleUse: locale === "ar" ? "شراء مرة واحدة فقط" : "Single Use (One-time purchase per member)",
    maxQuantity: locale === "ar" ? "الحد الأقصى للكمية في الطلب" : "Max Quantity Per Order",
    expiration: locale === "ar" ? "انتهاء الصلاحية" : "Expiration",
    hasExpiration: locale === "ar" ? "له تاريخ انتهاء" : "Has Expiration",
    expirationDays: locale === "ar" ? "أيام حتى الانتهاء" : "Days Until Expiration",
    display: locale === "ar" ? "العرض" : "Display",
    sortOrder: locale === "ar" ? "ترتيب العرض" : "Sort Order",
    imageUrl: locale === "ar" ? "رابط الصورة" : "Image URL",
    bundleItems: locale === "ar" ? "عناصر الحزمة" : "Bundle Items",
    addItem: locale === "ar" ? "إضافة عنصر" : "Add Item",
    selectProduct: locale === "ar" ? "اختر منتج" : "Select product",
    quantity: locale === "ar" ? "الكمية" : "Quantity",
    save: locale === "ar" ? "حفظ" : "Save",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameEn: product?.name.en || "",
      nameAr: product?.name.ar || "",
      descriptionEn: product?.description?.en || "",
      descriptionAr: product?.description?.ar || "",
      sku: product?.sku || "",
      productType: product?.productType || "GOODS",
      categoryId: product?.category?.id || null,
      listPrice: product?.listPrice?.amount || 0,
      currency: product?.listPrice?.currency || "SAR",
      taxRate: product?.taxRate || 15,
      enableStockPricing: !!product?.stockPricing,
      lowStockThreshold: product?.stockPricing?.lowStockThreshold || 10,
      lowStockPrice: product?.stockPricing?.lowStockPrice?.amount || null,
      outOfStockPrice: product?.stockPricing?.outOfStockPrice?.amount || null,
      trackInventory: product?.trackInventory || false,
      stockQuantity: product?.stockQuantity ?? null,
      hasExpiration: product?.hasExpiration || false,
      expirationDays: product?.expirationDays ?? null,
      zoneAccess: (product?.zoneAccess || []) as ZoneAccessType[],
      accessDurationDays: product?.accessDurationDays ?? null,
      isSingleUse: product?.isSingleUse || false,
      maxQuantityPerOrder: product?.maxQuantityPerOrder ?? null,
      sortOrder: product?.sortOrder || 0,
      imageUrl: product?.imageUrl || "",
      bundleItems: product?.bundleItems?.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "bundleItems",
  });

  const selectedProductType = watch("productType");
  const enableStockPricing = watch("enableStockPricing");
  const trackInventory = watch("trackInventory");
  const hasExpiration = watch("hasExpiration");
  const selectedZones = watch("zoneAccess");

  const handleZoneToggle = (zone: ZoneAccessType) => {
    const current = selectedZones || [];
    if (current.includes(zone)) {
      setValue("zoneAccess", current.filter(z => z !== zone));
    } else {
      setValue("zoneAccess", [...current, zone]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 1. Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.basicInfo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameEn">{texts.nameEn}</Label>
              <Input id="nameEn" {...register("nameEn")} />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">{texts.nameAr}</Label>
              <Input id="nameAr" dir="rtl" {...register("nameAr")} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">{texts.descriptionEn}</Label>
              <Textarea id="descriptionEn" {...register("descriptionEn")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionAr">{texts.descriptionAr}</Label>
              <Textarea id="descriptionAr" dir="rtl" {...register("descriptionAr")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">{texts.sku}</Label>
            <Input id="sku" {...register("sku")} placeholder="SKU-001" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Classification */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.classification}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{texts.productType}</Label>
              <Select
                value={selectedProductType}
                onValueChange={(value) => setValue("productType", value as ProductType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PRODUCT_TYPE_LABELS[type][locale as "en" | "ar"]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{texts.category}</Label>
              <Select
                value={watch("categoryId") || "none"}
                onValueChange={(value) => setValue("categoryId", value === "none" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{texts.noCategory}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getLocalizedText(cat.name, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.pricing}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="listPrice">{texts.listPrice}</Label>
              <Input
                id="listPrice"
                type="number"
                step="0.01"
                min="0"
                {...register("listPrice", { valueAsNumber: true })}
              />
              {errors.listPrice && (
                <p className="text-sm text-destructive">{errors.listPrice.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{texts.currency}</Label>
              <Select
                value={watch("currency")}
                onValueChange={(value) => setValue("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">{texts.taxRate}</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register("taxRate", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Stock-based pricing */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="enableStockPricing"
                checked={enableStockPricing}
                onCheckedChange={(checked) => setValue("enableStockPricing", checked)}
              />
              <Label htmlFor="enableStockPricing">{texts.enableStockPricing}</Label>
            </div>

            {enableStockPricing && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">{texts.lowStockThreshold}</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    {...register("lowStockThreshold", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockPrice">{texts.lowStockPrice}</Label>
                  <Input
                    id="lowStockPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("lowStockPrice", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outOfStockPrice">{texts.outOfStockPrice}</Label>
                  <Input
                    id="outOfStockPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("outOfStockPrice", { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Inventory (for GOODS only) */}
      {selectedProductType === "GOODS" && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.inventory}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="trackInventory"
                checked={trackInventory}
                onCheckedChange={(checked) => setValue("trackInventory", checked)}
              />
              <Label htmlFor="trackInventory">{texts.trackInventory}</Label>
            </div>

            {trackInventory && (
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">{texts.stockQuantity}</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  {...register("stockQuantity", { valueAsNumber: true })}
                />
              </div>
            )}

            {/* Expiration */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="hasExpiration"
                  checked={hasExpiration}
                  onCheckedChange={(checked) => setValue("hasExpiration", checked)}
                />
                <Label htmlFor="hasExpiration">{texts.hasExpiration}</Label>
              </div>

              {hasExpiration && (
                <div className="space-y-2">
                  <Label htmlFor="expirationDays">{texts.expirationDays}</Label>
                  <Input
                    id="expirationDays"
                    type="number"
                    min="1"
                    {...register("expirationDays", { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Zone Access */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.zoneAccess}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{texts.selectZones}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ZONE_TYPES.map((zone) => (
              <div key={zone} className="flex items-center space-x-2">
                <Checkbox
                  id={`zone-${zone}`}
                  checked={selectedZones?.includes(zone)}
                  onCheckedChange={() => handleZoneToggle(zone)}
                />
                <Label htmlFor={`zone-${zone}`} className="text-sm">
                  {ZONE_ACCESS_LABELS[zone][locale as "en" | "ar"]}
                </Label>
              </div>
            ))}
          </div>

          {selectedZones && selectedZones.length > 0 && (
            <div className="space-y-2 mt-4">
              <Label htmlFor="accessDurationDays">{texts.accessDuration}</Label>
              <Input
                id="accessDurationDays"
                type="number"
                min="1"
                placeholder={locale === "ar" ? "بدون حدود (دائم)" : "Leave empty for permanent"}
                {...register("accessDurationDays", { valueAsNumber: true })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.restrictions}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="isSingleUse"
              checked={watch("isSingleUse")}
              onCheckedChange={(checked) => setValue("isSingleUse", checked)}
            />
            <Label htmlFor="isSingleUse">{texts.singleUse}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxQuantityPerOrder">{texts.maxQuantity}</Label>
            <Input
              id="maxQuantityPerOrder"
              type="number"
              min="1"
              placeholder={locale === "ar" ? "بدون حدود" : "Leave empty for unlimited"}
              {...register("maxQuantityPerOrder", { valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 7. Bundle Items (for BUNDLE only) */}
      {selectedProductType === "BUNDLE" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{texts.bundleItems}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productId: "", quantity: 1 })}
            >
              <Plus className="h-4 w-4 me-1" />
              {texts.addItem}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label>{texts.selectProduct}</Label>
                  <Select
                    value={watch(`bundleItems.${index}.productId`)}
                    onValueChange={(value) => setValue(`bundleItems.${index}.productId`, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={texts.selectProduct} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts
                        .filter(p => p.productType !== "BUNDLE")
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {getLocalizedText(p.name, locale)} ({p.listPrice.amount} {p.listPrice.currency})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label>{texts.quantity}</Label>
                  <Input
                    type="number"
                    min="1"
                    {...register(`bundleItems.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {locale === "ar" ? "لم يتم إضافة أي عناصر بعد" : "No items added yet"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Display */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.display}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">{texts.sortOrder}</Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">{texts.imageUrl}</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://..."
                {...register("imageUrl")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? texts.saving : texts.save}
        </Button>
      </div>
    </form>
  );
}
