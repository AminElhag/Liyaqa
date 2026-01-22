"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, CheckCircle, X, Flag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PTSessionStatusBadge } from "./pt-session-status-badge";
import type { PTSessionSummary } from "@/types/pt-session";

interface PTSessionColumnsOptions {
  locale: string;
  onView: (session: PTSessionSummary) => void;
  onConfirm: (session: PTSessionSummary) => void;
  onCancel: (session: PTSessionSummary) => void;
  onComplete: (session: PTSessionSummary) => void;
  onNoShow: (session: PTSessionSummary) => void;
}

export function getPTSessionColumns({
  locale,
  onView,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
}: PTSessionColumnsOptions): ColumnDef<PTSessionSummary>[] {
  const texts = {
    trainer: locale === "ar" ? "المدرب" : "Trainer",
    member: locale === "ar" ? "العضو" : "Member",
    date: locale === "ar" ? "التاريخ" : "Date",
    time: locale === "ar" ? "الوقت" : "Time",
    status: locale === "ar" ? "الحالة" : "Status",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    confirm: locale === "ar" ? "تأكيد" : "Confirm",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    complete: locale === "ar" ? "إكمال" : "Complete",
    noShow: locale === "ar" ? "لم يحضر" : "No Show",
  };

  return [
    {
      accessorKey: "trainerName",
      header: texts.trainer,
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.trainerName || "-"}</span>;
      },
    },
    {
      accessorKey: "memberName",
      header: texts.member,
      cell: ({ row }) => {
        return <span>{row.original.memberName || "-"}</span>;
      },
    },
    {
      accessorKey: "sessionDate",
      header: texts.date,
      cell: ({ row }) => {
        const date = new Date(row.original.sessionDate);
        return (
          <span>
            {date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    },
    {
      accessorKey: "startTime",
      header: texts.time,
      cell: ({ row }) => {
        return <span>{row.original.startTime}</span>;
      },
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <PTSessionStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const session = row.original;
        const canConfirm = session.status === "REQUESTED";
        const canCancel = session.status === "REQUESTED" || session.status === "CONFIRMED";
        const canComplete = session.status === "CONFIRMED" || session.status === "IN_PROGRESS";
        const canNoShow = session.status === "CONFIRMED";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(session)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canConfirm && (
                <DropdownMenuItem onClick={() => onConfirm(session)}>
                  <CheckCircle className="me-2 h-4 w-4" />
                  {texts.confirm}
                </DropdownMenuItem>
              )}
              {canComplete && (
                <DropdownMenuItem onClick={() => onComplete(session)}>
                  <Clock className="me-2 h-4 w-4" />
                  {texts.complete}
                </DropdownMenuItem>
              )}
              {canNoShow && (
                <DropdownMenuItem onClick={() => onNoShow(session)}>
                  <Flag className="me-2 h-4 w-4" />
                  {texts.noShow}
                </DropdownMenuItem>
              )}
              {canCancel && (
                <DropdownMenuItem onClick={() => onCancel(session)} className="text-destructive">
                  <X className="me-2 h-4 w-4" />
                  {texts.cancel}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
