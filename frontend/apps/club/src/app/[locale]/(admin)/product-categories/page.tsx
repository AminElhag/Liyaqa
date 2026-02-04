"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Plus, Tag, MoreHorizontal, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  useProductCategories,
  useCategoryStats,
  useActivateProductCategory,
  useDeactivateProductCategory,
  useDeleteProductCategory,
} from "@liyaqa/shared/queries/use-products";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { getLocalizedText } from "@liyaqa/shared/utils";
import { DEPARTMENT_LABELS } from "@liyaqa/shared/types/product";

export default function ProductCategoriesPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const [page, setPage] = useState(0);

  const { data: categoriesData, isLoading } = useProductCategories({ page, size: 20 });
  const { data: stats } = useCategoryStats();

  const activateCategory = useActivateProductCategory();
  const deactivateCategory = useDeactivateProductCategory();
  const deleteCategory = useDeleteProductCategory();

  const texts = {
    title: locale === "ar" ? "فئات المنتجات" : "Product Categories",
    addNew: locale === "ar" ? "إضافة فئة" : "Add Category",
    total: locale === "ar" ? "الإجمالي" : "Total",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    name: locale === "ar" ? "الاسم" : "Name",
    department: locale === "ar" ? "القسم" : "Department",
    status: locale === "ar" ? "الحالة" : "Status",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    delete: locale === "ar" ? "حذف" : "Delete",
    noCategories: locale === "ar" ? "لا توجد فئات" : "No categories found",
  };

  const handleActivate = async (id: string) => {
    try {
      await activateCategory.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التفعيل" : "Activated",
        description: locale === "ar" ? "تم تفعيل الفئة بنجاح" : "Category activated successfully",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في تفعيل الفئة" : "Failed to activate category",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateCategory.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم إلغاء التفعيل" : "Deactivated",
        description: locale === "ar" ? "تم إلغاء تفعيل الفئة بنجاح" : "Category deactivated successfully",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في إلغاء تفعيل الفئة" : "Failed to deactivate category",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من حذف هذه الفئة؟" : "Are you sure you want to delete this category?")) {
      return;
    }
    try {
      await deleteCategory.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الحذف" : "Deleted",
        description: locale === "ar" ? "تم حذف الفئة بنجاح" : "Category deleted successfully",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في حذف الفئة" : "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{texts.title}</h1>
        </div>
        <Button asChild>
          <Link href={`/${locale}/product-categories/new`}>
            <Plus className="h-4 w-4 me-2" />
            {texts.addNew}
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.total}</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.active}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.inactive}</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.inactive ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !categoriesData?.content?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <p>{texts.noCategories}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{texts.name}</TableHead>
                  <TableHead>{texts.department}</TableHead>
                  <TableHead>{texts.status}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriesData.content.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Link
                        href={`/${locale}/product-categories/${category.id}`}
                        className="font-medium hover:underline"
                      >
                        {getLocalizedText(category.name, locale)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {DEPARTMENT_LABELS[category.department][locale as "en" | "ar"]}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? texts.active : texts.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/product-categories/${category.id}`}>
                              {texts.view}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/product-categories/${category.id}/edit`}>
                              {texts.edit}
                            </Link>
                          </DropdownMenuItem>
                          {category.isActive ? (
                            <DropdownMenuItem onClick={() => handleDeactivate(category.id)}>
                              <XCircle className="h-4 w-4 me-2" />
                              {texts.deactivate}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleActivate(category.id)}>
                              <CheckCircle className="h-4 w-4 me-2" />
                              {texts.activate}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(category.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {texts.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {categoriesData && categoriesData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            {locale === "ar" ? "السابق" : "Previous"}
          </Button>
          <span className="py-2 px-4 text-sm">
            {page + 1} / {categoriesData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= categoriesData.totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            {locale === "ar" ? "التالي" : "Next"}
          </Button>
        </div>
      )}
    </div>
  );
}
