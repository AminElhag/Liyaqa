"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  UserCheck,
  ArrowRightCircle,
  UserCog,
  MessageSquare,
  Building2,
  Hash,
  Clock,
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
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import type { SupportTicketSummary, TicketCategory } from "@/types/platform/support-ticket";
import type { LocalizedText } from "@/types/api";

/**
 * Options for configuring ticket columns.
 */
export interface TicketColumnsOptions {
  locale: string;
  onView: (ticket: SupportTicketSummary) => void;
  onEdit: (ticket: SupportTicketSummary) => void;
  onAssign: (ticket: SupportTicketSummary) => void;
  onChangeStatus: (ticket: SupportTicketSummary) => void;
  onImpersonate?: (ticket: SupportTicketSummary) => void;
  canEdit?: boolean;
  canImpersonate?: boolean;
}

/**
 * Format relative time for display.
 */
function formatRelativeTime(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return locale === "ar" ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return locale === "ar" ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
  }
  if (diffMinutes > 0) {
    return locale === "ar" ? `منذ ${diffMinutes} دقيقة` : `${diffMinutes}m ago`;
  }
  return locale === "ar" ? "الآن" : "Just now";
}

/**
 * Get localized text based on locale.
 */
function getLocalizedText(text: LocalizedText | undefined, locale: string): string {
  if (!text) return "-";
  return locale === "ar" ? text.ar || text.en : text.en;
}

/**
 * Category labels for display.
 */
const CATEGORY_LABELS: Record<TicketCategory, { en: string; ar: string }> = {
  BILLING: { en: "Billing", ar: "الفوترة" },
  TECHNICAL: { en: "Technical", ar: "تقني" },
  ACCOUNT: { en: "Account", ar: "الحساب" },
  FEATURE_REQUEST: { en: "Feature Request", ar: "طلب ميزة" },
  BUG_REPORT: { en: "Bug Report", ar: "تقرير خطأ" },
  GENERAL: { en: "General", ar: "عام" },
};

/**
 * Creates column definitions for the support tickets DataTable.
 */
export function getTicketColumns(
  options: TicketColumnsOptions
): ColumnDef<SupportTicketSummary>[] {
  const {
    locale,
    onView,
    onEdit,
    onAssign,
    onChangeStatus,
    onImpersonate,
    canEdit = true,
    canImpersonate = false,
  } = options;

  const texts = {
    ticketNumber: locale === "ar" ? "رقم التذكرة" : "Ticket #",
    subject: locale === "ar" ? "الموضوع" : "Subject",
    client: locale === "ar" ? "العميل" : "Client",
    category: locale === "ar" ? "التصنيف" : "Category",
    status: locale === "ar" ? "الحالة" : "Status",
    priority: locale === "ar" ? "الأولوية" : "Priority",
    assignedTo: locale === "ar" ? "مسند إلى" : "Assigned To",
    lastActivity: locale === "ar" ? "آخر نشاط" : "Last Activity",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    assign: locale === "ar" ? "إسناد" : "Assign",
    changeStatus: locale === "ar" ? "تغيير الحالة" : "Change Status",
    impersonate: locale === "ar" ? "انتحال الشخصية" : "Impersonate",
    unassigned: locale === "ar" ? "غير مسند" : "Unassigned",
    messages: locale === "ar" ? "رسائل" : "messages",
    noClient: locale === "ar" ? "عميل" : "Client",
  };

  return [
    {
      accessorKey: "ticketNumber",
      header: texts.ticketNumber,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium">
            {row.original.ticketNumber}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "subject",
      header: texts.subject,
      cell: ({ row }) => (
        <div className="max-w-[250px]">
          <p className="font-medium truncate">{row.original.subject}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span>
              {row.original.messageCount} {texts.messages}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "organizationName",
      header: texts.client,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>
            {row.original.organizationName
              ? getLocalizedText(row.original.organizationName, locale)
              : `${texts.noClient} #${row.original.organizationId.slice(0, 8)}`}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: texts.category,
      cell: ({ row }) => {
        const cat = CATEGORY_LABELS[row.original.category];
        return <span className="text-sm">{locale === "ar" ? cat.ar : cat.en}</span>;
      },
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <TicketStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "priority",
      header: texts.priority,
      cell: ({ row }) => <TicketPriorityBadge priority={row.original.priority} />,
    },
    {
      accessorKey: "assignedToName",
      header: texts.assignedTo,
      cell: ({ row }) => (
        <span
          className={
            !row.original.assignedToName ? "text-muted-foreground italic" : ""
          }
        >
          {row.original.assignedToName || texts.unassigned}
        </span>
      ),
    },
    {
      accessorKey: "lastMessageAt",
      header: texts.lastActivity,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {row.original.lastMessageAt
              ? formatRelativeTime(row.original.lastMessageAt, locale)
              : formatRelativeTime(row.original.createdAt, locale)}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const ticket = row.original;
        const isClosed = ticket.status === "CLOSED";
        const isResolved = ticket.status === "RESOLVED";
        const canEditTicket = !isClosed;
        const canAssignTicket = !isClosed && !isResolved;
        const canChangeStatusTicket = !isClosed;

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
              <DropdownMenuItem onClick={() => onView(ticket)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              {canEdit && canEditTicket && (
                <DropdownMenuItem onClick={() => onEdit(ticket)}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canEdit && canAssignTicket && (
                <DropdownMenuItem onClick={() => onAssign(ticket)}>
                  <UserCheck className="me-2 h-4 w-4 text-blue-600" />
                  {texts.assign}
                </DropdownMenuItem>
              )}
              {canEdit && canChangeStatusTicket && (
                <DropdownMenuItem onClick={() => onChangeStatus(ticket)}>
                  <ArrowRightCircle className="me-2 h-4 w-4 text-amber-600" />
                  {texts.changeStatus}
                </DropdownMenuItem>
              )}
              {canImpersonate && onImpersonate && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onImpersonate(ticket)}>
                    <UserCog className="me-2 h-4 w-4 text-orange-600" />
                    {texts.impersonate}
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
