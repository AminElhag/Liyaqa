"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  PlayCircle,
  PauseCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ScoringRule } from "@liyaqa/shared/types/lead-rules";
import { TRIGGER_TYPE_LABELS } from "@liyaqa/shared/types/lead-rules";

interface ScoringRuleColumnsOptions {
  locale: string;
  onEdit: (rule: ScoringRule) => void;
  onDelete: (rule: ScoringRule) => void;
  onActivate: (rule: ScoringRule) => void;
  onDeactivate: (rule: ScoringRule) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  pendingRuleId?: string | null;
}

export function getScoringRuleColumns(
  options: ScoringRuleColumnsOptions
): ColumnDef<ScoringRule>[] {
  const {
    locale,
    onEdit,
    onDelete,
    onActivate,
    onDeactivate,
    canEdit = true,
    canDelete = true,
    pendingRuleId,
  } = options;

  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const texts = {
    name: isArabic ? "الاسم" : "Name",
    triggerType: isArabic ? "نوع المحفز" : "Trigger Type",
    triggerValue: isArabic ? "القيمة" : "Value",
    scoreChange: isArabic ? "النقاط" : "Score",
    status: isArabic ? "الحالة" : "Status",
    created: isArabic ? "تاريخ الإنشاء" : "Created",
    actions: isArabic ? "الإجراءات" : "Actions",
    edit: isArabic ? "تعديل" : "Edit",
    delete: isArabic ? "حذف" : "Delete",
    activate: isArabic ? "تفعيل" : "Activate",
    deactivate: isArabic ? "إلغاء التفعيل" : "Deactivate",
    active: isArabic ? "مفعل" : "Active",
    inactive: isArabic ? "غير مفعل" : "Inactive",
    any: isArabic ? "أي قيمة" : "Any",
  };

  return [
    {
      accessorKey: "name",
      header: texts.name,
      cell: ({ row }) => (
        <div className="font-medium max-w-[200px] truncate">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: "triggerType",
      header: texts.triggerType,
      cell: ({ row }) => {
        const type = row.original.triggerType;
        return (
          <Badge variant="outline">
            {isArabic
              ? TRIGGER_TYPE_LABELS[type].ar
              : TRIGGER_TYPE_LABELS[type].en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "triggerValue",
      header: texts.triggerValue,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.triggerValue || texts.any}
        </span>
      ),
    },
    {
      accessorKey: "scoreChange",
      header: texts.scoreChange,
      cell: ({ row }) => {
        const score = row.original.scoreChange;
        const isPositive = score > 0;
        return (
          <Badge variant={isPositive ? "default" : "secondary"}>
            {isPositive ? `+${score}` : score}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: texts.status,
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? texts.active : texts.inactive}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: texts.created,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
            locale: dateLocale,
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const rule = row.original;
        const isPendingForThis = pendingRuleId === rule.id;
        const isAnyPending =
          pendingRuleId !== null && pendingRuleId !== undefined;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isAnyPending}>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                {isPendingForThis ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isArabic ? "start" : "end"}>
              <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(rule)}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canEdit && rule.isActive && (
                <DropdownMenuItem onClick={() => onDeactivate(rule)}>
                  <PauseCircle className="me-2 h-4 w-4" />
                  {texts.deactivate}
                </DropdownMenuItem>
              )}
              {canEdit && !rule.isActive && (
                <DropdownMenuItem onClick={() => onActivate(rule)}>
                  <PlayCircle className="me-2 h-4 w-4" />
                  {texts.activate}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(rule)}
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
