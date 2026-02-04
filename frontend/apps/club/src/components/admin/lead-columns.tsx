"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Edit, Trash2, UserPlus, Phone, ArrowRight } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import type { Lead, LeadStatus, LeadSource, LeadPriority } from "@liyaqa/shared/types/lead";
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_PRIORITY_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_PRIORITY_COLORS,
} from "@liyaqa/shared/types/lead";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface GetLeadColumnsOptions {
  isArabic: boolean;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onContact?: (lead: Lead) => void;
  onTransition?: (lead: Lead, status: LeadStatus) => void;
}

export function getLeadColumns({
  isArabic,
  onView,
  onEdit,
  onDelete,
  onContact,
  onTransition,
}: GetLeadColumnsOptions): ColumnDef<Lead>[] {
  const dateLocale = isArabic ? ar : enUS;

  return [
    {
      accessorKey: "name",
      header: isArabic ? "الاسم" : "Name",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div>
            <div className="font-medium">{lead.name}</div>
            <div className="text-sm text-muted-foreground">{lead.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: isArabic ? "الحالة" : "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as LeadStatus;
        const label = LEAD_STATUS_LABELS[status];
        return (
          <Badge className={LEAD_STATUS_COLORS[status]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "source",
      header: isArabic ? "المصدر" : "Source",
      cell: ({ row }) => {
        const source = row.getValue("source") as LeadSource;
        const label = LEAD_SOURCE_LABELS[source];
        return <span>{isArabic ? label.ar : label.en}</span>;
      },
    },
    {
      accessorKey: "priority",
      header: isArabic ? "الأولوية" : "Priority",
      cell: ({ row }) => {
        const priority = row.original.priority as LeadPriority | undefined;
        if (!priority) return <span className="text-muted-foreground">-</span>;
        const label = LEAD_PRIORITY_LABELS[priority];
        return (
          <Badge variant="outline" className={LEAD_PRIORITY_COLORS[priority]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "score",
      header: isArabic ? "النقاط" : "Score",
      cell: ({ row }) => {
        const score = row.getValue("score") as number;
        return (
          <div className="font-medium">
            {score}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: isArabic ? "تاريخ الإنشاء" : "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt") as string);
        return (
          <span className="text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const lead = row.original;
        const canContact = lead.status === "NEW";
        const canScheduleTour = lead.status === "CONTACTED";
        const canStartTrial = lead.status === "TOUR_SCHEDULED";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {isArabic ? "الإجراءات" : "Actions"}
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(lead)}>
                <Eye className="me-2 h-4 w-4" />
                {isArabic ? "عرض" : "View"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(lead)}>
                <Edit className="me-2 h-4 w-4" />
                {isArabic ? "تعديل" : "Edit"}
              </DropdownMenuItem>

              {onContact && canContact && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onContact(lead)}>
                    <Phone className="me-2 h-4 w-4" />
                    {isArabic ? "تم التواصل" : "Mark Contacted"}
                  </DropdownMenuItem>
                </>
              )}

              {onTransition && canScheduleTour && (
                <DropdownMenuItem onClick={() => onTransition(lead, "TOUR_SCHEDULED")}>
                  <ArrowRight className="me-2 h-4 w-4" />
                  {isArabic ? "جدولة جولة" : "Schedule Tour"}
                </DropdownMenuItem>
              )}

              {onTransition && canStartTrial && (
                <DropdownMenuItem onClick={() => onTransition(lead, "TRIAL")}>
                  <UserPlus className="me-2 h-4 w-4" />
                  {isArabic ? "بدء التجربة" : "Start Trial"}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(lead)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="me-2 h-4 w-4" />
                {isArabic ? "حذف" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
