"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowLeft, ShoppingCart, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LocalizedText } from "@/components/ui/localized-text";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart,
} from "@/queries/use-shop";
import { useMember } from "@/queries/use-members";
import { useToast } from "@/hooks/use-toast";
import { getLocalizedText, formatCurrency } from "@/lib/utils";

export default function AdminCartPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const memberId = searchParams.get("memberId");

  const { data: member, isLoading: memberLoading } = useMember(memberId || "", {
    enabled: !!memberId,
  });
  const { data: cart, isLoading: cartLoading } = useCart(memberId || undefined, {
    enabled: !!memberId,
  });
  const updateCartItem = useUpdateCartItem(memberId || undefined);
  const removeFromCart = useRemoveFromCart(memberId || undefined);
  const clearCart = useClearCart(memberId || undefined);

  const texts = {
    back: locale === "ar" ? "العودة للمتجر" : "Back to Shop",
    title: locale === "ar" ? "سلة التسوق" : "Shopping Cart",
    shoppingFor: locale === "ar" ? "التسوق لـ" : "Shopping for",
    noMember:
      locale === "ar"
        ? "لم يتم اختيار عضو"
        : "No member selected",
    goBack: locale === "ar" ? "العودة" : "Go back",
    empty: locale === "ar" ? "السلة فارغة" : "Cart is empty",
    product: locale === "ar" ? "المنتج" : "Product",
    price: locale === "ar" ? "السعر" : "Price",
    quantity: locale === "ar" ? "الكمية" : "Quantity",
    total: locale === "ar" ? "الإجمالي" : "Total",
    subtotal: locale === "ar" ? "المجموع الفرعي" : "Subtotal",
    vat: locale === "ar" ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)",
    grandTotal: locale === "ar" ? "الإجمالي النهائي" : "Grand Total",
    clearCart: locale === "ar" ? "إفراغ السلة" : "Clear Cart",
    checkout: locale === "ar" ? "إتمام الشراء" : "Proceed to Checkout",
    continueShopping: locale === "ar" ? "متابعة التسوق" : "Continue Shopping",
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) {
      await handleRemoveItem(productId);
      return;
    }
    try {
      await updateCartItem.mutateAsync({ productId, data: { quantity } });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في تحديث الكمية"
            : "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromCart.mutateAsync({ productId, memberId: memberId || undefined });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في إزالة المنتج" : "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const handleClearCart = async () => {
    if (
      !confirm(
        locale === "ar"
          ? "هل أنت متأكد من إفراغ السلة؟"
          : "Are you sure you want to clear the cart?"
      )
    )
      return;

    try {
      await clearCart.mutateAsync({ memberId: memberId || undefined });
      toast({
        title: locale === "ar" ? "تم" : "Done",
        description: locale === "ar" ? "تم إفراغ السلة" : "Cart cleared",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في إفراغ السلة" : "Failed to clear cart",
        variant: "destructive",
      });
    }
  };

  const isLoading = memberLoading || cartLoading;

  if (!memberId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/pos`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>{texts.noMember}</p>
          <Button asChild className="mt-4">
            <Link href={`/${locale}/pos`}>{texts.goBack}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/pos`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{texts.title}</h1>
      </div>

      {/* Member Context */}
      {isLoading ? (
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-10 w-64" />
          </CardContent>
        </Card>
      ) : member ? (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.shoppingFor}</p>
              <p className="font-medium">
                <LocalizedText text={member.firstName} />{" "}
                <LocalizedText text={member.lastName} />
                <span className="text-muted-foreground ms-2">
                  ({member.email})
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Cart Content */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ) : !cart?.items?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
            <p className="text-lg">{texts.empty}</p>
            <Button asChild className="mt-4">
              <Link href={`/${locale}/pos?memberId=${memberId}`}>
                {texts.continueShopping}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {texts.title} ({cart.itemCount})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleClearCart}
                >
                  <Trash2 className="h-4 w-4 me-1" />
                  {texts.clearCart}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-4 py-4 border-b last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {getLocalizedText(item.productName, locale)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(
                            item.unitPrice.amount,
                            item.unitPrice.currency
                          )}{" "}
                          {locale === "ar" ? "للوحدة" : "each"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 border rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleUpdateQuantity(item.productId, item.quantity - 1)
                          }
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleUpdateQuantity(item.productId, item.quantity + 1)
                          }
                        >
                          +
                        </Button>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-medium">
                          {formatCurrency(
                            item.lineGross.amount,
                            item.lineGross.currency
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveItem(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>{texts.total}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>{texts.grandTotal}</span>
                  <span>
                    {formatCurrency(
                      cart.grandTotal.amount,
                      cart.grandTotal.currency
                    )}
                  </span>
                </div>
                <div className="space-y-2 pt-4">
                  <Button asChild className="w-full">
                    <Link href={`/${locale}/pos/checkout?memberId=${memberId}`}>
                      {texts.checkout}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/${locale}/pos?memberId=${memberId}`}>
                      {texts.continueShopping}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
