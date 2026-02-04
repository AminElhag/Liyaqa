"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Plus,
  CreditCard,
  CheckCircle,
  Clock,
  PauseCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
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
import { getSubscriptionColumns } from "@/components/platform/subscription-columns";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useClientSubscriptions,
  useSubscriptionStats,
  useActivateClientSubscription,
  useSuspendClientSubscription,
  useCancelClientSubscription,
} from "@liyaqa/shared/queries/platform/use-client-subscriptions";
import type {
  ClientSubscriptionSummary,
  ClientSubscriptionStatus,
} from "@liyaqa/shared/types/platform/client-subscription";

type StatusFilter = "ALL" | ClientSubscriptionStatus;

export default function ClientSubscriptionsPage() {
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
    status: statusFilter === "ALL" ? undefined : statusFilter,
    sortBy: "startDate",
    sortDirection: "desc" as const,
  };

  // Data fetching
  const { data, isLoading, error } = useClientSubscriptions(queryParams);
  const { data: stats } = useSubscriptionStats();

  // Mutations
  const activateSubscription = useActivateClientSubscription();
  const suspendSubscription = useSuspendClientSubscription();
  const cancelSubscription = useCancelClientSubscription();

  // Bilingual texts
  const texts = {
    title: locale === "ar" ? "اشتراكات العملاء" : "Client Subscriptions",
    description:
      locale === "ar"
        ? "إدارة اشتراكات العملاء في المنصة"
        : "Manage client subscriptions to the platform",
    newSubscription: locale === "ar" ? "اشتراك جديد" : "New Subscription",
    total: locale === "ar" ? "الإجمالي" : "Total",
    active: locale === "ar" ? "نشط" : "Active",
    trial: locale === "ar" ? "تجريبي" : "Trial",
    suspended: locale === "ar" ? "موقوف" : "Suspended",
    cancelled: locale === "ar" ? "ملغي" : "Cancelled",
    expired: locale === "ar" ? "منتهي" : "Expired",
    filterStatus: locale === "ar" ? "تصفية بالحالة" : "Filter by Status",
    all: locale === "ar" ? "الكل" : "All",
    noSubscriptions:
      locale === "ar" ? "لا توجد اشتراكات" : "No subscriptions found",
    loadingError:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    activateSuccess:
      locale === "ar" ? "تم تفعيل الاشتراك" : "Subscription activated",
    suspendSuccess:
      locale === "ar" ? "تم تعليق الاشتراك" : "Subscription suspended",
    cancelSuccess:
      locale === "ar" ? "تم إلغاء الاشتراك" : "Subscription cancelled",
    cancelConfirm:
      locale === "ar"
        ? "هل أنت متأكد من إلغاء هذا الاشتراك؟"
        : "Are you sure you want to cancel this subscription?",
    suspendConfirm:
      locale === "ar"
        ? "هل أنت متأكد من تعليق هذا الاشتراك؟"
        : "Are you sure you want to suspend this subscription?",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    renewNotImplemented:
      locale === "ar"
        ? "سيتم تنفيذ التجديد قريباً"
        : "Renewal will be implemented soon",
    changePlanNotImplemented:
      locale === "ar"
        ? "سيتم تنفيذ تغيير الخطة قريباً"
        : "Plan change will be implemented soon",
  };

  // Handlers
  const handleView = (subscription: ClientSubscriptionSummary) => {
    router.push(`/${locale}/client-subscriptions/${subscription.id}`);
  };

  const handleEdit = (subscription: ClientSubscriptionSummary) => {
    router.push(`/${locale}/client-subscriptions/${subscription.id}/edit`);
  };

  const handleActivate = (subscription: ClientSubscriptionSummary) => {
    activateSubscription.mutate(subscription.id, {
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

  const handleSuspend = (subscription: ClientSubscriptionSummary) => {
    if (!confirm(texts.suspendConfirm)) return;

    suspendSubscription.mutate(subscription.id, {
      onSuccess: () => {
        toast({ title: texts.suspendSuccess });
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

  const handleCancel = (subscription: ClientSubscriptionSummary) => {
    if (!confirm(texts.cancelConfirm)) return;

    cancelSubscription.mutate(subscription.id, {
      onSuccess: () => {
        toast({ title: texts.cancelSuccess });
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

  const handleRenew = (subscription: ClientSubscriptionSummary) => {
    // Navigate to detail page where renew dialog will be available
    router.push(`/${locale}/client-subscriptions/${subscription.id}`);
  };

  const handleChangePlan = (subscription: ClientSubscriptionSummary) => {
    // Navigate to detail page where change plan dialog will be available
    router.push(`/${locale}/client-subscriptions/${subscription.id}`);
  };

  // Columns
  const columns = useMemo(
    () =>
      getSubscriptionColumns({
        locale,
        onView: handleView,
        onEdit: handleEdit,
        onActivate: handleActivate,
        onSuspend: handleSuspend,
        onCancel: handleCancel,
        onRenew: handleRenew,
        onChangePlan: handleChangePlan,
        canEdit,
      }),
    [locale, canEdit]
  );

  // Data
  const subscriptions = data?.content || [];
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
            <Link href={`/${locale}/client-subscriptions/new`}>
              <Plus className="me-2 h-4 w-4" />
              {texts.newSubscription}
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.total}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.active}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.active || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.trial}</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.trial || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.suspended}</CardTitle>
            <PauseCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.suspended || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.cancelled}</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.cancelled || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.expired}</CardTitle>
            <AlertCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-500">
              {stats?.expired || 0}
            </div>
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
                  <SelectItem value="TRIAL">{texts.trial}</SelectItem>
                  <SelectItem value="ACTIVE">{texts.active}</SelectItem>
                  <SelectItem value="SUSPENDED">{texts.suspended}</SelectItem>
                  <SelectItem value="CANCELLED">{texts.cancelled}</SelectItem>
                  <SelectItem value="EXPIRED">{texts.expired}</SelectItem>
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
          ) : subscriptions.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {texts.noSubscriptions}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={subscriptions}
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
