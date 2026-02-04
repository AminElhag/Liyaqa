"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Shield, Building2, Users } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { useJobTitle } from "@liyaqa/shared/queries/use-job-titles";
import { useEmployees } from "@liyaqa/shared/queries/use-employees";
import { formatDate, getLocalizedText } from "@liyaqa/shared/utils";
import type { Role } from "@liyaqa/shared/types/employee";

export default function JobTitleDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const id = params.id as string;

  const { data: jobTitle, isLoading, error } = useJobTitle(id);
  const { data: employees } = useEmployees({ jobTitleId: id, size: 10 });

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

  if (error || !jobTitle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/job-titles`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "خطأ" : "Error"}
          </h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            {locale === "ar" ? "فشل في تحميل البيانات" : "Failed to load data"}
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
            <Link href={`/${locale}/job-titles`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {getLocalizedText(jobTitle.name, locale)}
            </h1>
            <div className="flex gap-2 mt-1">
              {jobTitle.isActive ? (
                <Badge variant="success">{locale === "ar" ? "نشط" : "Active"}</Badge>
              ) : (
                <Badge variant="secondary">{locale === "ar" ? "غير نشط" : "Inactive"}</Badge>
              )}
              {getRoleBadge(jobTitle.defaultRole)}
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/${locale}/job-titles/${id}/edit`}>
            <Pencil className="h-4 w-4 me-2" />
            {locale === "ar" ? "تعديل" : "Edit"}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Job Title Info */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "ar" ? "معلومات المسمى الوظيفي" : "Job Title Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobTitle.description && (
              <div>
                <p className="text-sm font-medium text-neutral-500">
                  {locale === "ar" ? "الوصف" : "Description"}
                </p>
                <p>{getLocalizedText(jobTitle.description, locale)}</p>
              </div>
            )}
            {jobTitle.departmentName && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-neutral-500" />
                <span>{getLocalizedText(jobTitle.departmentName, locale)}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-neutral-500">
                {locale === "ar" ? "ترتيب العرض" : "Sort Order"}
              </p>
              <p>{jobTitle.sortOrder}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">
                {locale === "ar" ? "تاريخ الإنشاء" : "Created"}
              </p>
              <p>{formatDate(jobTitle.createdAt, locale)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Employees with this job title */}
        <Card>
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
                      {emp.departmentName && (
                        <span className="text-sm text-neutral-500">
                          {getLocalizedText(emp.departmentName, locale)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                {employees.totalElements > 10 && (
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/${locale}/employees?jobTitleId=${id}`}>
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
