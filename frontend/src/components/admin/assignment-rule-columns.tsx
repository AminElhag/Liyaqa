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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { AssignmentRule } from "@/types/lead-rules";
import { ASSIGNMENT_TYPE_LABELS } from "@/types/lead-rules";

interface AssignmentRuleColumnsOptions {
  locale: string;
  onEdit: (rule: AssignmentRule) => void;
  onDelete: (rule: AssignmentRule) => void;
  onActivate: (rule: AssignmentRule) => void;
  onDeactivate: (rule: AssignmentRule) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  pendingRuleId?: string | null;
}

export function getAssignmentRuleColumns(
  options: AssignmentRuleColumnsOptions
): ColumnDef<AssignmentRule>[] {
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
    ruleType: isArabic ? "نوع القاعدة" : "Rule Type",
    priority: isArabic ? "الأولوية" : "Priority",
    status: isArabic ? "الحالة" : "Status",
    created: isArabic ? "تاريخ الإنشاء" : "Created",
    actions: isArabic ? "الإجراءات" : "Actions",
    edit: isArabic ? "تعديل" : "Edit",
    delete: isArabic ? "حذف" : "Delete",
    activate: isArabic ? "تفعيل" : "Activate",
    deactivate: isArabic ? "إلغاء التفعيل" : "Deactivate",
    active: isArabic ? "مفعل" : "Active",
    inactive: isArabic ? "غير مفعل" : "Inactive",
  };

  const getRuleTypeBadgeVariant = (type: AssignmentRule["ruleType"]) => {
    switch (type) {
      case "ROUND_ROBIN":
        return "default";
      case "LOCATION_BASED":
        return "secondary";
      case "SOURCE_BASED":
        return "outline";
      case "MANUAL":
        return "secondary";
      default:
        return "outline";
    }
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
      accessorKey: "ruleType",
      header: texts.ruleType,
      cell: ({ row }) => {
        const type = row.original.ruleType;
        return (
          <Badge variant={getRuleTypeBadgeVariant(type)}>
            {isArabic
              ? ASSIGNMENT_TYPE_LABELS[type].ar
              : ASSIGNMENT_TYPE_LABELS[type].en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: texts.priority,
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.priority}</span>
      ),
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
