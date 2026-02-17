"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Building2,
  Users,
  Pause,
  Archive,
  MoreHorizontal,
  Eye,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Badge } from "@liyaqa/shared/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useTenants } from "@liyaqa/shared/queries/platform/use-tenants";
import { formatDate } from "@liyaqa/shared/utils";
import {
  TENANT_STATUS_CONFIG,
  type TenantStatus,
} from "@liyaqa/shared/types/platform/tenant";

type StatusFilter = "ALL" | TenantStatus;

export default function TenantsPage() {
  const locale = useLocale();
  const router = useRouter();

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

  // Fetch tenants
  const { data, isLoading, error, refetch } = useTenants({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    size: pageSize,
  });

  const tenants = data?.content || [];
  const totalPages = data?.totalPages || 1;

  // Compute stats from data
  const totalTenants = data?.totalElements || 0;
  const activeTenants = tenants.filter((t) => t.status === "ACTIVE").length;
  const suspendedTenants = tenants.filter((t) => t.status === "SUSPENDED").length;
  const archivedTenants = tenants.filter((t) => t.status === "ARCHIVED").length;

  const texts = {
    title: locale === "ar" ? "المستأجرون" : "Tenants",
    description:
      locale === "ar"
        ? "إدارة مستأجري المنصة ودورة حياتهم"
        : "Manage platform tenants and their lifecycle",
    addTenant: locale === "ar" ? "إضافة مستأجر" : "Add Tenant",
    search: locale === "ar" ? "البحث بالاسم..." : "Search by name...",
    status: locale === "ar" ? "الحالة" : "Status",
    all: locale === "ar" ? "الكل" : "All",
    totalTenants: locale === "ar" ? "إجمالي المستأجرين" : "Total Tenants",
    activeTenants: locale === "ar" ? "نشطون" : "Active",
    suspendedTenants: locale === "ar" ? "معلقون" : "Suspended",
    archivedTenants: locale === "ar" ? "مؤرشفون" : "Archived",
    name: locale === "ar" ? "الاسم" : "Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    noTenants: locale === "ar" ? "لا يوجد مستأجرون" : "No tenants found",
    noTenantsDesc:
      locale === "ar"
        ? "لم يتم العثور على مستأجرين مطابقين للمعايير المحددة"
        : "No tenants match the selected criteria",
    errorMsg:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل المستأجرين"
        : "Error loading tenants",
    retry: locale === "ar" ? "إعادة المحاولة" : "Retry",
    previous: locale === "ar" ? "السابق" : "Previous",
    next: locale === "ar" ? "التالي" : "Next",
    pageOf: locale === "ar" ? "من" : "of",
    allTenants: locale === "ar" ? "جميع المستأجرين" : "All tenants",
    activeAccounts: locale === "ar" ? "حسابات نشطة" : "Active accounts",
    suspendedAccounts: locale === "ar" ? "حسابات معلقة" : "Suspended accounts",
    archivedAccounts: locale === "ar" ? "حسابات مؤرشفة" : "Archived accounts",
  };

  const statusOptions: TenantStatus[] = [
    "PROVISIONING",
    "ACTIVE",
    "SUSPENDED",
    "DEACTIVATED",
    "ARCHIVED",
  ];

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{texts.title}</h1>
            <p className="text-muted-foreground">{texts.description}</p>
          </div>
          <Button asChild>
            <Link href={`/${locale}/tenants/new`}>
              <Plus className="me-2 h-4 w-4" />
              {texts.addTenant}
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loading />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{texts.title}</h1>
            <p className="text-muted-foreground">{texts.description}</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive mb-4">{texts.errorMsg}</p>
            <Button variant="outline" onClick={() => refetch()}>
              {texts.retry}
            </Button>
          </CardContent>
        </Card>
      </div>
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
        <Button asChild>
          <Link href={`/${locale}/tenants/new`}>
            <Plus className="me-2 h-4 w-4" />
            {texts.addTenant}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.totalTenants}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{totalTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">{texts.allTenants}</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-green-200 dark:border-green-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.activeTenants}</CardTitle>
            <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-green-600 dark:text-green-400">
              {activeTenants}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{texts.activeAccounts}</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-yellow-200 dark:border-yellow-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.suspendedTenants}</CardTitle>
            <Pause className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-yellow-600 dark:text-yellow-400">
              {suspendedTenants}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{texts.suspendedAccounts}</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-gray-200 dark:border-gray-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.archivedTenants}</CardTitle>
            <Archive className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-gray-600 dark:text-gray-400">
              {archivedTenants}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{texts.archivedAccounts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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

            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as StatusFilter);
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {locale === "ar"
                        ? TENANT_STATUS_CONFIG[status].labelAr
                        : TENANT_STATUS_CONFIG[status].labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {tenants.length === 0 ? (
            <div className="py-10 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">{texts.noTenants}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{texts.noTenantsDesc}</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{texts.name}</TableHead>
                      <TableHead>{texts.email}</TableHead>
                      <TableHead>{texts.status}</TableHead>
                      <TableHead>{texts.createdAt}</TableHead>
                      <TableHead className="text-end">{texts.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => {
                      const statusConfig = TENANT_STATUS_CONFIG[tenant.status] ?? {
                        labelEn: tenant.status,
                        labelAr: tenant.status,
                        color: "text-gray-600 dark:text-gray-400",
                        bgColor: "bg-gray-50 dark:bg-gray-950/30",
                      };
                      return (
                        <TableRow
                          key={tenant.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/${locale}/tenants/${tenant.id}`)}
                        >
                          <TableCell className="font-medium">
                            {tenant.facilityName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {tenant.contactEmail}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`${statusConfig.color} ${statusConfig.bgColor} border-0`}
                            >
                              {locale === "ar" ? statusConfig.labelAr : statusConfig.labelEn}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(tenant.createdAt, locale)}
                          </TableCell>
                          <TableCell className="text-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/${locale}/tenants/${tenant.id}`);
                                  }}
                                >
                                  <Eye className="me-2 h-4 w-4" />
                                  {texts.view}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/${locale}/tenants/${tenant.id}/edit`);
                                  }}
                                >
                                  <Edit className="me-2 h-4 w-4" />
                                  {texts.edit}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    {page + 1} {texts.pageOf} {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      {texts.previous}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      {texts.next}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
