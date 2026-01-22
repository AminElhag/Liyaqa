"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Snowflake,
  FileCheck,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FreezePackage } from "@/types/freeze";
import type { LocalizedText, Money } from "@/types/api";

export interface FreezePackageColumnsOptions {
  locale: string;
  onView: (pkg: FreezePackage) => void;
  onEdit: (pkg: FreezePackage) => void;
  onActivate: (pkg: FreezePackage) => void;
  onDeactivate: (pkg: FreezePackage) => void;
}

function formatCurrency(money: Money, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(money.amount);
}

function getLocalizedText(text: LocalizedText, locale: string): string {
  return locale === "ar" ? text.ar || text.en : text.en;
}

export function getFreezePackageColumns(
  options: FreezePackageColumnsOptions
): ColumnDef<FreezePackage>[] {
  const { locale, onView, onEdit, onActivate, onDeactivate } = options;

  const texts = {
    name: locale === "ar" ? "اسم الباقة" : "Package Name",
    freezeDays: locale === "ar" ? "أيام التجميد" : "Freeze Days",
    price: locale === "ar" ? "السعر" : "Price",
    extendsContract: locale === "ar" ? "تمديد العقد" : "Extends Contract",
    requiresDocs: locale === "ar" ? "مستندات" : "Requires Docs",
    status: locale === "ar" ? "الحالة" : "Status",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    yes: locale === "ar" ? "نعم" : "Yes",
    no: locale === "ar" ? "لا" : "No",
    days: locale === "ar" ? "يوم" : "days",
  };

  return [
    {
      accessorKey: "name",
      header: texts.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Snowflake className="h-4 w-4 text-blue-500" />
          <span className="font-medium">
            {getLocalizedText(row.original.name, locale)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "freezeDays",
      header: texts.freezeDays,
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.freezeDays} {texts.days}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: texts.price,
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.price, locale)}
        </span>
      ),
    },
    {
      accessorKey: "extendsContract",
      header: texts.extendsContract,
      cell: ({ row }) =>
        row.original.extendsContract ? (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
            <CalendarPlus className="h-3 w-3" />
            {texts.yes}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            {texts.no}
          </Badge>
        ),
    },
    {
      accessorKey: "requiresDocumentation",
      header: texts.requiresDocs,
      cell: ({ row }) =>
        row.original.requiresDocumentation ? (
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
            <FileCheck className="h-3 w-3" />
            {texts.yes}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            {texts.no}
          </Badge>
        ),
    },
    {
      accessorKey: "isActive",
      header: texts.status,
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            {texts.active}
          </Badge>
        ) : (
          <Badge variant="secondary">{texts.inactive}</Badge>
        ),
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const pkg = row.original;

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
              <DropdownMenuItem onClick={() => onView(pkg)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(pkg)}>
                <Edit className="me-2 h-4 w-4" />
                {texts.edit}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!pkg.isActive ? (
                <DropdownMenuItem onClick={() => onActivate(pkg)}>
                  <CheckCircle className="me-2 h-4 w-4 text-green-600" />
                  {texts.activate}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => onDeactivate(pkg)}
                  className="text-warning"
                >
                  <XCircle className="me-2 h-4 w-4" />
                  {texts.deactivate}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
