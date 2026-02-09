import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
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
import { PlanStatusBadge } from "./plan-status-badge";
import { getLocalizedText } from "@/lib/utils";
import type { ClientPlan, BillingCycle, Money } from "@/types";

/**
 * Options for configuring plan columns.
 */
export interface PlanColumnsOptions {
  locale: string;
  onView: (plan: ClientPlan) => void;
  onEdit: (plan: ClientPlan) => void;
  onActivate: (plan: ClientPlan) => void;
  onDeactivate: (plan: ClientPlan) => void;
  onDelete: (plan: ClientPlan) => void;
  canEdit?: boolean;
}

/**
 * Billing cycle display labels.
 */
const BILLING_CYCLE_LABELS: Record<BillingCycle, { en: string; ar: string }> = {
  MONTHLY: { en: "Monthly", ar: "شهري" },
  QUARTERLY: { en: "Quarterly", ar: "ربع سنوي" },
  ANNUAL: { en: "Annual", ar: "سنوي" },
};

/**
 * Format currency amount for display.
 */
function formatMoney(money: Money, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(money.amount);
}

/**
 * Creates column definitions for the client plans DataTable.
 */
export function getPlanColumns(options: PlanColumnsOptions): ColumnDef<ClientPlan>[] {
  const { locale, onView, onEdit, onActivate, onDeactivate, onDelete, canEdit = true } = options;

  const texts = {
    name: locale === "ar" ? "اسم الخطة" : "Plan Name",
    monthlyPrice: locale === "ar" ? "شهري" : "Monthly",
    annualPrice: locale === "ar" ? "سنوي" : "Annual",
    billingCycle: locale === "ar" ? "دورة الفوترة" : "Billing",
    maxClubs: locale === "ar" ? "الأندية" : "Clubs",
    maxMembers: locale === "ar" ? "الأعضاء" : "Members",
    status: locale === "ar" ? "الحالة" : "Status",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    delete: locale === "ar" ? "حذف" : "Delete",
  };

  return [
    {
      accessorKey: "name",
      header: texts.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{getLocalizedText(row.original.name, locale)}</span>
        </div>
      ),
    },
    {
      accessorKey: "monthlyPrice",
      header: texts.monthlyPrice,
      cell: ({ row }) => (
        <span className="font-medium">
          {formatMoney(row.original.monthlyPrice, locale)}
        </span>
      ),
    },
    {
      accessorKey: "annualPrice",
      header: texts.annualPrice,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatMoney(row.original.annualPrice, locale)}
        </span>
      ),
    },
    {
      accessorKey: "billingCycle",
      header: texts.billingCycle,
      cell: ({ row }) => {
        const cycle = row.original.billingCycle;
        const label = BILLING_CYCLE_LABELS[cycle];
        return <span>{locale === "ar" ? label.ar : label.en}</span>;
      },
    },
    {
      accessorKey: "maxClubs",
      header: texts.maxClubs,
      cell: ({ row }) => <span>{row.original.maxClubs}</span>,
    },
    {
      accessorKey: "maxMembers",
      header: texts.maxMembers,
      cell: ({ row }) => <span>{row.original.maxMembers.toLocaleString()}</span>,
    },
    {
      accessorKey: "isActive",
      header: texts.status,
      cell: ({ row }) => <PlanStatusBadge isActive={row.original.isActive} />,
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const plan = row.original;
        const canActivate = !plan.isActive;
        const canDeactivate = plan.isActive;
        const canDelete = !plan.isActive;

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
              <DropdownMenuItem onClick={() => onView(plan)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(plan)}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canEdit && canActivate && (
                <DropdownMenuItem onClick={() => onActivate(plan)}>
                  <CheckCircle className="me-2 h-4 w-4 text-green-600" />
                  {texts.activate}
                </DropdownMenuItem>
              )}
              {canEdit && canDeactivate && (
                <DropdownMenuItem
                  onClick={() => onDeactivate(plan)}
                  className="text-warning"
                >
                  <XCircle className="me-2 h-4 w-4" />
                  {texts.deactivate}
                </DropdownMenuItem>
              )}
              {canEdit && canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(plan)}
                    className="text-destructive"
                  >
                    <Trash2 className="me-2 h-4 w-4" />
                    {texts.delete}
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
