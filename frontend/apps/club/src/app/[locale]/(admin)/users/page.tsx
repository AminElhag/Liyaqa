"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Users,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Key,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Input } from "@liyaqa/shared/components/ui/input";
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
  useUsers,
  useActivateUser,
  useDeactivateUser,
} from "@liyaqa/shared/queries/use-users";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { formatDate, getLocalizedText } from "@liyaqa/shared/utils";
import type { UserRole } from "@liyaqa/shared/types/auth";

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
  TRAINER: { en: "Trainer", ar: "مدرب" },
  SUPPORT: { en: "Support", ar: "الدعم" },
  // Client roles
  SUPER_ADMIN: { en: "Super Admin", ar: "مدير النظام" },
  CLUB_ADMIN: { en: "Club Admin", ar: "مدير النادي" },
  STAFF: { en: "Staff", ar: "موظف" },
  MEMBER: { en: "Member", ar: "عضو" },
};

export default function UsersPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );

  const { data, isLoading, error } = useUsers({
    page,
    size: 20,
    search: search || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    active: activeFilter === "all" ? undefined : activeFilter === "active",
  });

  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();

  const handleActivate = async (id: string) => {
    try {
      await activateUser.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التفعيل" : "Activated",
        description:
          locale === "ar" ? "تم تفعيل المستخدم بنجاح" : "User activated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في تفعيل المستخدم"
            : "Failed to activate user",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateUser.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الإيقاف" : "Deactivated",
        description:
          locale === "ar" ? "تم إيقاف المستخدم بنجاح" : "User deactivated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في إيقاف المستخدم"
            : "Failed to deactivate user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "المستخدمين" : "Users"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar"
              ? "إدارة المستخدمين والصلاحيات"
              : "Manage users and permissions"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/users/new`}>
            <Plus className="h-4 w-4 me-2" />
            {locale === "ar" ? "إضافة مستخدم" : "Add User"}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={locale === "ar" ? "بحث..." : "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as "all" | UserRole)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={locale === "ar" ? "الدور" : "Role"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {locale === "ar" ? "جميع الأدوار" : "All Roles"}
                </SelectItem>
                {Object.entries(ROLE_LABELS).map(([role, labels]) => (
                  <SelectItem key={role} value={role}>
                    {locale === "ar" ? labels.ar : labels.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={activeFilter}
              onValueChange={(value) =>
                setActiveFilter(value as "all" | "active" | "inactive")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={locale === "ar" ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {locale === "ar" ? "جميع الحالات" : "All Statuses"}
                </SelectItem>
                <SelectItem value="active">
                  {locale === "ar" ? "نشط" : "Active"}
                </SelectItem>
                <SelectItem value="inactive">
                  {locale === "ar" ? "غير نشط" : "Inactive"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            {locale === "ar"
              ? "فشل في تحميل المستخدمين"
              : "Failed to load users"}
          </CardContent>
        </Card>
      )}

      {/* Users list */}
      {!isLoading && !error && (
        <>
          {data?.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-neutral-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                <p>
                  {locale === "ar" ? "لا يوجد مستخدمين" : "No users found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.content.map((user) => {
                const RoleIcon = ROLE_CONFIG[user.role].icon;
                const roleColor = ROLE_CONFIG[user.role].color;
                return (
                  <Card
                    key={user.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-neutral-100 ${roleColor}`}>
                            <RoleIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {getLocalizedText(user.displayName, locale)}
                            </CardTitle>
                            <CardDescription>{user.email}</CardDescription>
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
                              <Link href={`/${locale}/users/${user.id}`}>
                                <Eye className="h-4 w-4 me-2" />
                                {locale === "ar" ? "عرض" : "View"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/${locale}/users/${user.id}/edit`}>
                                <Pencil className="h-4 w-4 me-2" />
                                {locale === "ar" ? "تعديل" : "Edit"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/${locale}/users/${user.id}/reset-password`}>
                                <Key className="h-4 w-4 me-2" />
                                {locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === "ACTIVE" ? (
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(user.id)}
                                className="text-warning"
                              >
                                <PowerOff className="h-4 w-4 me-2" />
                                {locale === "ar" ? "إيقاف" : "Deactivate"}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleActivate(user.id)}
                              >
                                <Power className="h-4 w-4 me-2" />
                                {locale === "ar" ? "تفعيل" : "Activate"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
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
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-neutral-500">
                        {locale === "ar" ? "أُنشئ:" : "Created:"}{" "}
                        {formatDate(user.createdAt, locale)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
