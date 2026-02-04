"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Shield,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import {
  useJobTitles,
  useActivateJobTitle,
  useDeactivateJobTitle,
  useDeleteJobTitle,
} from "@liyaqa/shared/queries/use-job-titles";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { Role } from "@liyaqa/shared/types/employee";

export default function JobTitlesPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const { data, isLoading, error } = useJobTitles({
    page,
    size: 20,
    activeOnly: activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
  });

  const activateJobTitle = useActivateJobTitle();
  const deactivateJobTitle = useDeactivateJobTitle();
  const deleteJobTitle = useDeleteJobTitle();

  const handleActivate = async (id: string) => {
    try {
      await activateJobTitle.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التفعيل" : "Activated",
        description: locale === "ar" ? "تم تفعيل المسمى الوظيفي بنجاح" : "Job title activated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في التفعيل" : "Failed to activate",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateJobTitle.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التعطيل" : "Deactivated",
        description: locale === "ar" ? "تم تعطيل المسمى الوظيفي بنجاح" : "Job title deactivated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في التعطيل" : "Failed to deactivate",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJobTitle.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الحذف" : "Deleted",
        description: locale === "ar" ? "تم حذف المسمى الوظيفي بنجاح" : "Job title deleted",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في الحذف" : "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: Role) => {
    const roleConfig: Record<Role, { labelEn: string; labelAr: string; variant: "default" | "secondary" | "outline" }> = {
      SUPER_ADMIN: { labelEn: "Super Admin", labelAr: "مدير أعلى", variant: "default" },
      PLATFORM_ADMIN: { labelEn: "Platform Admin", labelAr: "مدير المنصة", variant: "default" },
      SALES_REP: { labelEn: "Sales Rep", labelAr: "مندوب مبيعات", variant: "secondary" },
      SUPPORT_REP: { labelEn: "Support Rep", labelAr: "مندوب دعم", variant: "secondary" },
      CLUB_ADMIN: { labelEn: "Club Admin", labelAr: "مدير النادي", variant: "default" },
      STAFF: { labelEn: "Staff", labelAr: "موظف", variant: "outline" },
      TRAINER: { labelEn: "Trainer", labelAr: "مدرب", variant: "secondary" },
      MEMBER: { labelEn: "Member", labelAr: "عضو", variant: "outline" },
    };

    const config = roleConfig[role];
    return (
      <Badge variant={config.variant}>
        <Shield className="h-3 w-3 me-1" />
        {locale === "ar" ? config.labelAr : config.labelEn}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "المسميات الوظيفية" : "Job Titles"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar" ? "إدارة المسميات الوظيفية والصلاحيات" : "Manage job titles and permissions"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/job-titles/new`}>
            <Plus className="h-4 w-4 me-2" />
            {locale === "ar" ? "إضافة مسمى" : "Add Job Title"}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <Select
            value={activeFilter}
            onValueChange={(value) => setActiveFilter(value as "all" | "active" | "inactive")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={locale === "ar" ? "الحالة" : "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {locale === "ar" ? "الكل" : "All"}
              </SelectItem>
              <SelectItem value="active">
                {locale === "ar" ? "نشط" : "Active"}
              </SelectItem>
              <SelectItem value="inactive">
                {locale === "ar" ? "غير نشط" : "Inactive"}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            {locale === "ar" ? "فشل في تحميل المسميات الوظيفية" : "Failed to load job titles"}
          </CardContent>
        </Card>
      )}

      {/* Job titles table */}
      {!isLoading && !error && (
        <>
          {!data || data.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-neutral-500">
                <Briefcase className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                <p>{locale === "ar" ? "لا توجد مسميات وظيفية" : "No job titles found"}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "ar" ? "المسمى" : "Title"}</TableHead>
                    <TableHead>{locale === "ar" ? "القسم" : "Department"}</TableHead>
                    <TableHead>{locale === "ar" ? "الدور" : "Role"}</TableHead>
                    <TableHead>{locale === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-end">{locale === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.content.map((jt) => (
                    <TableRow key={jt.id}>
                      <TableCell className="font-medium">
                        {getLocalizedText(jt.name, locale)}
                      </TableCell>
                      <TableCell>
                        {jt.departmentName
                          ? getLocalizedText(jt.departmentName, locale)
                          : <span className="text-neutral-400">—</span>}
                      </TableCell>
                      <TableCell>{getRoleBadge(jt.defaultRole)}</TableCell>
                      <TableCell>
                        {jt.isActive ? (
                          <Badge variant="success">{locale === "ar" ? "نشط" : "Active"}</Badge>
                        ) : (
                          <Badge variant="secondary">{locale === "ar" ? "غير نشط" : "Inactive"}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/${locale}/job-titles/${jt.id}`}>
                                <Eye className="h-4 w-4 me-2" />
                                {locale === "ar" ? "عرض" : "View"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/${locale}/job-titles/${jt.id}/edit`}>
                                <Pencil className="h-4 w-4 me-2" />
                                {locale === "ar" ? "تعديل" : "Edit"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {jt.isActive ? (
                              <DropdownMenuItem onClick={() => handleDeactivate(jt.id)}>
                                <PowerOff className="h-4 w-4 me-2" />
                                {locale === "ar" ? "تعطيل" : "Deactivate"}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivate(jt.id)}>
                                <Power className="h-4 w-4 me-2" />
                                {locale === "ar" ? "تفعيل" : "Activate"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(jt.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 me-2" />
                              {locale === "ar" ? "حذف" : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                {locale === "ar" ? "السابق" : "Previous"}
              </Button>
              <span className="flex items-center px-4 text-sm">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
              >
                {locale === "ar" ? "التالي" : "Next"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
