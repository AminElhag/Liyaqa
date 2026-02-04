"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Plus,
  Users,
  UserCheck,
  UserX,
  Shield,
  UserCog,
  Headset,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { getPlatformUserColumns } from "@liyaqa/shared/components/platform/platform-user-columns";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  usePlatformUsers,
  usePlatformUserStats,
  useChangePlatformUserStatus,
  useResetPlatformUserPassword,
} from "@liyaqa/shared/queries/platform/use-platform-users";
import type {
  PlatformUserSummary,
  PlatformUserStatus,
  PlatformUserRole,
} from "@liyaqa/shared/types/platform/platform-user";

type StatusFilter = "ALL" | PlatformUserStatus;
type RoleFilter = "ALL" | PlatformUserRole;

export default function PlatformUsersPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();

  // State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Permissions - only PLATFORM_ADMIN can edit
  const canEdit = currentUser?.role === "PLATFORM_ADMIN";

  // Query params
  const queryParams = {
    page,
    size: pageSize,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    role: roleFilter === "ALL" ? undefined : roleFilter,
    search: search || undefined,
    sortBy: "createdAt",
    sortDirection: "desc" as const,
  };

  // Data fetching
  const { data, isLoading, error } = usePlatformUsers(queryParams);
  const { data: stats } = usePlatformUserStats();
  const changeStatus = useChangePlatformUserStatus();
  const resetPassword = useResetPlatformUserPassword();

  // Bilingual texts
  const texts = {
    title: locale === "ar" ? "مستخدمو المنصة" : "Platform Users",
    description:
      locale === "ar"
        ? "إدارة مستخدمي فريق المنصة"
        : "Manage platform team users",
    newUser: locale === "ar" ? "مستخدم جديد" : "New User",
    total: locale === "ar" ? "الإجمالي" : "Total",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    suspended: locale === "ar" ? "موقوف" : "Suspended",
    platformAdmins: locale === "ar" ? "مديرو المنصة" : "Platform Admins",
    salesReps: locale === "ar" ? "مندوبو المبيعات" : "Sales Reps",
    supportReps: locale === "ar" ? "مندوبو الدعم" : "Support Reps",
    filterStatus: locale === "ar" ? "تصفية بالحالة" : "Filter by Status",
    filterRole: locale === "ar" ? "تصفية بالدور" : "Filter by Role",
    all: locale === "ar" ? "الكل" : "All",
    searchPlaceholder:
      locale === "ar" ? "بحث عن المستخدمين..." : "Search users...",
    noUsers: locale === "ar" ? "لا يوجد مستخدمون" : "No users found",
    loadingError:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    successTitle: locale === "ar" ? "تم" : "Success",
    activatedSuccess:
      locale === "ar" ? "تم تفعيل المستخدم" : "User activated successfully",
    suspendedSuccess:
      locale === "ar" ? "تم إيقاف المستخدم" : "User suspended successfully",
    resetPasswordConfirm:
      locale === "ar"
        ? "هل تريد إرسال بريد إعادة تعيين كلمة المرور لهذا المستخدم؟"
        : "Send password reset email to this user?",
    resetPasswordSuccess:
      locale === "ar"
        ? "تم إرسال بريد إعادة تعيين كلمة المرور"
        : "Password reset email sent",
    resettingPassword:
      locale === "ar" ? "جاري الإرسال..." : "Sending...",
    platformAdmin: locale === "ar" ? "مدير المنصة" : "Platform Admin",
    salesRep: locale === "ar" ? "مندوب مبيعات" : "Sales Rep",
    supportRep: locale === "ar" ? "مندوب دعم" : "Support Rep",
  };

  // Handlers
  const handleView = (user: PlatformUserSummary) => {
    router.push(`/${locale}/platform-users/${user.id}`);
  };

  const handleEdit = (user: PlatformUserSummary) => {
    router.push(`/${locale}/platform-users/${user.id}/edit`);
  };

  const handleActivate = (user: PlatformUserSummary) => {
    changeStatus.mutate(
      { id: user.id, data: { status: "ACTIVE" } },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.activatedSuccess,
          });
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSuspend = (user: PlatformUserSummary) => {
    changeStatus.mutate(
      { id: user.id, data: { status: "SUSPENDED" } },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.suspendedSuccess,
          });
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleResetPassword = (user: PlatformUserSummary) => {
    if (!window.confirm(texts.resetPasswordConfirm)) {
      return;
    }

    resetPassword.mutate(
      { id: user.id, data: { sendEmail: true } },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.resetPasswordSuccess,
          });
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  // Columns
  const columns = useMemo(
    () =>
      getPlatformUserColumns({
        locale,
        onView: handleView,
        onEdit: handleEdit,
        onActivate: handleActivate,
        onSuspend: handleSuspend,
        onResetPassword: handleResetPassword,
        canEdit,
      }),
    [locale, canEdit]
  );

  // Data
  const users = data?.content || [];
  const totalElements = data?.totalElements || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {texts.loadingError}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/${locale}/platform-users/new`}>
              <Plus className="me-2 h-4 w-4" />
              {texts.newUser}
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.total}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        {/* Active */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.active}</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.active || 0}
            </div>
          </CardContent>
        </Card>

        {/* Inactive */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.inactive}</CardTitle>
            <UserX className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-500">
              {stats?.inactive || 0}
            </div>
          </CardContent>
        </Card>

        {/* Platform Admins */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.platformAdmins}</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.byRole.PLATFORM_ADMIN || 0}
            </div>
          </CardContent>
        </Card>

        {/* Sales Reps */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.salesReps}</CardTitle>
            <UserCog className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.byRole.SALES_REP || 0}
            </div>
          </CardContent>
        </Card>

        {/* Support Reps */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.supportReps}</CardTitle>
            <Headset className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {stats?.byRole.SUPPORT_REP || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="w-full sm:w-64">
              <Input
                placeholder={texts.searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as StatusFilter);
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.filterStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="ACTIVE">{texts.active}</SelectItem>
                  <SelectItem value="INACTIVE">{texts.inactive}</SelectItem>
                  <SelectItem value="SUSPENDED">{texts.suspended}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value as RoleFilter);
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.filterRole} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="PLATFORM_ADMIN">{texts.platformAdmin}</SelectItem>
                  <SelectItem value="SALES_REP">{texts.salesRep}</SelectItem>
                  <SelectItem value="SUPPORT_REP">{texts.supportRep}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loading />
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {texts.noUsers}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              manualPagination
              pageCount={data?.totalPages || 1}
              pageIndex={page}
              pageSize={pageSize}
              totalRows={totalElements}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
