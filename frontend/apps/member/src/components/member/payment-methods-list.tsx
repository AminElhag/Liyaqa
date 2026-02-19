"use client";

import { useLocale } from "next-intl";
import { CreditCard } from "lucide-react";
import { PaymentMethodCard } from "./payment-method-card";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import type { PaymentMethod } from "@liyaqa/shared/types/payment-method";

interface PaymentMethodsListProps {
  methods: PaymentMethod[];
  isLoading?: boolean;
  onSetDefault?: (id: string) => void;
  onRemove?: (id: string) => void;
  settingDefaultId?: string | null;
  removingId?: string | null;
}

function PaymentMethodSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-8 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}

function EmptyState() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  return (
    <div className="text-center py-12 px-4 bg-muted/50 rounded-lg border-2 border-dashed">
      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">
        {isArabic ? "لا توجد طرق دفع محفوظة" : "No saved payment methods"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        {isArabic
          ? "أضف طريقة دفع لتسريع عمليات الدفع المستقبلية"
          : "Add a payment method to speed up future payments"}
      </p>
    </div>
  );
}

export function PaymentMethodsList({
  methods,
  isLoading,
  onSetDefault,
  onRemove,
  settingDefaultId,
  removingId,
}: PaymentMethodsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <PaymentMethodSkeleton />
        <PaymentMethodSkeleton />
      </div>
    );
  }

  if (methods.length === 0) {
    return <EmptyState />;
  }

  // Sort: default first, then by creation date (newest first)
  const sortedMethods = [...methods].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      {sortedMethods.map((method) => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          onSetDefault={onSetDefault}
          onRemove={onRemove}
          isSettingDefault={settingDefaultId === method.id}
          isRemoving={removingId === method.id}
        />
      ))}
    </div>
  );
}
