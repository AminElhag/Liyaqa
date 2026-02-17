"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Snowflake,
  Sun,
  XCircle,
  Shuffle,
  Edit,
  RefreshCcw,
  CreditCard,
  Trash2,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { formatDate } from "@liyaqa/shared/utils";
import type { Subscription, MembershipPlanType } from "@liyaqa/shared/types/member";

interface MembershipCardProps {
  subscription: Subscription;
  planType?: MembershipPlanType;
  locale: string;
  onFreeze?: (subscription: Subscription) => void;
  onUnfreeze?: (subscription: Subscription) => void;
  onCancel?: (subscription: Subscription) => void;
  onTransfer?: (subscription: Subscription) => void;
  onEdit?: (subscription: Subscription) => void;
  onRenew?: (subscription: Subscription) => void;
  onCompletePayment?: (subscription: Subscription) => void;
  onRemove?: (subscription: Subscription) => void;
}

const planTypeLabels: Record<MembershipPlanType, { en: string; ar: string }> = {
  RECURRING: { en: "Recurring", ar: "متكرر" },
  CLASS_PACK: { en: "Class Pack", ar: "باقة حصص" },
  DAY_PASS: { en: "Day Pass", ar: "تذكرة يومية" },
  TRIAL: { en: "Trial", ar: "تجريبي" },
};

const planTypeColors: Record<MembershipPlanType, string> = {
  RECURRING: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  CLASS_PACK: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  DAY_PASS: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  TRIAL: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
};

export function MembershipCard({
  subscription,
  planType = "RECURRING",
  locale,
  onFreeze,
  onUnfreeze,
  onCancel,
  onTransfer,
  onEdit,
  onRenew,
  onCompletePayment,
  onRemove,
}: MembershipCardProps) {
  const status = subscription.status;

  // Calculate progress for time-based subscriptions
  const calculateProgress = () => {
    if (subscription.classesRemaining !== undefined) return null;
    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const totalDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  };

  const progress = calculateProgress();

  const texts = {
    classesRemaining: locale === "ar"
      ? `${subscription.classesRemaining} حصة متبقية`
      : `${subscription.classesRemaining} classes remaining`,
    daysRemaining: locale === "ar"
      ? `${subscription.daysRemaining} يوم متبقي`
      : `${subscription.daysRemaining} days remaining`,
    timeElapsed: locale === "ar" ? "الوقت المنقضي" : "Time elapsed",
    freeze: locale === "ar" ? "تجميد" : "Freeze",
    unfreeze: locale === "ar" ? "إلغاء التجميد" : "Unfreeze",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    transfer: locale === "ar" ? "تحويل" : "Transfer",
    edit: locale === "ar" ? "تعديل" : "Edit",
    renew: locale === "ar" ? "تجديد" : "Renew",
    completePayment: locale === "ar" ? "إكمال الدفع" : "Complete Payment",
    remove: locale === "ar" ? "إزالة" : "Remove",
    subscription: locale === "ar" ? "اشتراك" : "Subscription",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
  };

  // Build action menu items based on status
  const getActions = () => {
    const actions: Array<{
      label: string;
      icon: React.ReactNode;
      onClick: () => void;
      destructive?: boolean;
      separator?: boolean;
    }> = [];

    switch (status) {
      case "ACTIVE":
        if (onFreeze) actions.push({ label: texts.freeze, icon: <Snowflake className="h-4 w-4" />, onClick: () => onFreeze(subscription) });
        if (onEdit) actions.push({ label: texts.edit, icon: <Edit className="h-4 w-4" />, onClick: () => onEdit(subscription) });
        if (onRenew) actions.push({ label: texts.renew, icon: <RefreshCcw className="h-4 w-4" />, onClick: () => onRenew(subscription) });
        if (onTransfer) actions.push({ label: texts.transfer, icon: <Shuffle className="h-4 w-4" />, onClick: () => onTransfer(subscription) });
        if (onCancel) actions.push({ label: texts.cancel, icon: <XCircle className="h-4 w-4" />, onClick: () => onCancel(subscription), destructive: true, separator: true });
        break;
      case "FROZEN":
        if (onUnfreeze) actions.push({ label: texts.unfreeze, icon: <Sun className="h-4 w-4" />, onClick: () => onUnfreeze(subscription) });
        if (onTransfer) actions.push({ label: texts.transfer, icon: <Shuffle className="h-4 w-4" />, onClick: () => onTransfer(subscription) });
        if (onCancel) actions.push({ label: texts.cancel, icon: <XCircle className="h-4 w-4" />, onClick: () => onCancel(subscription), destructive: true, separator: true });
        break;
      case "PENDING":
      case "PENDING_PAYMENT":
        if (onCompletePayment) actions.push({ label: texts.completePayment, icon: <CreditCard className="h-4 w-4" />, onClick: () => onCompletePayment(subscription) });
        if (onCancel) actions.push({ label: texts.cancel, icon: <XCircle className="h-4 w-4" />, onClick: () => onCancel(subscription), destructive: true, separator: true });
        break;
      case "EXPIRED":
        if (onRenew) actions.push({ label: texts.renew, icon: <RefreshCcw className="h-4 w-4" />, onClick: () => onRenew(subscription) });
        if (onRemove) actions.push({ label: texts.remove, icon: <Trash2 className="h-4 w-4" />, onClick: () => onRemove(subscription), destructive: true, separator: true });
        break;
      case "CANCELLED":
        if (onRenew) actions.push({ label: texts.renew, icon: <RefreshCcw className="h-4 w-4" />, onClick: () => onRenew(subscription) });
        if (onRemove) actions.push({ label: texts.remove, icon: <Trash2 className="h-4 w-4" />, onClick: () => onRemove(subscription), destructive: true, separator: true });
        break;
    }

    return actions;
  };

  const actions = getActions();

  return (
    <div className="group rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
      {/* Header: Plan name + type badge + status + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg truncate">
              {subscription.planName ? (
                <LocalizedText text={subscription.planName} />
              ) : (
                texts.subscription
              )}
            </h3>
            <Badge variant="secondary" className={planTypeColors[planType]}>
              {locale === "ar" ? planTypeLabels[planType].ar : planTypeLabels[planType].en}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDate(subscription.startDate, locale)} — {formatDate(subscription.endDate, locale)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={status} locale={locale} />
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{texts.actions}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, i) => (
                  <span key={action.label}>
                    {action.separator && i > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={action.onClick}
                      className={action.destructive ? "text-destructive focus:text-destructive" : undefined}
                    >
                      {action.icon}
                      <span className="ms-2">{action.label}</span>
                    </DropdownMenuItem>
                  </span>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Progress bar (for time-based) */}
      {progress !== null && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
            <span>{texts.timeElapsed}</span>
            <span>{texts.daysRemaining}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Classes remaining (for class packs) */}
      {subscription.classesRemaining !== undefined && (
        <div className="mt-4 text-sm text-muted-foreground">
          {texts.classesRemaining}
        </div>
      )}

      {/* Days remaining for unlimited with no progress bar */}
      {subscription.classesRemaining === undefined && progress === null && (
        <div className="mt-4 text-sm text-muted-foreground">
          {texts.daysRemaining}
        </div>
      )}
    </div>
  );
}
