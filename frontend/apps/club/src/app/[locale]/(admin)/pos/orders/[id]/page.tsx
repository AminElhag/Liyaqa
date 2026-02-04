"use client";

import { use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  User,
  FileText,
  Clock,
  CheckCircle2,
  Package,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { useOrder } from "@liyaqa/shared/queries/use-shop";
import { getLocalizedText, formatCurrency } from "@liyaqa/shared/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@liyaqa/shared/types/shop";

interface Props {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  const locale = useLocale();

  const { data: order, isLoading } = useOrder(resolvedParams.id);

  const texts = {
    back: locale === "ar" ? "العودة للطلبات" : "Back to Orders",
    title: locale === "ar" ? "تفاصيل الطلب" : "Order Details",
    orderInfo: locale === "ar" ? "معلومات الطلب" : "Order Information",
    orderId: locale === "ar" ? "رقم الطلب" : "Order ID",
    status: locale === "ar" ? "الحالة" : "Status",
    placedAt: locale === "ar" ? "تاريخ الطلب" : "Order Date",
    completedAt: locale === "ar" ? "تاريخ الإكمال" : "Completed Date",
    member: locale === "ar" ? "العضو" : "Member",
    memberInfo: locale === "ar" ? "معلومات العضو" : "Member Information",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    items: locale === "ar" ? "عناصر الطلب" : "Order Items",
    product: locale === "ar" ? "المنتج" : "Product",
    price: locale === "ar" ? "السعر" : "Price",
    quantity: locale === "ar" ? "الكمية" : "Quantity",
    total: locale === "ar" ? "الإجمالي" : "Total",
    subtotal: locale === "ar" ? "المجموع الفرعي" : "Subtotal",
    vat: locale === "ar" ? "ضريبة القيمة المضافة" : "VAT",
    grandTotal: locale === "ar" ? "الإجمالي النهائي" : "Grand Total",
    notes: locale === "ar" ? "الملاحظات" : "Notes",
    noNotes: locale === "ar" ? "لا توجد ملاحظات" : "No notes",
    viewInvoice: locale === "ar" ? "عرض الفاتورة" : "View Invoice",
    notFound: locale === "ar" ? "الطلب غير موجود" : "Order not found",
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString(
      locale === "ar" ? "ar-SA" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/pos/orders`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
          <p>{texts.notFound}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/pos/orders`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
        </div>
        {order.invoiceId && (
          <Button asChild>
            <Link href={`/${locale}/invoices/${order.invoiceId}`}>
              <FileText className="h-4 w-4 me-2" />
              {texts.viewInvoice}
            </Link>
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.items}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between py-3 border-b last:border-0"
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
                        x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(
                          item.lineGross.amount,
                          item.lineGross.currency
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {locale === "ar" ? "شامل الضريبة" : "incl. VAT"}{" "}
                        {formatCurrency(item.lineTax.amount, item.lineTax.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{texts.subtotal}</span>
                  <span>
                    {formatCurrency(
                      order.subtotal.amount,
                      order.subtotal.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{texts.vat}</span>
                  <span>
                    {formatCurrency(
                      order.taxTotal.amount,
                      order.taxTotal.currency
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>{texts.grandTotal}</span>
                  <span>
                    {formatCurrency(
                      order.grandTotal.amount,
                      order.grandTotal.currency
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{texts.notes}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.orderInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{texts.orderId}</p>
                <p className="font-mono text-sm">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{texts.status}</p>
                <Badge
                  className={ORDER_STATUS_COLORS[order.status]}
                  variant="secondary"
                >
                  {ORDER_STATUS_LABELS[order.status][locale as "en" | "ar"]}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{texts.placedAt}</p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatDateTime(order.placedAt)}
                </p>
              </div>
              {order.completedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {texts.completedAt}
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {formatDateTime(order.completedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Member Info */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.memberInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {order.memberName ? (
                    <p className="font-medium">
                      <LocalizedText text={order.memberName} />
                    </p>
                  ) : (
                    <p className="text-muted-foreground">-</p>
                  )}
                  {order.memberEmail && (
                    <p className="text-sm text-muted-foreground">
                      {order.memberEmail}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/${locale}/members/${order.memberId}`}>
                  {texts.member}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
