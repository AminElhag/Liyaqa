"use client";

import { useLocale } from "next-intl";
import {
  User,
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { ScrollArea } from "@liyaqa/shared/components/ui/scroll-area";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import type { LocalCartItem, LocalCartCustomer } from "@liyaqa/shared/hooks/use-local-cart";

interface PosCartSidebarProps {
  items: LocalCartItem[];
  customer: LocalCartCustomer | null;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  itemCount: number;
  isEmpty: boolean;
  canCheckout: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearItems: () => void;
  onSelectCustomer: () => void;
  onClearCustomer: () => void;
  onCheckout: () => void;
  isCheckoutLoading?: boolean;
}

export function PosCartSidebar({
  items,
  customer,
  subtotal,
  taxTotal,
  grandTotal,
  itemCount,
  isEmpty,
  canCheckout,
  onUpdateQuantity,
  onRemoveItem,
  onClearItems,
  onSelectCustomer,
  onClearCustomer,
  onCheckout,
  isCheckoutLoading = false,
}: PosCartSidebarProps) {
  const locale = useLocale();

  const texts = {
    cart: locale === "ar" ? "السلة" : "Cart",
    customer: locale === "ar" ? "العميل" : "Customer",
    selectCustomer: locale === "ar" ? "اختر العميل" : "Select Customer",
    requiredBeforeCheckout:
      locale === "ar" ? "مطلوب قبل الدفع" : "Required before checkout",
    noCustomer: locale === "ar" ? "لم يتم اختيار عميل" : "No customer selected",
    emptyCart: locale === "ar" ? "السلة فارغة" : "Cart is empty",
    emptyCartHint:
      locale === "ar"
        ? "أضف منتجات للبدء"
        : "Add products to get started",
    subtotal: locale === "ar" ? "المجموع الفرعي" : "Subtotal",
    vat: locale === "ar" ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)",
    total: locale === "ar" ? "الإجمالي" : "Total",
    checkout: locale === "ar" ? "إتمام الشراء" : "Checkout",
    clearCart: locale === "ar" ? "إفراغ السلة" : "Clear Cart",
    items: locale === "ar" ? "عنصر" : "items",
    sar: locale === "ar" ? "ر.س" : "SAR",
  };

  const formatPrice = (amount: number) => {
    return `${texts.sar} ${amount.toFixed(2)}`;
  };

  const getProductName = (item: LocalCartItem): string => {
    const name = item.product.name;
    if (typeof name === "object") {
      return (locale === "ar" ? name.ar || name.en : name.en || name.ar) || "";
    }
    return name || "";
  };

  const getProductPrice = (item: LocalCartItem) => {
    return item.product.listPrice?.amount ?? 0;
  };

  return (
    <Card className="h-full flex flex-col bg-card border shadow-sm">
      {/* Header */}
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {texts.cart}
          </CardTitle>
          {itemCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {itemCount} {texts.items}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Customer Section */}
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {texts.customer}
          </div>
          {customer ? (
            <div className="flex items-center justify-between gap-2 p-3 bg-card rounded-lg border border-primary/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {customer.name}
                  </div>
                  {customer.phone && (
                    <div className="text-xs text-muted-foreground truncate">
                      {customer.phone}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                onClick={onClearCustomer}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              className="w-full flex flex-col items-center justify-center gap-1 h-14 border-2 border-dashed border-primary/40 text-primary rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              onClick={onSelectCustomer}
            >
              <span className="flex items-center gap-2 font-medium text-sm">
                <UserPlus className="h-4 w-4" />
                {texts.selectCustomer}
              </span>
              <span className="text-xs text-primary/60">
                {texts.requiredBeforeCheckout}
              </span>
            </button>
          )}
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isEmpty ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-muted-foreground font-medium">{texts.emptyCart}</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {texts.emptyCartHint}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  {/* Product Image Placeholder */}
                  <div className="h-12 w-12 rounded-md bg-muted flex-shrink-0 flex items-center justify-center">
                    {item.product.imageUrl ? (
                      <img
                        src={String(item.product.imageUrl)}
                        alt={getProductName(item)}
                        className="h-full w-full object-cover rounded-md"
                      />
                    ) : (
                      <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {getProductName(item)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatPrice(getProductPrice(item))}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-border rounded-md bg-card">
                        <button
                          className="p-2 hover:bg-muted rounded-s-md transition-colors"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.quantity - 1)
                          }
                        >
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          className="p-2 hover:bg-muted rounded-e-md transition-colors"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                      <button
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        onClick={() => onRemoveItem(item.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-sm font-semibold text-foreground flex-shrink-0">
                    {formatPrice(getProductPrice(item) * item.quantity)}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Totals & Actions */}
        {!isEmpty && (
          <div className="border-t border-border bg-muted/30 p-4 space-y-4">
            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{texts.subtotal}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{texts.vat}</span>
                <span>{formatPrice(taxTotal)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg text-foreground">
                <span>{texts.total}</span>
                <span className="text-primary">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full h-14 text-base bg-primary hover:bg-[#E85D3A] text-white font-semibold"
                disabled={!canCheckout || isCheckoutLoading}
                onClick={onCheckout}
              >
                {isCheckoutLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {texts.checkout}...
                  </span>
                ) : (
                  texts.checkout
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={onClearItems}
              >
                <Trash2 className="h-4 w-4 me-2" />
                {texts.clearCart}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
