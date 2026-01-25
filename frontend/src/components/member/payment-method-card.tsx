"use client";

import { useLocale } from "next-intl";
import {
  CreditCard,
  Trash2,
  Star,
  StarOff,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { PaymentMethod } from "@/types/payment-method";
import {
  PAYMENT_TYPE_LABELS,
  CARD_BRAND_LABELS,
  CARD_BRAND_COLORS,
} from "@/types/payment-method";
import { cn } from "@/lib/utils";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault?: (id: string) => void;
  onRemove?: (id: string) => void;
  isSettingDefault?: boolean;
  isRemoving?: boolean;
}

// Card brand icons - using simple colored badges for now
function CardBrandIcon({ brand }: { brand?: string }) {
  const color = brand ? CARD_BRAND_COLORS[brand] : "#6B7280";

  return (
    <div
      className="w-12 h-8 rounded flex items-center justify-center text-white font-bold text-xs"
      style={{ backgroundColor: color }}
    >
      {brand || "CARD"}
    </div>
  );
}

export function PaymentMethodCard({
  method,
  onSetDefault,
  onRemove,
  isSettingDefault,
  isRemoving,
}: PaymentMethodCardProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const typeLabel = PAYMENT_TYPE_LABELS[method.paymentType];
  const brandLabel = method.cardBrand ? CARD_BRAND_LABELS[method.cardBrand] : null;

  const displayLabel = isArabic ? typeLabel?.ar : typeLabel?.en;
  const brandName = brandLabel ? (isArabic ? brandLabel.ar : brandLabel.en) : method.cardBrand;

  const isExpired = method.isExpired;
  const expiryText =
    method.cardExpMonth && method.cardExpYear
      ? `${String(method.cardExpMonth).padStart(2, "0")}/${method.cardExpYear}`
      : null;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all",
        method.isDefault && "ring-2 ring-primary",
        isExpired && "opacity-75"
      )}
    >
      {method.isDefault && (
        <div className="absolute top-0 end-0 bg-primary text-white text-xs px-2 py-0.5 rounded-es">
          {isArabic ? "افتراضي" : "Default"}
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Card Brand Icon */}
          <div className="shrink-0">
            {method.paymentType === "CARD" || method.paymentType === "MADA" ? (
              <CardBrandIcon brand={method.cardBrand} />
            ) : (
              <div className="w-12 h-8 rounded bg-neutral-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-neutral-500" />
              </div>
            )}
          </div>

          {/* Card Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {method.nickname || brandName || displayLabel}
              </span>
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 me-1" />
                  {isArabic ? "منتهية" : "Expired"}
                </Badge>
              )}
            </div>

            {method.cardLastFour && (
              <p className="text-sm text-muted-foreground mt-0.5">
                •••• •••• •••• {method.cardLastFour}
              </p>
            )}

            {expiryText && !isExpired && (
              <p className="text-xs text-muted-foreground mt-1">
                {isArabic ? "تنتهي:" : "Expires:"} {expiryText}
              </p>
            )}

            {!method.cardLastFour && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {displayLabel}
              </p>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!method.isDefault && onSetDefault && (
                <DropdownMenuItem
                  onClick={() => onSetDefault(method.id)}
                  disabled={isSettingDefault}
                >
                  <Star className="h-4 w-4 me-2" />
                  {isArabic ? "تعيين كافتراضي" : "Set as default"}
                </DropdownMenuItem>
              )}
              {method.isDefault && (
                <DropdownMenuItem disabled>
                  <StarOff className="h-4 w-4 me-2" />
                  {isArabic ? "طريقة افتراضية" : "Default method"}
                </DropdownMenuItem>
              )}
              {onRemove && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      {isArabic ? "إزالة" : "Remove"}
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {isArabic
                          ? "إزالة طريقة الدفع؟"
                          : "Remove payment method?"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {isArabic
                          ? "سيتم حذف طريقة الدفع هذه نهائياً. لا يمكن التراجع عن هذا الإجراء."
                          : "This payment method will be permanently deleted. This action cannot be undone."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {isArabic ? "إلغاء" : "Cancel"}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRemove(method.id)}
                        disabled={isRemoving}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isRemoving
                          ? isArabic
                            ? "جاري الإزالة..."
                            : "Removing..."
                          : isArabic
                          ? "إزالة"
                          : "Remove"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
