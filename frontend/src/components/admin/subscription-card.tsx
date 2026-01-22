"use client";

import Link from "next/link";
import { ChevronRight, CreditCard, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { LocalizedText } from "@/components/ui/localized-text";
import { formatDate } from "@/lib/utils";
import type { Subscription } from "@/types/member";

interface SubscriptionCardProps {
  subscription: Subscription;
  locale: string;
  onFreeze?: (subscription: Subscription) => void;
  onCreateInvoice?: (subscription: Subscription) => void;
}

export function SubscriptionCard({
  subscription,
  locale,
  onFreeze,
  onCreateInvoice,
}: SubscriptionCardProps) {
  // Calculate progress percentage based on time elapsed or classes used
  const calculateProgress = () => {
    if (subscription.classesRemaining !== undefined) {
      // For class-based subscriptions, we need total classes
      // If we don't have it, show classes remaining as a simple number
      return null; // We'll show text instead
    }

    // For time-based subscriptions
    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);
    const now = new Date();

    const totalDays = Math.max(
      1,
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const elapsedDays = Math.max(
      0,
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  };

  const progress = calculateProgress();

  const texts = {
    classesRemaining:
      locale === "ar"
        ? `${subscription.classesRemaining} حصة متبقية`
        : `${subscription.classesRemaining} classes remaining`,
    daysRemaining:
      locale === "ar"
        ? `${subscription.daysRemaining} يوم متبقي`
        : `${subscription.daysRemaining} days remaining`,
    unlimited: locale === "ar" ? "غير محدود" : "Unlimited",
    viewDetails: locale === "ar" ? "عرض التفاصيل" : "View details",
    subscription: locale === "ar" ? "اشتراك" : "Subscription",
    completePayment: locale === "ar" ? "إكمال الدفع" : "Complete Payment",
    freeze: locale === "ar" ? "تجميد" : "Freeze",
  };

  // Show "Complete Payment" for PENDING or ACTIVE subscriptions
  const canCreateInvoice =
    (subscription.status === "PENDING" || subscription.status === "ACTIVE") &&
    onCreateInvoice;

  // Show "Freeze" only for ACTIVE subscriptions
  const canFreeze = subscription.status === "ACTIVE" && onFreeze;

  // Show action section if any action is available
  const showActions = canCreateInvoice || canFreeze;

  return (
    <div className="group rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
      {/* Clickable content area */}
      <Link
        href={`/${locale}/subscriptions/${subscription.id}`}
        className="block"
      >
        {/* Header: Plan name + Status */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg truncate">
              {subscription.planName ? (
                <LocalizedText text={subscription.planName} />
              ) : (
                texts.subscription
              )}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDate(subscription.startDate, locale)} —{" "}
              {formatDate(subscription.endDate, locale)}
            </p>
          </div>
          <StatusBadge status={subscription.status} locale={locale} />
        </div>

        {/* Progress bar (for time-based) */}
        {progress !== null && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
              <span>
                {locale === "ar" ? "الوقت المنقضي" : "Time elapsed"}
              </span>
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

        {/* Classes remaining (for class-based) */}
        {subscription.classesRemaining !== undefined && !showActions && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {texts.classesRemaining}
            </span>
            <div className="flex items-center gap-1 text-primary font-medium group-hover:underline">
              <span>{texts.viewDetails}</span>
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </div>
          </div>
        )}

        {/* Classes remaining (for class-based with actions) */}
        {subscription.classesRemaining !== undefined && showActions && (
          <div className="mt-4 text-sm text-muted-foreground">
            {texts.classesRemaining}
          </div>
        )}

        {/* Unlimited subscription info */}
        {subscription.classesRemaining === undefined && progress === null && !showActions && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{texts.unlimited}</span>
            <div className="flex items-center gap-1 text-primary font-medium group-hover:underline">
              <span>{texts.viewDetails}</span>
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </div>
          </div>
        )}

        {/* Unlimited subscription info (with actions) */}
        {subscription.classesRemaining === undefined && progress === null && showActions && (
          <div className="mt-4 text-sm text-muted-foreground">
            {texts.unlimited}
          </div>
        )}

        {/* View details for time-based (without actions) */}
        {progress !== null && !showActions && (
          <div className="mt-3 flex justify-end">
            <div className="flex items-center gap-1 text-sm text-primary font-medium group-hover:underline">
              <span>{texts.viewDetails}</span>
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </div>
          </div>
        )}
      </Link>

      {/* Action buttons based on subscription status */}
      {showActions && (
        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t">
          {canCreateInvoice && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onCreateInvoice!(subscription);
              }}
              className="flex-1 min-w-0"
            >
              <CreditCard className="me-1.5 h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{texts.completePayment}</span>
            </Button>
          )}
          {canFreeze && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onFreeze!(subscription);
              }}
              className="flex-1 min-w-0"
            >
              <Snowflake className="me-1.5 h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{texts.freeze}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
