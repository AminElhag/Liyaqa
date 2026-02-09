import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Edit, Trash2, ArrowRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DealStatusBadge } from "./deal-status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DealSummary } from "@/types";

interface DealColumnsOptions {
  locale: string;
  onView: (deal: DealSummary) => void;
  onEdit: (deal: DealSummary) => void;
  onAdvance: (deal: DealSummary) => void;
  onLose: (deal: DealSummary) => void;
  onDelete: (deal: DealSummary) => void;
  canEdit?: boolean;
}

export function getDealColumns(options: DealColumnsOptions): ColumnDef<DealSummary>[] {
  const { locale, onView, onEdit, onAdvance, onLose, onDelete, canEdit = true } = options;

  const texts = {
    name: locale === "ar" ? "الاسم" : "Name",
    status: locale === "ar" ? "الحالة" : "Status",
    value: locale === "ar" ? "القيمة" : "Value",
    expectedClose: locale === "ar" ? "التاريخ المتوقع" : "Expected Close",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    advance: locale === "ar" ? "تقدم" : "Advance",
    lose: locale === "ar" ? "خسارة" : "Mark Lost",
    delete: locale === "ar" ? "حذف" : "Delete",
    na: locale === "ar" ? "غير محدد" : "N/A",
  };

  return [
    {
      accessorKey: "contactName",
      header: texts.name,
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="font-medium truncate">
            {row.original.facilityName || row.original.contactName}
          </p>
          {row.original.facilityName && (
            <p className="text-xs text-muted-foreground truncate">
              {row.original.contactName}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <DealStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "estimatedValue",
      header: texts.value,
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.estimatedValue, "SAR", locale)}
        </span>
      ),
    },
    {
      accessorKey: "expectedCloseDate",
      header: texts.expectedClose,
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.expectedCloseDate ? (
            <span>{formatDate(row.original.expectedCloseDate, locale)}</span>
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
