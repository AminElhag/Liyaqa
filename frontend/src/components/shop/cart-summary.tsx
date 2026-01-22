"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocalizedText, formatCurrency } from "@/lib/utils";
import type { Cart } from "@/types/shop";

interface CartSummaryProps {
  cart: Cart | null | undefined;
  isLoading?: boolean;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemoveItem?: (productId: string) => void;
  onClear?: () => void;
  checkoutHref?: string;
  showActions?: boolean;
}

export function CartSummary({
  cart,
  isLoading = false,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  checkoutHref,
  showActions = true,
}: CartSummaryProps) {
  const locale = useLocale();

  const texts = {
    title: locale === "ar" ? "سلة التسوق" : "Shopping Cart",
    empty: locale === "ar" ? "السلة فارغة" : "Cart is empty",
    clear: locale === "ar" ? "إفراغ السلة" : "Clear Cart",
    subtotal: locale === "ar" ? "المجموع الفرعي" : "Subtotal",
    vat: locale === "ar" ? "ضريبة القيمة المضافة" : "VAT",
    total: locale === "ar" ? "الإجمالي" : "Total",
    checkout: locale === "ar" ? "إتمام الشراء" : "Checkout",
    items: locale === "ar" ? "عناصر" : "items",
  };

  if (isLoading) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Separator />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isEmpty = !cart?.items?.length;

  return (
    <Card className="sticky top-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          {texts.title}
          {!isEmpty && (
            <span className="text-sm font-normal text-muted-foreground">
              ({cart.itemCount} {texts.items})
            </span>
          )}
        </CardTitle>
        {!isEmpty && showActions && onClear && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onClear}
          >
            <Trash2 className="h-4 w-4 me-1" />
            {texts.clear}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty ? (
          <div className="py-8 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>{texts.empty}</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">
                      {getLocalizedText(item.productName, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(
                        item.unitPrice.amount,
                        item.unitPrice.currency
                      )}{" "}
                      x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatCurrency(
                        item.lineGross.amount,
                        item.lineGross.currency
                      )}
                    </p>
                    {showActions && onUpdateQuantity && onRemoveItem && (
                      <div className="flex items-center gap-1 mt-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-xs">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => onRemoveItem(item.productId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{texts.subtotal}</span>
                <span>
                  {formatCurrency(
                    cart.subtotal.amount,
                    cart.subtotal.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{texts.vat}</span>
                <span>
                  {formatCurrency(
                    cart.taxTotal.amount,
                    cart.taxTotal.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>{texts.total}</span>
                <span>
                  {formatCurrency(
                    cart.grandTotal.amount,
                    cart.grandTotal.currency
                  )}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            {checkoutHref && (
              <Button asChild className="w-full">
                <Link href={checkoutHref}>
                  {texts.checkout}
                  <ArrowRight className="h-4 w-4 ms-2" />
                </Link>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
