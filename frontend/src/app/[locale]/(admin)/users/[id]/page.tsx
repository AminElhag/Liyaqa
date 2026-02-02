"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Users,
  ChevronLeft,
  Pencil,
  Mail,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Calendar,
  Building,
  Key,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/queries/use-users";
import { formatDate, getLocalizedText } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

const ROLE_CONFIG: Record<UserRole, { icon: typeof Shield; color: string }> = {
  // Platform roles
  PLATFORM_ADMIN: { icon: ShieldCheck, color: "text-danger" },
  SALES_REP: { icon: UserIcon, color: "text-success" },
  MARKETING: { icon: UserIcon, color: "text-info" },
  SUPPORT: { icon: UserIcon, color: "text-warning" },
  // Client roles
  SUPER_ADMIN: { icon: ShieldCheck, color: "text-danger" },
  CLUB_ADMIN: { icon: Shield, color: "text-primary" },
  STAFF: { icon: UserIcon, color: "text-warning" },
  MEMBER: { icon: Users, color: "text-neutral-500" },
  TRAINER: { icon: UserIcon, color: "text-teal-600" },
};

const ROLE_LABELS: Record<UserRole, { en: string; ar: string }> = {
  // Platform roles
  PLATFORM_ADMIN: { en: "Platform Admin", ar: "مدير المنصة" },
  SALES_REP: { en: "Sales Rep", ar: "مندوب المبيعات" },
  MARKETING: { en: "Marketing", ar: "التسويق" },
  SUPPORT: { en: "Support", ar: "الدعم" },
  // Client roles
  SUPER_ADMIN: { en: "Super Admin", ar: "مدير النظام" },
  CLUB_ADMIN: { en: "Club Admin", ar: "مدير النادي" },
  TRAINER: { en: "Trainer", ar: "مدرب" },
  STAFF: { en: "Staff", ar: "موظف" },
  MEMBER: { en: "Member", ar: "عضو" },
};

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = use(params);
  const locale = useLocale();

  const { data: user, isLoading, error } = useUser(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/users`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمستخدمين" : "Back to users"}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>
              {locale === "ar"
                ? "لم يتم العثور على المستخدم"
                : "User not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const RoleIcon = ROLE_CONFIG[user.role].icon;
  const roleColor = ROLE_CONFIG[user.role].color;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/users`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمستخدمين" : "Back to users"}
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-neutral-100 ${roleColor}`}>
              <RoleIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {getLocalizedText(user.displayName, locale)}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.status === "ACTIVE" ? "success" : "secondary"}>
                  {user.status === "ACTIVE"
                    ? locale === "ar"
                      ? "نشط"
                      : "Active"
                    : locale === "ar"
                      ? "غير نشط"
                      : "Inactive"}
                </Badge>
                <Badge variant="outline">
                  {locale === "ar"
                    ? ROLE_LABELS[user.role].ar
                    : ROLE_LABELS[user.role].en}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/${locale}/users/${id}/reset-password`}>
                <Key className="h-4 w-4 me-2" />
                {locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}/users/${id}/edit`}>
                <Pencil className="h-4 w-4 me-2" />
                {locale === "ar" ? "تعديل" : "Edit"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* User Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "المعلومات الأساسية" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-sm text-neutral-500">
                  {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                </p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-sm text-neutral-500">
                  {locale === "ar" ? "الدور" : "Role"}
                </p>
                <p className="font-medium">
                  {locale === "ar"
                    ? ROLE_LABELS[user.role].ar
                    : ROLE_LABELS[user.role].en}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-sm text-neutral-500">
                  {locale === "ar" ? "تاريخ الإنشاء" : "Created At"}
                </p>
                <p className="font-medium">{formatDate(user.createdAt, locale)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-sm text-neutral-500">
                  {locale === "ar" ? "آخر تحديث" : "Last Updated"}
                </p>
                <p className="font-medium">{formatDate(user.updatedAt, locale)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      {(user.tenantId || user.organizationId || user.memberId) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "ar" ? "الارتباطات" : "Associations"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {user.organizationId && (
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-500">
                      {locale === "ar" ? "المنظمة" : "Organization"}
                    </p>
                    <p className="font-mono text-xs">{user.organizationId}</p>
                  </div>
                </div>
              )}
              {user.tenantId && (
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-500">
                      {locale === "ar" ? "النادي" : "Club (Tenant)"}
                    </p>
                    <p className="font-mono text-xs">{user.tenantId}</p>
                  </div>
                </div>
              )}
              {user.memberId && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-500">
                      {locale === "ar" ? "العضو" : "Member"}
                    </p>
                    <Link
                      href={`/${locale}/members/${user.memberId}`}
                      className="text-primary hover:underline font-mono text-xs"
                    >
                      {user.memberId}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "معلومات النظام" : "System Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">
              {locale === "ar" ? "معرف المستخدم" : "User ID"}
            </span>
            <span className="font-mono text-xs">{user.id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
