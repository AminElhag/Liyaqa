"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Plus, Package, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { getPlanColumns } from "@/components/platform/plan-columns";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useClientPlans,
  useActivateClientPlan,
  useDeactivateClientPlan,
  useDeleteClientPlan,
} from "@liyaqa/shared/queries/platform/use-client-plans";
import type { ClientPlan } from "@liyaqa/shared/types/platform/client-plan";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function ClientPlansPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Permissions
  const canEdit = user?.role === "PLATFORM_ADMIN";

  // Query params
  const queryParams = {
    page,
    size: pageSize,
    isActive: statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE",
    sortBy: "sortOrder",
    sortDirection: "asc" as const,
  };

  // Data fetching
  const { data, isLoading, error } = useClientPlans(queryParams);

  // Mutations
  const activatePlan = useActivateClientPlan();
  const deactivatePlan = useDeactivateClientPlan();
  const deletePlan = useDeleteClientPlan();

  // Bilingual texts
  const texts = {
    title: locale === "ar" ? "خطط العملاء" : "Client Plans",
    description:
      locale === "ar"
        ? "إدارة خطط الاشتراك المتاحة للعملاء"
        : "Manage subscription plans available to clients",
    newPlan: locale === "ar" ? "خطة جديدة" : "New Plan",
    totalPlans: locale === "ar" ? "إجمالي الخطط" : "Total Plans",
    activePlans: locale === "ar" ? "الخطط النشطة" : "Active Plans",
    inactivePlans: locale === "ar" ? "الخطط غير النشطة" : "Inactive Plans",
    avgMonthlyPrice: locale === "ar" ? "متوسط السعر الشهري" : "Avg Monthly Price",
    filterStatus: locale === "ar" ? "تصفية بالحالة" : "Filter by Status",
    all: locale === "ar" ? "الكل" : "All",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    noPlans: locale === "ar" ? "لا توجد خطط" : "No plans found",
    loadingError:
      locale === "ar"
        ? "حدث خطأ في تحميل البيانات"
        : "Error loading data",
    activateSuccess: locale === "ar" ? "تم تفعيل الخطة" : "Plan activated",
    deactivateSuccess:
      locale === "ar" ? "تم إلغاء تفعيل الخطة" : "Plan deactivated",
    deleteSuccess: locale === "ar" ? "تم حذف الخطة" : "Plan deleted",
    deleteConfirm:
      locale === "ar"
        ? "هل أنت متأكد من حذف هذه الخطة؟"
        : "Are you sure you want to delete this plan?",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };

  // Handlers
  const handleView = (plan: ClientPlan) => {
    router.push(`/${locale}/client-plans/${plan.id}`);
  };

  const handleEdit = (plan: ClientPlan) => {
    router.push(`/${locale}/client-plans/${plan.id}/edit`);
  };

  const handleActivate = (plan: ClientPlan) => {
    activatePlan.mutate(plan.id, {
      onSuccess: () => {
        toast({ title: texts.activateSuccess });
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleDeactivate = (plan: ClientPlan) => {
    deactivatePlan.mutate(plan.id, {
      onSuccess: () => {
        toast({ title: texts.deactivateSuccess });
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleDelete = (plan: ClientPlan) => {
    if (!confirm(texts.deleteConfirm)) return;

    deletePlan.mutate(plan.id, {
      onSuccess: () => {
        toast({ title: texts.deleteSuccess });
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Columns
  const columns = useMemo(
    () =>
      getPlanColumns({
        locale,
        onView: handleView,
        onEdit: handleEdit,
        onActivate: handleActivate,
        onDeactivate: handleDeactivate,
        onDelete: handleDelete,
        canEdit,
      }),
    [locale, canEdit]
  );

  // Stats calculations
  const plans = data?.content || [];
  const totalPlans = data?.totalElements || 0;
  const activePlans = plans.filter((p) => p.isActive).length;
  const inactivePlans = plans.filter((p) => !p.isActive).length;
  const avgMonthlyPrice =
    plans.length > 0
      ? plans.reduce((sum, p) => sum + p.monthlyPrice.amount, 0) / plans.length
      : 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

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
            <Link href={`/${locale}/client-plans/new`}>
              <Plus className="me-2 h-4 w-4" />
              {texts.newPlan}
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.totalPlans}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.activePlans}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePlans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.inactivePlans}</CardTitle>
            <XCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-500">{inactivePlans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.avgMonthlyPrice}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgMonthlyPrice)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
          ) : plans.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {texts.noPlans}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={plans}
              manualPagination
              pageCount={data?.totalPages || 1}
              pageIndex={page}
              pageSize={pageSize}
              totalRows={data?.totalElements}
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
