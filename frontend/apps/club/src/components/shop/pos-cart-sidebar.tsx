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
    <Card className="h-full flex flex-col bg-white border-neutral-200 shadow-sm">
      {/* Header */}
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-teal-600" />
            {texts.cart}
          </CardTitle>
          {itemCount > 0 && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700">
              {itemCount} {texts.items}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Customer Section */}
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            {texts.customer}
          </div>
          {customer ? (
            <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-lg border border-neutral-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-neutral-900 truncate">
                    {customer.name}
                  </div>
                  {customer.phone && (
                    <div className="text-xs text-neutral-500 truncate">
                      {customer.phone}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                onClick={onClearCustomer}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12 border-dashed border-neutral-300 text-neutral-600 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/50"
              onClick={onSelectCustomer}
            >
              <UserPlus className="h-4 w-4" />
              {texts.selectCustomer}
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isEmpty ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-neutral-200" />
                <p className="text-neutral-500 font-medium">{texts.emptyCart}</p>
                <p className="text-sm text-neutral-400 mt-1">
                  {texts.emptyCartHint}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
                >
                  {/* Product Image Placeholder */}
                  <div className="h-12 w-12 rounded-md bg-neutral-200 flex-shrink-0 flex items-center justify-center">
                    {item.product.imageUrl ? (
                      <img
                        src={String(item.product.imageUrl)}
                        alt={getProductName(item)}
                        className="h-full w-full object-cover rounded-md"
                      />
                    ) : (
                      <ShoppingCart className="h-5 w-5 text-neutral-400" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-neutral-900 truncate">
                      {getProductName(item)}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {formatPrice(getProductPrice(item))}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-neutral-200 rounded-md bg-white">
                        <button
                          className="p-1 hover:bg-neutral-100 rounded-l-md transition-colors"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3 text-neutral-600" />
                        </button>
                        <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          className="p-1 hover:bg-neutral-100 rounded-r-md transition-colors"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3 text-neutral-600" />
                        </button>
                      </div>
                      <button
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        onClick={() => onRemoveItem(item.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-sm font-semibold text-neutral-900 flex-shrink-0">
                    {formatPrice(getProductPrice(item) * item.quantity)}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Totals & Actions */}
        {!isEmpty && (
          <div className="border-t border-neutral-200 bg-white p-4 space-y-4">
            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>{texts.subtotal}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>{texts.vat}</span>
                <span>{formatPrice(taxTotal)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg text-neutral-900">
                <span>{texts.total}</span>
                <span className="text-teal-600">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
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
                className="w-full text-neutral-500 hover:text-red-600 hover:bg-red-50"
                onClick={onClearItems}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {texts.clearCart}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
