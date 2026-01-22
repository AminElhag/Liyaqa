"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Edit, CheckCircle, XCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientStatusBadge } from "./client-status-badge";
import { formatDate, getLocalizedText } from "@/lib/utils";
import type { Client } from "@/types/platform";
import type { OrganizationType } from "@/types/organization";

interface ClientColumnsOptions {
  locale: string;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onActivate: (client: Client) => void;
  onSuspend: (client: Client) => void;
  canEdit?: boolean;
}

const ORG_TYPE_LABELS: Record<OrganizationType, { en: string; ar: string }> = {
  LLC: { en: "LLC", ar: "ذ.م.م" },
  SOLE_PROPRIETORSHIP: { en: "Sole Proprietorship", ar: "مؤسسة فردية" },
  PARTNERSHIP: { en: "Partnership", ar: "شراكة" },
  CORPORATION: { en: "Corporation", ar: "شركة مساهمة" },
  OTHER: { en: "Other", ar: "أخرى" },
};

export function getClientColumns(options: ClientColumnsOptions): ColumnDef<Client>[] {
  const { locale, onView, onEdit, onActivate, onSuspend, canEdit = true } = options;

  const texts = {
    name: locale === "ar" ? "الاسم" : "Name",
    status: locale === "ar" ? "الحالة" : "Status",
    type: locale === "ar" ? "النوع" : "Type",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    suspend: locale === "ar" ? "إيقاف" : "Suspend",
    na: locale === "ar" ? "غير محدد" : "N/A",
  };

  return [
    {
      accessorKey: "name",
      header: texts.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-3 max-w-[250px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">
              {getLocalizedText(row.original.name, locale)}
            </p>
            {row.original.tradeName && (
              <p className="text-xs text-muted-foreground truncate">
                {getLocalizedText(row.original.tradeName, locale)}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <ClientStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "organizationType",
      header: texts.type,
      cell: ({ row }) => (
        <span className="text-sm">
          {locale === "ar"
            ? ORG_TYPE_LABELS[row.original.organizationType]?.ar || texts.na
            : ORG_TYPE_LABELS[row.original.organizationType]?.en || texts.na}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: texts.email,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.email || texts.na}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: texts.phone,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.phone || texts.na}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: texts.createdAt,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt, locale)}
        </span>
      ),
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const client = row.original;
        const canActivate = client.status === "PENDING" || client.status === "SUSPENDED";
        const canSuspend = client.status === "ACTIVE";

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
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(client)}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
              )}
              {canEdit && (canActivate || canSuspend) && (
                <>
                  <DropdownMenuSeparator />
                  {canActivate && (
                    <DropdownMenuItem onClick={() => onActivate(client)}>
                      <CheckCircle className="me-2 h-4 w-4" />
                      {texts.activate}
                    </DropdownMenuItem>
                  )}
                  {canSuspend && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onSuspend(client)}
                    >
                      <XCircle className="me-2 h-4 w-4" />
                      {texts.suspend}
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

export { ORG_TYPE_LABELS };
