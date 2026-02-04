"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Users, Building2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { useDepartment, useChildDepartments } from "@liyaqa/shared/queries/use-departments";
import { useEmployees } from "@liyaqa/shared/queries/use-employees";
import { formatDate, getLocalizedText } from "@liyaqa/shared/utils";
import type { DepartmentStatus } from "@liyaqa/shared/types/employee";

export default function DepartmentDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const id = params.id as string;

  const { data: department, isLoading, error } = useDepartment(id);
  const { data: children } = useChildDepartments(id);
  const { data: employees } = useEmployees({ departmentId: id, size: 10 });

  const getStatusBadge = (status: DepartmentStatus) => {
    return status === "ACTIVE" ? (
      <Badge variant="success">{locale === "ar" ? "نشط" : "Active"}</Badge>
    ) : (
      <Badge variant="secondary">{locale === "ar" ? "غير نشط" : "Inactive"}</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/departments`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "خطأ" : "Error"}
          </h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            {locale === "ar" ? "فشل في تحميل بيانات القسم" : "Failed to load department data"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/departments`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {getLocalizedText(department.name, locale)}
            </h1>
            <div className="flex gap-2 mt-1">
              {getStatusBadge(department.status)}
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/${locale}/departments/${id}/edit`}>
            <Pencil className="h-4 w-4 me-2" />
            {locale === "ar" ? "تعديل" : "Edit"}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Department Info */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "ar" ? "معلومات القسم" : "Department Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {department.description && (
              <div>
                <p className="text-sm font-medium text-neutral-500">
                  {locale === "ar" ? "الوصف" : "Description"}
                </p>
                <p>{getLocalizedText(department.description, locale)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-neutral-500">
                {locale === "ar" ? "ترتيب العرض" : "Sort Order"}
              </p>
              <p>{department.sortOrder}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">
                {locale === "ar" ? "تاريخ الإنشاء" : "Created"}
              </p>
              <p>{formatDate(department.createdAt, locale)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Sub-departments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {locale === "ar" ? "الأقسام الفرعية" : "Sub-departments"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {children && children.length > 0 ? (
              <div className="space-y-2">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/${locale}/departments/${child.id}`}
                    className="block p-3 border rounded-lg hover:bg-neutral-50"
                  >
                    <div className="flex items-center justify-between">
                      <span>{getLocalizedText(child.name, locale)}</span>
                      {getStatusBadge(child.status)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-center py-4">
                {locale === "ar" ? "لا توجد أقسام فرعية" : "No sub-departments"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Employees */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {locale === "ar" ? "الموظفون" : "Employees"}
              {employees?.totalElements !== undefined && (
                <Badge variant="secondary">{employees.totalElements}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employees && employees.content.length > 0 ? (
              <div className="space-y-2">
                {employees.content.map((emp) => (
                  <Link
                    key={emp.id}
                    href={`/${locale}/employees/${emp.id}`}
                    className="block p-3 border rounded-lg hover:bg-neutral-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {getLocalizedText(emp.fullName, locale)}
                        </span>
                        {emp.email && (
                          <p className="text-sm text-neutral-500">{emp.email}</p>
                        )}
                      </div>
                      {emp.jobTitleName && (
                        <span className="text-sm text-neutral-500">
                          {getLocalizedText(emp.jobTitleName, locale)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                {employees.totalElements > 10 && (
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/${locale}/employees?departmentId=${id}`}>
                      {locale === "ar" ? "عرض الكل" : "View All"}
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-neutral-500 text-center py-4">
                {locale === "ar" ? "لا يوجد موظفون" : "No employees"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
