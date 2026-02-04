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
  Users,
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
  useLocations,
  useActivateLocation,
  useDeactivateLocation,
} from "@liyaqa/shared/queries/use-locations";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { formatDate, getLocalizedText } from "@liyaqa/shared/utils";

export default function LocationsPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );

  const { data, isLoading, error } = useLocations({
    page,
    size: 20,
    search: search || undefined,
    isActive:
      activeFilter === "all"
        ? undefined
        : activeFilter === "active",
  });

  const activateLocation = useActivateLocation();
  const deactivateLocation = useDeactivateLocation();

  const handleActivate = async (id: string) => {
    try {
      await activateLocation.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التفعيل" : "Activated",
        description:
          locale === "ar" ? "تم تفعيل الموقع بنجاح" : "Location activated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في تفعيل الموقع"
            : "Failed to activate location",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateLocation.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الإيقاف" : "Deactivated",
        description:
          locale === "ar" ? "تم إيقاف الموقع بنجاح" : "Location deactivated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في إيقاف الموقع"
            : "Failed to deactivate location",
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
            {locale === "ar" ? "المواقع" : "Locations"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar"
              ? "إدارة مواقع الأندية"
              : "Manage club locations"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/locations/new`}>
            <Plus className="h-4 w-4 me-2" />
            {locale === "ar" ? "إضافة موقع" : "Add Location"}
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
              ? "فشل في تحميل المواقع"
              : "Failed to load locations"}
          </CardContent>
        </Card>
      )}

      {/* Locations list */}
      {!isLoading && !error && (
        <>
          {data?.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-neutral-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                <p>
                  {locale === "ar" ? "لا توجد مواقع" : "No locations found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.content.map((location) => (
                <Card
                  key={location.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {getLocalizedText(location.name, locale)}
                        </CardTitle>
                        {location.clubName && (
                          <CardDescription>
                            {getLocalizedText(location.clubName, locale)}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/locations/${location.id}`}>
                              <Eye className="h-4 w-4 me-2" />
                              {locale === "ar" ? "عرض" : "View"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/${locale}/locations/${location.id}/edit`}
                            >
                              <Pencil className="h-4 w-4 me-2" />
                              {locale === "ar" ? "تعديل" : "Edit"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {location.isActive ? (
                            <DropdownMenuItem
                              onClick={() => handleDeactivate(location.id)}
                              className="text-warning"
                            >
                              <PowerOff className="h-4 w-4 me-2" />
                              {locale === "ar" ? "إيقاف" : "Deactivate"}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleActivate(location.id)}
                            >
                              <Power className="h-4 w-4 me-2" />
                              {locale === "ar" ? "تفعيل" : "Activate"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Badge
                      variant={location.isActive ? "success" : "secondary"}
                    >
                      {location.isActive
                        ? locale === "ar"
                          ? "نشط"
                          : "Active"
                        : locale === "ar"
                          ? "غير نشط"
                          : "Inactive"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-neutral-500 space-y-1">
                      {location.address && (
                        <p>{getLocalizedText(location.address, locale)}</p>
                      )}
                      {location.capacity && (
                        <p className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {locale === "ar"
                            ? `السعة: ${location.capacity}`
                            : `Capacity: ${location.capacity}`}
                        </p>
                      )}
                      <p className="text-xs">
                        {locale === "ar" ? "أُنشئ:" : "Created:"}{" "}
                        {formatDate(location.createdAt, locale)}
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
