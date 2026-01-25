"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { CreditCard, ShieldCheck, Info } from "lucide-react";
import { MemberShell } from "@/components/layouts/member-shell";
import { PaymentMethodsList } from "@/components/member/payment-methods-list";
import { AddPaymentMethodDialog } from "@/components/member/add-payment-method-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useMyPaymentMethods,
  useSetDefaultPaymentMethod,
  useRemovePaymentMethod,
} from "@/queries/use-payment-methods";
import { toast } from "sonner";

export default function PaymentMethodsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [settingDefaultId, setSettingDefaultId] = React.useState<string | null>(null);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const { data: methods = [], isLoading } = useMyPaymentMethods();
  const setDefaultMutation = useSetDefaultPaymentMethod();
  const removeMutation = useRemovePaymentMethod();

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await setDefaultMutation.mutateAsync(id);
      toast.success(
        isArabic
          ? "تم تعيين طريقة الدفع الافتراضية"
          : "Default payment method updated"
      );
    } catch {
      toast.error(
        isArabic
          ? "فشل في تعيين طريقة الدفع الافتراضية"
          : "Failed to set default payment method"
      );
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await removeMutation.mutateAsync(id);
      toast.success(
        isArabic ? "تم إزالة طريقة الدفع" : "Payment method removed"
      );
    } catch {
      toast.error(
        isArabic ? "فشل في إزالة طريقة الدفع" : "Failed to remove payment method"
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <MemberShell>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">
                {isArabic ? "طرق الدفع" : "Payment Methods"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? "إدارة طرق الدفع المحفوظة الخاصة بك"
                  : "Manage your saved payment methods"}
              </p>
            </div>
          </div>

          <AddPaymentMethodDialog />
        </div>

        {/* Security Notice */}
        <Alert className="bg-green-50 border-green-200">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {isArabic
              ? "بيانات الدفع الخاصة بك محمية ومشفرة بشكل آمن"
              : "Your payment information is securely encrypted and protected"}
          </AlertDescription>
        </Alert>

        {/* Payment Methods List */}
        <PaymentMethodsList
          methods={methods}
          isLoading={isLoading}
          onSetDefault={handleSetDefault}
          onRemove={handleRemove}
          settingDefaultId={settingDefaultId}
          removingId={removingId}
        />

        {/* Info Notice */}
        {methods.length > 0 && (
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              {isArabic
                ? "طريقة الدفع الافتراضية ستُستخدم تلقائياً للمدفوعات المتكررة والحجوزات السريعة"
                : "Your default payment method will be used automatically for recurring payments and quick bookings"}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </MemberShell>
  );
}
