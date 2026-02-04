"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Edit, Trash2, ArrowRight, XCircle } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { DealStatusBadge } from "./deal-status-badge";
import { formatCurrency, formatDate, getLocalizedText } from "@liyaqa/shared/utils";
import type { DealSummary, DealSource } from "@liyaqa/shared/types/platform";

interface DealColumnsOptions {
  locale: string;
  onView: (deal: DealSummary) => void;
  onEdit: (deal: DealSummary) => void;
  onAdvance: (deal: DealSummary) => void;
  onLose: (deal: DealSummary) => void;
  onDelete: (deal: DealSummary) => void;
  canEdit?: boolean;
}

const SOURCE_LABELS: Record<DealSource, { en: string; ar: string }> = {
  WEBSITE: { en: "Website", ar: "الموقع" },
  REFERRAL: { en: "Referral", ar: "إحالة" },
  COLD_CALL: { en: "Cold Call", ar: "اتصال بارد" },
  MARKETING_CAMPAIGN: { en: "Marketing", ar: "تسويق" },
  EVENT: { en: "Event", ar: "حدث" },
  PARTNER: { en: "Partner", ar: "شريك" },
  OTHER: { en: "Other", ar: "أخرى" },
};

export function getDealColumns(options: DealColumnsOptions): ColumnDef<DealSummary>[] {
  const { locale, onView, onEdit, onAdvance, onLose, onDelete, canEdit = true } = options;

  const texts = {
    title: locale === "ar" ? "العنوان" : "Title",
    status: locale === "ar" ? "الحالة" : "Status",
    source: locale === "ar" ? "المصدر" : "Source",
    company: locale === "ar" ? "الشركة" : "Company",
    value: locale === "ar" ? "القيمة" : "Value",
    probability: locale === "ar" ? "الاحتمالية" : "Probability",
    expectedClose: locale === "ar" ? "التاريخ المتوقع" : "Expected Close",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    advance: locale === "ar" ? "تقدم" : "Advance",
    lose: locale === "ar" ? "خسارة" : "Mark Lost",
    delete: locale === "ar" ? "حذف" : "Delete",
    na: locale === "ar" ? "غير محدد" : "N/A",
    overdue: locale === "ar" ? "(متأخر)" : "(Overdue)",
  };

  return [
    {
      accessorKey: "title",
      header: texts.title,
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="font-medium truncate">
            {getLocalizedText(row.original.title, locale)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <DealStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "source",
      header: texts.source,
      cell: ({ row }) => (
        <span className="text-sm">
          {locale === "ar"
            ? SOURCE_LABELS[row.original.source].ar
            : SOURCE_LABELS[row.original.source].en}
        </span>
      ),
    },
    {
      accessorKey: "companyName",
      header: texts.company,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.companyName || texts.na}
        </span>
      ),
    },
    {
      accessorKey: "estimatedValue",
      header: texts.value,
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(
            row.original.estimatedValue.amount,
            row.original.estimatedValue.currency,
            locale
          )}
        </span>
      ),
    },
    {
      accessorKey: "probability",
      header: texts.probability,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.probability}%</span>
      ),
    },
    {
      accessorKey: "expectedCloseDate",
      header: texts.expectedClose,
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.expectedCloseDate ? (
            <span className={row.original.isOverdue ? "text-red-600 font-medium" : ""}>
              {formatDate(row.original.expectedCloseDate, locale)}
              {row.original.isOverdue && ` ${texts.overdue}`}
            </span>
          ) : (
            <span className="text-muted-foreground">{texts.na}</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const deal = row.original;
        const isOpen = !["WON", "LOST"].includes(deal.status);
        const canDelete = deal.status === "LEAD" || deal.status === "LOST";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
              <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(deal)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              {canEdit && isOpen && (
                <DropdownMenuItem onClick={() => onEdit(deal)}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
              )}
              {canEdit && isOpen && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAdvance(deal)}>
                    <ArrowRight className="me-2 h-4 w-4" />
                    {texts.advance}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onLose(deal)}>
                    <XCircle className="me-2 h-4 w-4" />
                    {texts.lose}
                  </DropdownMenuItem>
                </>
              )}
              {canEdit && canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(deal)}
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

export { SOURCE_LABELS };
