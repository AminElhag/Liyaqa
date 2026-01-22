"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Building2,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  PowerOff,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useOrganizations,
  useActivateOrganization,
  useSuspendOrganization,
  useCloseOrganization,
} from "@/queries/use-organizations";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getLocalizedText } from "@/lib/utils";
import type { OrganizationStatus } from "@/types/organization";

export default function OrganizationsPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | "all">(
    "all"
  );

  const { data, isLoading, error } = useOrganizations({
    page,
    size: 20,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const activateOrg = useActivateOrganization();
  const suspendOrg = useSuspendOrganization();
  const closeOrg = useCloseOrganization();

  const handleActivate = async (id: string) => {
    try {
      await activateOrg.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التفعيل" : "Activated",
        description:
          locale === "ar" ? "تم تفعيل المنظمة بنجاح" : "Organization activated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في تفعيل المنظمة"
            : "Failed to activate organization",
        variant: "destructive",
      });
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await suspendOrg.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الإيقاف" : "Suspended",
        description:
          locale === "ar" ? "تم إيقاف المنظمة بنجاح" : "Organization suspended",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في إيقاف المنظمة"
            : "Failed to suspend organization",
        variant: "destructive",
      });
    }
  };

  const handleClose = async (id: string) => {
    try {
      await closeOrg.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الإغلاق" : "Closed",
        description:
          locale === "ar" ? "تم إغلاق المنظمة بنجاح" : "Organization closed",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في إغلاق المنظمة"
            : "Failed to close organization",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: OrganizationStatus) => {
    const statusConfig: Record<
      OrganizationStatus,
      { variant: "success" | "warning" | "destructive" | "secondary"; labelEn: string; labelAr: string }
    > = {
      PENDING: { variant: "secondary", labelEn: "Pending", labelAr: "قيد الانتظار" },
      ACTIVE: { variant: "success", labelEn: "Active", labelAr: "نشط" },
      SUSPENDED: { variant: "warning", labelEn: "Suspended", labelAr: "موقوف" },
      CLOSED: { variant: "destructive", labelEn: "Closed", labelAr: "مغلق" },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant}>
        {locale === "ar" ? config.labelAr : config.labelEn}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "المنظمات" : "Organizations"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar"
              ? "إدارة المنظمات والأندية"
              : "Manage organizations and clubs"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/organizations/new`}>
            <Plus className="h-4 w-4 me-2" />
            {locale === "ar" ? "إضافة منظمة" : "Add Organization"}
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
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as OrganizationStatus | "all")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={locale === "ar" ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {locale === "ar" ? "جميع الحالات" : "All Statuses"}
                </SelectItem>
                <SelectItem value="PENDING">
                  {locale === "ar" ? "قيد الانتظار" : "Pending"}
                </SelectItem>
                <SelectItem value="ACTIVE">
                  {locale === "ar" ? "نشط" : "Active"}
                </SelectItem>
                <SelectItem value="SUSPENDED">
                  {locale === "ar" ? "موقوف" : "Suspended"}
                </SelectItem>
                <SelectItem value="CLOSED">
                  {locale === "ar" ? "مغلق" : "Closed"}
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
              ? "فشل في تحميل المنظمات"
              : "Failed to load organizations"}
          </CardContent>
        </Card>
      )}

      {/* Organizations list */}
      {!isLoading && !error && (
        <>
          {data?.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-neutral-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                <p>
                  {locale === "ar"
                    ? "لا توجد منظمات"
                    : "No organizations found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.content.map((org) => (
                <Card key={org.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {getLocalizedText(org.name, locale)}
                        </CardTitle>
                        <CardDescription>{org.email}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/organizations/${org.id}`}>
                              <Eye className="h-4 w-4 me-2" />
                              {locale === "ar" ? "عرض" : "View"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/organizations/${org.id}/edit`}>
                              <Pencil className="h-4 w-4 me-2" />
                              {locale === "ar" ? "تعديل" : "Edit"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {org.status === "PENDING" && (
                            <DropdownMenuItem onClick={() => handleActivate(org.id)}>
                              <Power className="h-4 w-4 me-2" />
                              {locale === "ar" ? "تفعيل" : "Activate"}
                            </DropdownMenuItem>
                          )}
                          {org.status === "ACTIVE" && (
                            <DropdownMenuItem
                              onClick={() => handleSuspend(org.id)}
                              className="text-warning"
                            >
                              <PowerOff className="h-4 w-4 me-2" />
                              {locale === "ar" ? "إيقاف" : "Suspend"}
                            </DropdownMenuItem>
                          )}
                          {org.status === "SUSPENDED" && (
                            <>
                              <DropdownMenuItem onClick={() => handleActivate(org.id)}>
                                <Power className="h-4 w-4 me-2" />
                                {locale === "ar" ? "إعادة تفعيل" : "Reactivate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleClose(org.id)}
                                className="text-danger"
                              >
                                <XCircle className="h-4 w-4 me-2" />
                                {locale === "ar" ? "إغلاق" : "Close"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {getStatusBadge(org.status)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-neutral-500 space-y-1">
                      {org.phone && <p>{org.phone}</p>}
                      {org.website && <p>{org.website}</p>}
                      <p className="text-xs">
                        {locale === "ar" ? "أُنشئت:" : "Created:"}{" "}
                        {formatDate(org.createdAt, locale)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
