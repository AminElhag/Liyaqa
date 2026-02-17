"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Play, Pause, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useClassCategories,
  useActivateClassCategory,
  useDeactivateClassCategory,
  useDeleteClassCategory,
} from "@liyaqa/shared/queries/use-class-categories";
import type { ClassCategory } from "@liyaqa/shared/types/scheduling";

export default function ClassCategoriesPage() {
  const locale = useLocale() as "en" | "ar";
  const t = useTranslations("nav");
  const { toast } = useToast();

  const { data, isLoading } = useClassCategories({ size: 100 });
  const activateMutation = useActivateClassCategory();
  const deactivateMutation = useDeactivateClassCategory();
  const deleteMutation = useDeleteClassCategory();

  const columns = useMemo<ColumnDef<ClassCategory>[]>(
    () => [
      {
        accessorKey: "name",
        header: locale === "ar" ? "الاسم" : "Name",
        cell: ({ row }) => {
          const name = row.original.name;
          return (
            <div className="flex items-center gap-2">
              {row.original.colorCode && (
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: row.original.colorCode }}
                />
              )}
              <span className="font-medium">
                {locale === "ar" ? name.ar || name.en : name.en}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "icon",
        header: locale === "ar" ? "أيقونة" : "Icon",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.icon || "—"}
          </span>
        ),
      },
      {
        accessorKey: "sortOrder",
        header: locale === "ar" ? "الترتيب" : "Order",
      },
      {
        accessorKey: "isActive",
        header: locale === "ar" ? "الحالة" : "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.isActive ? "active" : "inactive"}
            label={
              row.original.isActive
                ? locale === "ar"
                  ? "نشط"
                  : "Active"
                : locale === "ar"
                  ? "غير نشط"
                  : "Inactive"
            }
          />
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const category = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {category.isActive ? (
                  <DropdownMenuItem
                    onClick={() =>
                      deactivateMutation.mutate(category.id, {
                        onSuccess: () =>
                          toast({
                            title:
                              locale === "ar"
                                ? "تم التعطيل"
                                : "Category deactivated",
                          }),
                      })
                    }
                  >
                    <Pause className="me-2 h-4 w-4" />
                    {locale === "ar" ? "تعطيل" : "Deactivate"}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() =>
                      activateMutation.mutate(category.id, {
                        onSuccess: () =>
                          toast({
                            title:
                              locale === "ar"
                                ? "تم التفعيل"
                                : "Category activated",
                          }),
                      })
                    }
                  >
                    <Play className="me-2 h-4 w-4" />
                    {locale === "ar" ? "تفعيل" : "Activate"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() =>
                    deleteMutation.mutate(category.id, {
                      onSuccess: () =>
                        toast({
                          title:
                            locale === "ar" ? "تم الحذف" : "Category deleted",
                        }),
                      onError: (error: Error) =>
                        toast({
                          title:
                            locale === "ar"
                              ? "فشل الحذف"
                              : "Failed to delete",
                          description: error.message,
                          variant: "destructive",
                        }),
                    })
                  }
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {locale === "ar" ? "حذف" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [locale, activateMutation, deactivateMutation, deleteMutation, toast]
  );

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {locale === "ar" ? "فئات الصفوف" : "Class Categories"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إدارة فئات الصفوف لتوزيع أرصدة الباقات"
              : "Manage class categories for pack credit allocation"}
          </p>
        </div>
        <Button asChild>
          <Link
            href={`/${locale}/class-categories/new`}
          >
            <Plus className="me-2 h-4 w-4" />
            {locale === "ar" ? "فئة جديدة" : "New Category"}
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={data?.content ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
