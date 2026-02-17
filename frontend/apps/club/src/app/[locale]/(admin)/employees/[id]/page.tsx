"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Briefcase,
  AlertTriangle,
  ShieldCheck,
  User,
  Key,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { useEmployee } from "@liyaqa/shared/queries/use-employees";
import { PermissionManager } from "@/components/permissions";
import { EmployeeResetPasswordDialog } from "@/components/admin/employee-reset-password-dialog";
import { formatDate, getLocalizedText } from "@liyaqa/shared/utils";
import type { EmployeeStatus, EmploymentType } from "@liyaqa/shared/types/employee";

export default function EmployeeDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const id = params.id as string;

  const { data: employee, isLoading, error } = useEmployee(id);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const getStatusBadge = (status: EmployeeStatus) => {
    const statusConfig: Record<
      EmployeeStatus,
      { variant: "success" | "warning" | "destructive" | "secondary" | "default"; labelEn: string; labelAr: string }
    > = {
      ACTIVE: { variant: "success", labelEn: "Active", labelAr: "نشط" },
      INACTIVE: { variant: "secondary", labelEn: "Inactive", labelAr: "غير نشط" },
      ON_LEAVE: { variant: "warning", labelEn: "On Leave", labelAr: "في إجازة" },
      PROBATION: { variant: "default", labelEn: "Probation", labelAr: "فترة تجربة" },
      TERMINATED: { variant: "destructive", labelEn: "Terminated", labelAr: "منتهي الخدمة" },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant}>
        {locale === "ar" ? config.labelAr : config.labelEn}
      </Badge>
    );
  };

  const getEmploymentTypeBadge = (type: EmploymentType) => {
    const types: Record<EmploymentType, { labelEn: string; labelAr: string }> = {
      FULL_TIME: { labelEn: "Full Time", labelAr: "دوام كامل" },
      PART_TIME: { labelEn: "Part Time", labelAr: "دوام جزئي" },
      CONTRACT: { labelEn: "Contract", labelAr: "عقد" },
      INTERN: { labelEn: "Intern", labelAr: "متدرب" },
      SEASONAL: { labelEn: "Seasonal", labelAr: "موسمي" },
    };

    const config = types[type];
    return (
      <Badge variant="outline">
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
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/employees`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {locale === "ar" ? "خطأ" : "Error"}
            </h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            {locale === "ar" ? "فشل في تحميل بيانات الموظف" : "Failed to load employee data"}
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
            <Link href={`/${locale}/employees`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {getLocalizedText(employee.fullName, locale)}
            </h1>
            <div className="flex gap-2 mt-1">
              {getStatusBadge(employee.status)}
              {getEmploymentTypeBadge(employee.employmentType)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {employee.userId && (
            <Button
              variant="outline"
              onClick={() => setResetPasswordOpen(true)}
            >
              <Key className="h-4 w-4 me-2" />
              {locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
            </Button>
          )}
          <Button asChild>
            <Link href={`/${locale}/employees/${id}/edit`}>
              <Pencil className="h-4 w-4 me-2" />
              {locale === "ar" ? "تعديل" : "Edit"}
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            {locale === "ar" ? "الملف الشخصي" : "Profile"}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            {locale === "ar" ? "الصلاحيات" : "Permissions"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {locale === "ar" ? "معلومات الاتصال" : "Contact Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-neutral-500" />
                    <span>{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-neutral-500" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.address?.formatted && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-neutral-500 mt-1" />
                    <span>{employee.address.formatted}</span>
                  </div>
                )}
                {employee.dateOfBirth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-neutral-500" />
                    <span>
                      {locale === "ar" ? "تاريخ الميلاد:" : "DOB:"}{" "}
                      {formatDate(employee.dateOfBirth, locale)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {locale === "ar" ? "تفاصيل التوظيف" : "Employment Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.departmentName && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-neutral-500" />
                    <span>{getLocalizedText(employee.departmentName, locale)}</span>
                  </div>
                )}
                {employee.jobTitleName && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-neutral-500" />
                    <span>{getLocalizedText(employee.jobTitleName, locale)}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-neutral-500" />
                  <span>
                    {locale === "ar" ? "تاريخ التعيين:" : "Hire Date:"}{" "}
                    {formatDate(employee.hireDate, locale)}
                  </span>
                </div>
                <div className="text-sm text-neutral-500">
                  {locale === "ar" ? "سنوات الخدمة:" : "Years of Service:"}{" "}
                  {employee.yearsOfService}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {employee.emergencyContact && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {locale === "ar" ? "جهة اتصال الطوارئ" : "Emergency Contact"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {employee.emergencyContact.name && (
                    <p><strong>{locale === "ar" ? "الاسم:" : "Name:"}</strong> {employee.emergencyContact.name}</p>
                  )}
                  {employee.emergencyContact.phone && (
                    <p><strong>{locale === "ar" ? "الهاتف:" : "Phone:"}</strong> {employee.emergencyContact.phone}</p>
                  )}
                  {employee.emergencyContact.relationship && (
                    <p><strong>{locale === "ar" ? "صلة القرابة:" : "Relationship:"}</strong> {employee.emergencyContact.relationship}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {employee.certifications && employee.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {locale === "ar" ? "الشهادات" : "Certifications"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employee.certifications.map((cert, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{cert.name}</span>
                          {cert.isExpired && (
                            <Badge variant="destructive">
                              {locale === "ar" ? "منتهية" : "Expired"}
                            </Badge>
                          )}
                          {cert.isExpiring && !cert.isExpired && (
                            <Badge variant="warning">
                              <AlertTriangle className="h-3 w-3 me-1" />
                              {locale === "ar" ? "تنتهي قريباً" : "Expiring Soon"}
                            </Badge>
                          )}
                        </div>
                        {cert.issuedBy && (
                          <p className="text-sm text-neutral-500">
                            {locale === "ar" ? "صادر من:" : "Issued by:"} {cert.issuedBy}
                          </p>
                        )}
                        {cert.expiresAt && (
                          <p className="text-sm text-neutral-500">
                            {locale === "ar" ? "تنتهي في:" : "Expires:"} {formatDate(cert.expiresAt, locale)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assigned Locations */}
            {employee.assignedLocations && employee.assignedLocations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {locale === "ar" ? "المواقع المعينة" : "Assigned Locations"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {employee.assignedLocations.map((loc) => (
                      <div key={loc.id} className="flex items-center justify-between p-2 border rounded">
                        <span>
                          {loc.locationName ? getLocalizedText(loc.locationName, locale) : loc.locationId}
                        </span>
                        {loc.isPrimary && (
                          <Badge variant="success">
                            {locale === "ar" ? "رئيسي" : "Primary"}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {employee.notes && (employee.notes.en || employee.notes.ar) && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {locale === "ar" ? "ملاحظات" : "Notes"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{getLocalizedText(employee.notes, locale)}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionManager
            userId={employee.userId}
            userName={getLocalizedText(employee.fullName, locale)}
          />
        </TabsContent>
      </Tabs>

      {employee.userId && (
        <EmployeeResetPasswordDialog
          open={resetPasswordOpen}
          onOpenChange={setResetPasswordOpen}
          userId={employee.userId}
          employeeName={getLocalizedText(employee.fullName, locale)}
          employeeEmail={employee.email}
        />
      )}
    </div>
  );
}
