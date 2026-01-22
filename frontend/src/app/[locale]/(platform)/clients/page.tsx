"use client";

import { useState, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Building2, Users, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ErrorBoundary, ErrorFallback } from "@/components/ui/error-boundary";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { StatCardSkeleton } from "@/components/platform/shared/stat-card-skeleton";
import { TableSkeleton } from "@/components/platform/shared/table-skeleton";
import { getClientColumns } from "@/components/platform/client-columns";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  usePlatformClients,
  usePlatformClientStats,
  useActivateClient,
  useSuspendClient,
} from "@/queries/platform/use-platform-clients";
import { useAuthStore } from "@/stores/auth-store";
import type { Client } from "@/types/platform";
import type { OrganizationStatus } from "@/types/organization";

export default function ClientsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();

  // Check if user can edit (PLATFORM_ADMIN or SALES_REP)
  const canEdit = user?.role === "PLATFORM_ADMIN" || user?.role === "SALES_REP";

  // Filter state with debounced search
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch clients with debounced search
  const { data, isLoading, error, refetch } = usePlatformClients({
    search: debouncedSearch || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    size: pageSize,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = usePlatformClientStats();

  // Mutations
  const activateClient = useActivateClient();
  const suspendClient = useSuspendClient();

  // Track if any mutation is pending
  const isMutating = activateClient.isPending || suspendClient.isPending;

  const texts = {
    title: locale === "ar" ? "العملاء" : "Clients",
    description:
      locale === "ar"
        ? "إدارة عملاء منصة لياقة"
        : "Manage Liyaqa platform clients",
    addClient: locale === "ar" ? "عميل جديد" : "New Client",
    search: locale === "ar" ? "البحث بالاسم أو البريد..." : "Search by name or email...",
    status: locale === "ar" ? "الحالة" : "Status",
    all: locale === "ar" ? "الكل" : "All",
    pending: locale === "ar" ? "قيد الانتظار" : "Pending",
    active: locale === "ar" ? "نشط" : "Active",
    suspended: locale === "ar" ? "موقوف" : "Suspended",
    closed: locale === "ar" ? "مغلق" : "Closed",
    noClients: locale === "ar" ? "لا يوجد عملاء" : "No clients found",
    errorMsg: locale === "ar" ? "حدث خطأ أثناء تحميل العملاء" : "Error loading clients",
    totalClients: locale === "ar" ? "إجمالي العملاء" : "Total Clients",
    activeClients: locale === "ar" ? "عملاء نشطين" : "Active Clients",
    pendingClients: locale === "ar" ? "قيد الانتظار" : "Pending",
    suspendedClients: locale === "ar" ? "موقوفين" : "Suspended",
    activateConfirm:
      locale === "ar"
        ? "هل أنت متأكد من تفعيل هذا العميل؟"
        : "Are you sure you want to activate this client?",
    suspendConfirm:
      locale === "ar"
        ? "هل أنت متأكد من إيقاف هذا العميل؟"
        : "Are you sure you want to suspend this client?",
  };

  // Memoized handlers for stable references
  const handleView = useCallback(
    (client: Client) => {
      router.push(`/${locale}/clients/${client.id}`);
    },
    [router, locale]
  );

  const handleEdit = useCallback(
    (client: Client) => {
      router.push(`/${locale}/clients/${client.id}/edit`);
    },
    [router, locale]
  );

  const handleActivate = useCallback(
    (client: Client) => {
      if (confirm(texts.activateConfirm)) {
        activateClient.mutate(client.id);
      }
    },
    [activateClient, texts.activateConfirm]
  );

  const handleSuspend = useCallback(
    (client: Client) => {
      if (confirm(texts.suspendConfirm)) {
        suspendClient.mutate(client.id);
      }
    },
    [suspendClient, texts.suspendConfirm]
  );

  // Table columns with memoized handlers
  const columns = useMemo(
    () =>
      getClientColumns({
        locale,
        onView: handleView,
        onEdit: handleEdit,
        onActivate: handleActivate,
        onSuspend: handleSuspend,
        canEdit,
      }),
    [locale, canEdit, handleView, handleEdit, handleActivate, handleSuspend]
  );

  // Show skeleton loading on initial load
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{texts.title}</h1>
            <p className="text-muted-foreground">{texts.description}</p>
          </div>
          {canEdit && (
            <Button asChild>
              <Link href={`/${locale}/clients/new`}>
                <Plus className="me-2 h-4 w-4" />
                {texts.addClient}
              </Link>
            </Button>
          )}
        </div>
        <StatCardSkeleton count={4} columns={4} />
        <TableSkeleton rows={5} columns={5} showFilters />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <ErrorFallback
        error={error as Error}
        onRetry={() => refetch()}
        locale={locale}
      />
    );
  }

  return (
    <ErrorBoundary locale={locale} onReset={() => refetch()}>
      <div className="space-y-6 relative">
        {/* Loading overlay for mutations */}
        {isMutating && (
          <LoadingOverlay
            isLoading={true}
            message={locale === "ar" ? "جاري المعالجة..." : "Processing..."}
            locale={locale}
            variant="fullscreen"
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{texts.title}</h1>
            <p className="text-muted-foreground">{texts.description}</p>
          </div>
          {canEdit && (
            <Button asChild>
              <Link href={`/${locale}/clients/new`}>
                <Plus className="me-2 h-4 w-4" />
                {texts.addClient}
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <StatCardSkeleton count={4} columns={4} />
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{texts.totalClients}</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === "ar" ? "جميع العملاء" : "All clients"}
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-green-200 dark:border-green-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{texts.activeClients}</CardTitle>
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display text-green-600 dark:text-green-400">
                  {stats.active}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total > 0
                    ? `${Math.round((stats.active / stats.total) * 100)}%`
                    : "0%"}
                  {locale === "ar" ? " من الإجمالي" : " of total"}
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-amber-200 dark:border-amber-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{texts.pendingClients}</CardTitle>
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400">
                  {stats.pending}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === "ar" ? "بانتظار التفعيل" : "Awaiting activation"}
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-red-200 dark:border-red-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{texts.suspendedClients}</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display text-red-600 dark:text-red-400">
                  {stats.suspended}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === "ar" ? "حسابات موقوفة" : "Suspended accounts"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={texts.search}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="ps-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as OrganizationStatus | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="PENDING">{texts.pending}</SelectItem>
                <SelectItem value="ACTIVE">{texts.active}</SelectItem>
                <SelectItem value="SUSPENDED">{texts.suspended}</SelectItem>
                <SelectItem value="CLOSED">{texts.closed}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="relative">
        {/* Subtle loading indicator for data refresh */}
        {isLoading && data && (
          <div className="absolute top-4 right-4 z-10">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={data?.content || []}
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
        </CardContent>
      </Card>
    </div>
    </ErrorBoundary>
  );
}
