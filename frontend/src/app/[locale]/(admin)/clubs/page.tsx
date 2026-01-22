"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Building,
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
  useClubs,
  useActivateClub,
  useSuspendClub,
  useCloseClub,
} from "@/queries/use-clubs";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getLocalizedText } from "@/lib/utils";
import type { ClubStatus } from "@/types/organization";

export default function ClubsPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClubStatus | "all">("all");

  const { data, isLoading, error } = useClubs({
    page,
    size: 20,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const activateClub = useActivateClub();
  const suspendClub = useSuspendClub();
  const closeClub = useCloseClub();

  const handleActivate = async (id: string) => {
    try {
      await activateClub.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التفعيل" : "Activated",
        description:
          locale === "ar" ? "تم تفعيل النادي بنجاح" : "Club activated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في تفعيل النادي" : "Failed to activate club",
        variant: "destructive",
      });
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await suspendClub.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الإيقاف" : "Suspended",
        description:
          locale === "ar" ? "تم إيقاف النادي بنجاح" : "Club suspended",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في إيقاف النادي" : "Failed to suspend club",
        variant: "destructive",
      });
    }
  };

  const handleClose = async (id: string) => {
    try {
      await closeClub.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الإغلاق" : "Closed",
        description: locale === "ar" ? "تم إغلاق النادي بنجاح" : "Club closed",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في إغلاق النادي" : "Failed to close club",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: ClubStatus) => {
    const statusConfig: Record<
      ClubStatus,
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
            {locale === "ar" ? "الأندية" : "Clubs"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar" ? "إدارة الأندية والفروع" : "Manage clubs and branches"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/clubs/new`}>
            <Plus className="h-4 w-4 me-2" />
            {locale === "ar" ? "إضافة نادي" : "Add Club"}
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
                setStatusFilter(value as ClubStatus | "all")
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
            {locale === "ar" ? "فشل في تحميل الأندية" : "Failed to load clubs"}
          </CardContent>
        </Card>
      )}

      {/* Clubs list */}
      {!isLoading && !error && (
        <>
          {data?.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-neutral-500">
                <Building className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                <p>
                  {locale === "ar" ? "لا توجد أندية" : "No clubs found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.content.map((club) => (
                <Card key={club.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {getLocalizedText(club.name, locale)}
                        </CardTitle>
                        <CardDescription>{club.email}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/clubs/${club.id}`}>
                              <Eye className="h-4 w-4 me-2" />
                              {locale === "ar" ? "عرض" : "View"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/clubs/${club.id}/edit`}>
                              <Pencil className="h-4 w-4 me-2" />
                              {locale === "ar" ? "تعديل" : "Edit"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {club.status === "PENDING" && (
                            <DropdownMenuItem onClick={() => handleActivate(club.id)}>
                              <Power className="h-4 w-4 me-2" />
                              {locale === "ar" ? "تفعيل" : "Activate"}
                            </DropdownMenuItem>
                          )}
                          {club.status === "ACTIVE" && (
                            <DropdownMenuItem
                              onClick={() => handleSuspend(club.id)}
                              className="text-warning"
                            >
                              <PowerOff className="h-4 w-4 me-2" />
                              {locale === "ar" ? "إيقاف" : "Suspend"}
                            </DropdownMenuItem>
                          )}
                          {club.status === "SUSPENDED" && (
                            <>
                              <DropdownMenuItem onClick={() => handleActivate(club.id)}>
                                <Power className="h-4 w-4 me-2" />
                                {locale === "ar" ? "إعادة تفعيل" : "Reactivate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleClose(club.id)}
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
                    {getStatusBadge(club.status)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-neutral-500 space-y-1">
                      {club.organizationName && (
                        <p>{getLocalizedText(club.organizationName, locale)}</p>
                      )}
                      {club.phone && <p>{club.phone}</p>}
                      <p className="text-xs">
                        {locale === "ar" ? "أُنشئ:" : "Created:"}{" "}
                        {formatDate(club.createdAt, locale)}
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
