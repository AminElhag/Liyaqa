"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowLeft, User, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { LocalizedText } from "@/components/ui/localized-text";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart, useCheckout } from "@/queries/use-shop";
import { useMember } from "@/queries/use-members";
import { useToast } from "@/hooks/use-toast";
import { getLocalizedText, formatCurrency } from "@/lib/utils";

export default function AdminCheckoutPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const memberId = searchParams.get("memberId");

  const [notes, setNotes] = useState("");

  const { data: member, isLoading: memberLoading } = useMember(memberId || "", {
    enabled: !!memberId,
  });
  const { data: cart, isLoading: cartLoading } = useCart(memberId || undefined, {
    enabled: !!memberId,
  });
  const checkout = useCheckout(memberId || undefined);

  const texts = {
    back: locale === "ar" ? "العودة للسلة" : "Back to Cart",
    title: locale === "ar" ? "إتمام الشراء" : "Checkout",
    shoppingFor: locale === "ar" ? "التسوق لـ" : "Shopping for",
    noMember:
      locale === "ar" ? "لم يتم اختيار عضو" : "No member selected",
    goBack: locale === "ar" ? "العودة" : "Go back",
    emptyCart:
      locale === "ar"
        ? "السلة فارغة. لا يمكن إتمام الشراء."
        : "Cart is empty. Cannot proceed to checkout.",
    orderSummary: locale === "ar" ? "ملخص الطلب" : "Order Summary",
    notes: locale === "ar" ? "ملاحظات الطلب" : "Order Notes",
    notesPlaceholder:
      locale === "ar"
        ? "أضف أي تعليمات خاصة..."
        : "Add any special instructions...",
    subtotal: locale === "ar" ? "المجموع الفرعي" : "Subtotal",
    vat: locale === "ar" ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)",
    grandTotal: locale === "ar" ? "الإجمالي النهائي" : "Grand Total",
    completeOrder: locale === "ar" ? "إتمام الطلب" : "Complete Order",
    processing: locale === "ar" ? "جاري المعالجة..." : "Processing...",
    success: locale === "ar" ? "تم إتمام الطلب بنجاح" : "Order completed successfully",
    error: locale === "ar" ? "فشل في إتمام الطلب" : "Failed to complete order",
  };

  const handleCheckout = async () => {
    try {
      const result = await checkout.mutateAsync({ notes: notes || undefined });
      toast({
        title: texts.success,
        description:
          locale === "ar"
            ? `رقم الطلب: ${result.orderId.slice(0, 8)}...`
            : `Order ID: ${result.orderId.slice(0, 8)}...`,
      });
      // Redirect to order detail or invoice
      router.push(`/${locale}/invoices/${result.invoiceId}`);
    } catch {
      toast({
        title: texts.error,
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

  if (!isLoading && (!cart?.items?.length)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/pos/cart?memberId=${memberId}`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>{texts.emptyCart}</p>
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
          <Link href={`/${locale}/pos/cart?memberId=${memberId}`}>
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

      {/* Checkout Content */}
      {isLoading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : cart ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.notes}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={texts.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.orderSummary}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {getLocalizedText(item.productName, locale)} x{" "}
                      {item.quantity}
                    </span>
                    <span>
                      {formatCurrency(
                        item.lineGross.amount,
                        item.lineGross.currency
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{texts.subtotal}</span>
                  <span>
                    {formatCurrency(cart.subtotal.amount, cart.subtotal.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{texts.vat}</span>
                  <span>
                    {formatCurrency(cart.taxTotal.amount, cart.taxTotal.currency)}
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

              {/* Checkout Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={checkout.isPending}
              >
                {checkout.isPending ? (
                  texts.processing
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 me-2" />
                    {texts.completeOrder}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
