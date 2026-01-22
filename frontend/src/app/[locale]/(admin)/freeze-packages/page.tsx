"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Snowflake,
  Plus,
  Package,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import {
  useFreezePackages,
  useActivateFreezePackage,
  useDeactivateFreezePackage,
} from "@/queries/use-freeze-packages";
import { getFreezePackageColumns } from "@/components/admin/freeze-package-columns";
import { useToast } from "@/hooks/use-toast";
import type { FreezePackage } from "@/types/freeze";

export default function FreezePackagesPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const { data, isLoading, error, refetch } = useFreezePackages({
    page,
    size: 20,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
  });

  const activatePackage = useActivateFreezePackage();
  const deactivatePackage = useDeactivateFreezePackage();

  const texts = {
    title: locale === "ar" ? "باقات التجميد" : "Freeze Packages",
    subtitle: locale === "ar" ? "إدارة باقات تجميد الاشتراكات" : "Manage subscription freeze packages",
    addPackage: locale === "ar" ? "إضافة باقة" : "Add Package",
    status: locale === "ar" ? "الحالة" : "Status",
    allStatuses: locale === "ar" ? "جميع الحالات" : "All Statuses",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    noPackages: locale === "ar" ? "لا توجد باقات تجميد" : "No freeze packages found",
    loadError: locale === "ar" ? "فشل في تحميل الباقات" : "Failed to load packages",
    totalPackages: locale === "ar" ? "إجمالي الباقات" : "Total Packages",
    activePackages: locale === "ar" ? "باقات نشطة" : "Active Packages",
    inactivePackages: locale === "ar" ? "باقات غير نشطة" : "Inactive Packages",
    activated: locale === "ar" ? "تم التفعيل" : "Activated",
    activatedDesc: locale === "ar" ? "تم تفعيل الباقة بنجاح" : "Package activated successfully",
    deactivated: locale === "ar" ? "تم الإيقاف" : "Deactivated",
    deactivatedDesc: locale === "ar" ? "تم إيقاف الباقة بنجاح" : "Package deactivated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    activateError: locale === "ar" ? "فشل في تفعيل الباقة" : "Failed to activate package",
    deactivateError: locale === "ar" ? "فشل في إيقاف الباقة" : "Failed to deactivate package",
  };

  const handleView = (pkg: FreezePackage) => {
    router.push(`/${locale}/freeze-packages/${pkg.id}`);
  };

  const handleEdit = (pkg: FreezePackage) => {
    router.push(`/${locale}/freeze-packages/${pkg.id}/edit`);
  };

  const handleActivate = async (pkg: FreezePackage) => {
    try {
      await activatePackage.mutateAsync(pkg.id);
      toast({
        title: texts.activated,
        description: texts.activatedDesc,
      });
      refetch();
    } catch {
      toast({
        title: texts.errorTitle,
        description: texts.activateError,
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (pkg: FreezePackage) => {
    try {
      await deactivatePackage.mutateAsync(pkg.id);
      toast({
        title: texts.deactivated,
        description: texts.deactivatedDesc,
      });
      refetch();
    } catch {
      toast({
        title: texts.errorTitle,
        description: texts.deactivateError,
        variant: "destructive",
      });
    }
  };

  const columns = useMemo(
    () =>
      getFreezePackageColumns({
        locale,
        onView: handleView,
        onEdit: handleEdit,
        onActivate: handleActivate,
        onDeactivate: handleDeactivate,
      }),
    [locale]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const packages = data?.content ?? [];
    return {
      total: data?.totalElements ?? 0,
      active: packages.filter((p) => p.isActive).length,
      inactive: packages.filter((p) => !p.isActive).length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Snowflake className="h-6 w-6 text-blue-500" />
            {texts.title}
          </h1>
          <p className="text-neutral-500">{texts.subtitle}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/freeze-packages/new`}>
            <Plus className="h-4 w-4 me-2" />
            {texts.addPackage}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              {texts.totalPackages}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{stats.total}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {texts.activePackages}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-slate-400" />
              {texts.inactivePackages}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold text-slate-500">{stats.inactive}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | "active" | "inactive")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{texts.allStatuses}</SelectItem>
                <SelectItem value="active">{texts.active}</SelectItem>
                <SelectItem value="inactive">{texts.inactive}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">
              {texts.loadError}
            </div>
          ) : !data?.content?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <Snowflake className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p>{texts.noPackages}</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data.content}
              manualPagination
              pageCount={data.totalPages}
              pageIndex={page}
              pageSize={20}
              totalRows={data.totalElements}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
