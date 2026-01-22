"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  PauseCircle,
  XCircle,
  RefreshCw,
  ArrowRightLeft,
  Calendar,
  Building2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SubscriptionStatusBadge } from "./subscription-status-badge";
import type { ClientSubscriptionSummary } from "@/types/platform/client-subscription";
import type { Money, LocalizedText } from "@/types/api";

/**
 * Options for configuring subscription columns.
 */
export interface SubscriptionColumnsOptions {
  locale: string;
  onView: (subscription: ClientSubscriptionSummary) => void;
  onEdit: (subscription: ClientSubscriptionSummary) => void;
  onActivate: (subscription: ClientSubscriptionSummary) => void;
  onSuspend: (subscription: ClientSubscriptionSummary) => void;
  onCancel: (subscription: ClientSubscriptionSummary) => void;
  onRenew: (subscription: ClientSubscriptionSummary) => void;
  onChangePlan: (subscription: ClientSubscriptionSummary) => void;
  canEdit?: boolean;
}

/**
 * Format currency amount for display.
 */
function formatCurrency(money: Money, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(money.amount);
}

/**
 * Format date for display.
 */
function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Get localized text based on locale.
 */
function getLocalizedText(text: LocalizedText | undefined, locale: string): string {
  if (!text) return "-";
  return locale === "ar" ? text.ar || text.en : text.en;
}

/**
 * Creates column definitions for the client subscriptions DataTable.
 */
export function getSubscriptionColumns(
  options: SubscriptionColumnsOptions
): ColumnDef<ClientSubscriptionSummary>[] {
  const {
    locale,
    onView,
    onEdit,
    onActivate,
    onSuspend,
    onCancel,
    onRenew,
    onChangePlan,
    canEdit = true,
  } = options;

  const texts = {
    organization: locale === "ar" ? "المؤسسة" : "Organization",
    plan: locale === "ar" ? "الخطة" : "Plan",
    status: locale === "ar" ? "الحالة" : "Status",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    endDate: locale === "ar" ? "تاريخ الانتهاء" : "End Date",
    price: locale === "ar" ? "السعر" : "Price",
    remaining: locale === "ar" ? "المتبقي" : "Remaining",
    days: locale === "ar" ? "يوم" : "days",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    suspend: locale === "ar" ? "تعليق" : "Suspend",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    renew: locale === "ar" ? "تجديد" : "Renew",
    changePlan: locale === "ar" ? "تغيير الخطة" : "Change Plan",
    expired: locale === "ar" ? "منتهي" : "Expired",
    noOrg: locale === "ar" ? "مؤسسة" : "Organization",
    noPlan: locale === "ar" ? "خطة" : "Plan",
  };

  return [
    {
      accessorKey: "organizationName",
      header: texts.organization,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {row.original.organizationName
              ? getLocalizedText(row.original.organizationName, locale)
              : `${texts.noOrg} #${row.original.organizationId.slice(0, 8)}`}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "planName",
      header: texts.plan,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>
            {row.original.planName
              ? getLocalizedText(row.original.planName, locale)
              : `${texts.noPlan} #${row.original.clientPlanId.slice(0, 8)}`}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <SubscriptionStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "startDate",
      header: texts.startDate,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(row.original.startDate, locale)}</span>
        </div>
      ),
    },
    {
      accessorKey: "endDate",
      header: texts.endDate,
      cell: ({ row }) => (
        <span>{formatDate(row.original.endDate, locale)}</span>
      ),
    },
    {
      accessorKey: "agreedPrice",
      header: texts.price,
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.agreedPrice, locale)}
        </span>
      ),
    },
    {
      accessorKey: "remainingDays",
      header: texts.remaining,
      cell: ({ row }) => {
        const days = row.original.remainingDays;
        const isExpired = days <= 0;
        const isWarning = days > 0 && days <= 30;

        return (
          <span
            className={
              isExpired
                ? "text-destructive font-medium"
                : isWarning
                ? "text-amber-600 font-medium"
                : "text-muted-foreground"
            }
          >
            {isExpired ? texts.expired : `${days} ${texts.days}`}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const subscription = row.original;
        const status = subscription.status;

        // Action availability based on status
        const canActivate = ["TRIAL", "SUSPENDED"].includes(status);
        const canSuspend = status === "ACTIVE";
        const canCancelSub = ["ACTIVE", "SUSPENDED"].includes(status);
        const canRenewSub = ["ACTIVE", "SUSPENDED", "EXPIRED"].includes(status);
        const canChangePlanSub = status === "ACTIVE";
        const canEditSub = !["CANCELLED", "EXPIRED"].includes(status);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{texts.actions}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
              <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(subscription)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              {canEdit && canEditSub && (
                <DropdownMenuItem onClick={() => onEdit(subscription)}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canEdit && canActivate && (
                <DropdownMenuItem onClick={() => onActivate(subscription)}>
                  <CheckCircle className="me-2 h-4 w-4 text-green-600" />
                  {texts.activate}
                </DropdownMenuItem>
              )}
              {canEdit && canSuspend && (
                <DropdownMenuItem onClick={() => onSuspend(subscription)}>
                  <PauseCircle className="me-2 h-4 w-4 text-amber-600" />
                  {texts.suspend}
                </DropdownMenuItem>
              )}
              {canEdit && canChangePlanSub && (
                <DropdownMenuItem onClick={() => onChangePlan(subscription)}>
                  <ArrowRightLeft className="me-2 h-4 w-4 text-blue-600" />
                  {texts.changePlan}
                </DropdownMenuItem>
              )}
              {canEdit && canRenewSub && (
                <DropdownMenuItem onClick={() => onRenew(subscription)}>
                  <RefreshCw className="me-2 h-4 w-4 text-primary" />
                  {texts.renew}
                </DropdownMenuItem>
              )}
              {canEdit && canCancelSub && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onCancel(subscription)}
                    className="text-destructive"
                  >
                    <XCircle className="me-2 h-4 w-4" />
                    {texts.cancel}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
