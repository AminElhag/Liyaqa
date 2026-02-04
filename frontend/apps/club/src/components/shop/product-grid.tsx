"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Search, Package, ShoppingCart, Minus, Plus } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { useShopProducts, useShopCategories } from "@liyaqa/shared/queries/use-shop";
import { getLocalizedText, formatCurrency } from "@liyaqa/shared/utils";
import { PRODUCT_TYPE_LABELS } from "@liyaqa/shared/types/product";
import type { Product } from "@liyaqa/shared/types/product";
import type { UUID } from "@liyaqa/shared/types/api";

interface ProductGridProps {
  onAddToCart: (productId: string, quantity: number, product?: Product) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ProductGrid({
  onAddToCart,
  disabled = false,
  isLoading: externalLoading = false,
}: ProductGridProps) {
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<UUID | "all">("all");
  const [page, setPage] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: products, isLoading: productsLoading } = useShopProducts({
    search: search || undefined,
    categoryId: categoryFilter === "all" ? undefined : categoryFilter,
    page,
    size: 12,
  });

  const { data: categories } = useShopCategories({ size: 50 });

  const isLoading = productsLoading || externalLoading;

  const texts = {
    search: locale === "ar" ? "بحث عن منتج..." : "Search products...",
    allCategories: locale === "ar" ? "جميع الفئات" : "All Categories",
    addToCart: locale === "ar" ? "أضف إلى السلة" : "Add to Cart",
    outOfStock: locale === "ar" ? "نفذ المخزون" : "Out of Stock",
    noProducts: locale === "ar" ? "لا توجد منتجات" : "No products found",
    previous: locale === "ar" ? "السابق" : "Previous",
    next: locale === "ar" ? "التالي" : "Next",
  };

  const getQuantity = (productId: string) => quantities[productId] || 1;

  const setQuantity = (productId: string, qty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, qty),
    }));
  };

  const handleAddToCart = (product: Product) => {
    if (disabled) return;
    onAddToCart(product.id, getQuantity(product.id), product);
    // Reset quantity after adding
    setQuantities((prev) => {
      const newState = { ...prev };
      delete newState[product.id];
      return newState;
    });
  };

  const isOutOfStock = (product: Product) => {
    return product.trackInventory && (product.stockQuantity ?? 0) <= 0;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={texts.search}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="ps-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value as UUID | "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={texts.allCategories} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{texts.allCategories}</SelectItem>
            {categories?.content?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {getLocalizedText(cat.name, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !products?.content?.length ? (
        <div className="py-12 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
          <p>{texts.noProducts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.content.map((product) => {
            const outOfStock = isOutOfStock(product);
            const qty = getQuantity(product.id);

            return (
              <Card
                key={product.id}
                className={outOfStock ? "opacity-60" : ""}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Product Image Placeholder */}
                  <div className="h-32 bg-muted rounded-md flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>

                  {/* Product Info */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium line-clamp-2">
                        {getLocalizedText(product.name, locale)}
                      </h3>
                      <Badge variant="outline" className="shrink-0">
                        {
                          PRODUCT_TYPE_LABELS[product.productType][
                            locale as "en" | "ar"
                          ]
                        }
                      </Badge>
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {getLocalizedText(product.description, locale)}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-lg font-bold">
                    {formatCurrency(
                      product.listPrice.amount,
                      product.listPrice.currency
                    )}
                  </div>

                  {/* Quantity & Add to Cart */}
                  {outOfStock ? (
                    <Button disabled className="w-full">
                      {texts.outOfStock}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-md">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-e-none"
                          onClick={() => setQuantity(product.id, qty - 1)}
                          disabled={qty <= 1 || disabled}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center text-sm font-medium">
                          {qty}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-s-none"
                          onClick={() => setQuantity(product.id, qty + 1)}
                          disabled={disabled}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        className="flex-1"
                        onClick={() => handleAddToCart(product)}
                        disabled={disabled}
                      >
                        <ShoppingCart className="h-4 w-4 me-2" />
                        {texts.addToCart}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {products && products.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            {texts.previous}
          </Button>
          <span className="py-2 px-4 text-sm">
            {page + 1} / {products.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= products.totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            {texts.next}
          </Button>
        </div>
      )}
    </div>
  );
}
