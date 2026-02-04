"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Send,
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
import type { Webhook } from "@liyaqa/shared/types/webhook";

interface WebhookColumnsOptions {
  locale: string;
  onView: (webhook: Webhook) => void;
  onEdit: (webhook: Webhook) => void;
  onDelete: (webhook: Webhook) => void;
  onActivate: (webhook: Webhook) => void;
  onDeactivate: (webhook: Webhook) => void;
  onTest: (webhook: Webhook) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  pendingWebhookId?: string | null;
}

export function getWebhookColumns(
  options: WebhookColumnsOptions
): ColumnDef<Webhook>[] {
  const {
    locale,
    onView,
    onEdit,
    onDelete,
    onActivate,
    onDeactivate,
    onTest,
    canEdit = true,
    canDelete = true,
    pendingWebhookId,
  } = options;

  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const texts = {
    name: isArabic ? "الاسم" : "Name",
    url: isArabic ? "الرابط" : "URL",
    events: isArabic ? "الأحداث" : "Events",
    status: isArabic ? "الحالة" : "Status",
    created: isArabic ? "تاريخ الإنشاء" : "Created",
    actions: isArabic ? "الإجراءات" : "Actions",
    view: isArabic ? "عرض" : "View",
    edit: isArabic ? "تعديل" : "Edit",
    delete: isArabic ? "حذف" : "Delete",
    activate: isArabic ? "تفعيل" : "Activate",
    deactivate: isArabic ? "إلغاء التفعيل" : "Deactivate",
    test: isArabic ? "اختبار" : "Test",
    active: isArabic ? "مفعل" : "Active",
    inactive: isArabic ? "غير مفعل" : "Inactive",
    allEvents: isArabic ? "جميع الأحداث" : "All Events",
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
      accessorKey: "url",
      header: texts.url,
      cell: ({ row }) => (
        <div
          className="text-sm text-muted-foreground max-w-[300px] truncate font-mono"
          dir="ltr"
        >
          {row.original.url}
        </div>
      ),
    },
    {
      accessorKey: "events",
      header: texts.events,
      cell: ({ row }) => {
        const events = row.original.events;
        if (events.includes("*")) {
          return (
            <Badge variant="secondary" className="whitespace-nowrap">
              {texts.allEvents}
            </Badge>
          );
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {events.slice(0, 2).map((event) => (
              <Badge key={event} variant="outline" className="text-xs">
                {event.split(".")[0]}
              </Badge>
            ))}
            {events.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{events.length - 2}
              </span>
            )}
          </div>
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
        const webhook = row.original;
        const isPendingForThis = pendingWebhookId === webhook.id;
        const isAnyPending =
          pendingWebhookId !== null && pendingWebhookId !== undefined;

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
              <DropdownMenuItem onClick={() => onView(webhook)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(webhook)}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem onClick={() => onTest(webhook)}>
                  <Send className="me-2 h-4 w-4" />
                  {texts.test}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canEdit && webhook.isActive && (
                <DropdownMenuItem onClick={() => onDeactivate(webhook)}>
                  <PauseCircle className="me-2 h-4 w-4" />
                  {texts.deactivate}
                </DropdownMenuItem>
              )}
              {canEdit && !webhook.isActive && (
                <DropdownMenuItem onClick={() => onActivate(webhook)}>
                  <PlayCircle className="me-2 h-4 w-4" />
                  {texts.activate}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(webhook)}
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
