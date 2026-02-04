"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Building2,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  ChevronRight,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import {
  useDepartmentTree,
  useActivateDepartment,
  useDeactivateDepartment,
  useDeleteDepartment,
} from "@liyaqa/shared/queries/use-departments";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { DepartmentTreeNode, DepartmentStatus } from "@liyaqa/shared/types/employee";

export default function DepartmentsPage() {
  const locale = useLocale();
  const { toast } = useToast();

  const { data: tree, isLoading, error } = useDepartmentTree();
  const activateDepartment = useActivateDepartment();
  const deactivateDepartment = useDeactivateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const handleActivate = async (id: string) => {
    try {
      await activateDepartment.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التفعيل" : "Activated",
        description: locale === "ar" ? "تم تفعيل القسم بنجاح" : "Department activated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في تفعيل القسم" : "Failed to activate department",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateDepartment.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التعطيل" : "Deactivated",
        description: locale === "ar" ? "تم تعطيل القسم بنجاح" : "Department deactivated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في تعطيل القسم" : "Failed to deactivate department",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDepartment.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الحذف" : "Deleted",
        description: locale === "ar" ? "تم حذف القسم بنجاح" : "Department deleted",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في حذف القسم. تأكد من عدم وجود موظفين أو أقسام فرعية" : "Failed to delete. Make sure there are no employees or sub-departments",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: DepartmentStatus) => {
    return status === "ACTIVE" ? (
      <Badge variant="success">{locale === "ar" ? "نشط" : "Active"}</Badge>
    ) : (
      <Badge variant="secondary">{locale === "ar" ? "غير نشط" : "Inactive"}</Badge>
    );
  };

  const renderTreeNode = (node: DepartmentTreeNode, level: number = 0) => (
    <div key={node.id} style={{ marginLeft: `${level * 24}px` }}>
      <Card className="mb-2 hover:shadow-md transition-shadow">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {node.children.length > 0 && (
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {getLocalizedText(node.name, locale)}
                  </span>
                  {getStatusBadge(node.status)}
                </div>
                {node.description && (
                  <p className="text-sm text-neutral-500">
                    {getLocalizedText(node.description, locale)}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                  <Users className="h-3 w-3" />
                  <span>
                    {node.employeeCount} {locale === "ar" ? "موظف" : "employees"}
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/departments/${node.id}`}>
                    <Eye className="h-4 w-4 me-2" />
                    {locale === "ar" ? "عرض" : "View"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/departments/${node.id}/edit`}>
                    <Pencil className="h-4 w-4 me-2" />
                    {locale === "ar" ? "تعديل" : "Edit"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {node.status === "INACTIVE" ? (
                  <DropdownMenuItem onClick={() => handleActivate(node.id)}>
                    <Power className="h-4 w-4 me-2" />
                    {locale === "ar" ? "تفعيل" : "Activate"}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleDeactivate(node.id)}>
                    <PowerOff className="h-4 w-4 me-2" />
                    {locale === "ar" ? "تعطيل" : "Deactivate"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDelete(node.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  {locale === "ar" ? "حذف" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
      {node.children.length > 0 && (
        <div className="border-s-2 border-neutral-200 ms-3">
          {node.children.map((child) => renderTreeNode(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "الأقسام" : "Departments"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar" ? "إدارة هيكل الأقسام" : "Manage department structure"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/departments/new`}>
            <Plus className="h-4 w-4 me-2" />
            {locale === "ar" ? "إضافة قسم" : "Add Department"}
          </Link>
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            {locale === "ar" ? "فشل في تحميل الأقسام" : "Failed to load departments"}
          </CardContent>
        </Card>
      )}

      {/* Department tree */}
      {!isLoading && !error && (
        <>
          {!tree || tree.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-neutral-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                <p>{locale === "ar" ? "لا توجد أقسام" : "No departments found"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {tree.map((node) => renderTreeNode(node))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
