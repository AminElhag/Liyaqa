"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientStatusBadge } from "./client-status-badge";
import type { TrainerClientResponse } from "@/types/trainer-portal";

interface ClientColumnsOptions {
  locale: string;
  onView: (client: TrainerClientResponse) => void;
  onEdit: (client: TrainerClientResponse) => void;
}

export function getClientColumns(
  options: ClientColumnsOptions
): ColumnDef<TrainerClientResponse>[] {
  const { locale, onView, onEdit } = options;

  const texts = {
    name: locale === "ar" ? "الاسم" : "Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    status: locale === "ar" ? "الحالة" : "Status",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    sessions: locale === "ar" ? "الجلسات" : "Sessions",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    na: locale === "ar" ? "غير محدد" : "N/A",
    completed: locale === "ar" ? "مكتملة" : "Completed",
    cancelled: locale === "ar" ? "ملغية" : "Cancelled",
    noShow: locale === "ar" ? "غياب" : "No Show",
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch {
      return texts.na;
    }
  };

  return [
    {
      accessorKey: "memberName",
      header: texts.name,
      cell: ({ row }) => {
        const name = row.original.memberName || texts.na;
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div className="flex items-center gap-3 max-w-[250px]">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{name}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "memberEmail",
      header: texts.email,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.memberEmail || texts.na}</span>
      ),
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <ClientStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "startDate",
      header: texts.startDate,
      cell: ({ row }) => (
        <span className="text-sm">{formatDate(row.original.startDate)}</span>
      ),
    },
    {
      id: "sessions",
      header: texts.sessions,
      cell: ({ row }) => {
        const { completedSessions, cancelledSessions, noShowSessions } =
          row.original;

        return (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium" title={texts.completed}>
              {completedSessions}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="text-amber-600 font-medium" title={texts.cancelled}>
              {cancelledSessions}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="text-red-600 font-medium" title={texts.noShow}>
              {noShowSessions}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const client = row.original;

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
              <DropdownMenuItem onClick={() => onView(client)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(client)}>
                <Edit className="me-2 h-4 w-4" />
                {texts.edit}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
