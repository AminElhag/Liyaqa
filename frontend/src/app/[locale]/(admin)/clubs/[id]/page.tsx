"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Building,
  ChevronLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Building2,
  Plus,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useClub } from "@/queries/use-clubs";
import { useClubLocations } from "@/queries/use-locations";
import { formatDate, getLocalizedText } from "@/lib/utils";
import type { ClubStatus } from "@/types/organization";

interface ClubDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ClubDetailPage({ params }: ClubDetailPageProps) {
  const { id } = use(params);
  const locale = useLocale();

  const { data: club, isLoading, error } = useClub(id);
  const { data: locations, isLoading: locationsLoading } = useClubLocations(id);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/clubs`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للأندية" : "Back to clubs"}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <Building className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>
              {locale === "ar" ? "لم يتم العثور على النادي" : "Club not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/clubs`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للأندية" : "Back to clubs"}
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
              <Building className="h-6 w-6" />
              {getLocalizedText(club.name, locale)}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(club.status)}
              {club.organizationName && (
                <Link
                  href={`/${locale}/organizations/${club.organizationId}`}
                  className="text-sm text-primary hover:underline"
                >
                  {getLocalizedText(club.organizationName, locale)}
                </Link>
              )}
            </div>
          </div>
          <Button asChild>
            <Link href={`/${locale}/clubs/${id}/edit`}>
              <Pencil className="h-4 w-4 me-2" />
              {locale === "ar" ? "تعديل" : "Edit"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Club Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "المعلومات الأساسية" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-sm text-neutral-500">
                  {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                </p>
                <p className="font-medium">{club.email}</p>
              </div>
            </div>
            {club.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">
                    {locale === "ar" ? "الهاتف" : "Phone"}
                  </p>
                  <p className="font-medium">{club.phone}</p>
                </div>
              </div>
            )}
            {club.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">
                    {locale === "ar" ? "العنوان" : "Address"}
                  </p>
                  <p className="font-medium">
                    {getLocalizedText(club.address, locale)}
                  </p>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            {locale === "ar" ? "أُنشئ:" : "Created:"}{" "}
            {formatDate(club.createdAt, locale)}
          </p>
        </CardContent>
      </Card>

      {/* Locations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {locale === "ar" ? "المواقع" : "Locations"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? `${locations?.totalElements || 0} موقع`
                  : `${locations?.totalElements || 0} location(s)`}
              </CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link href={`/${locale}/locations/new?clubId=${id}`}>
                <Plus className="h-4 w-4 me-2" />
                {locale === "ar" ? "إضافة موقع" : "Add Location"}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {locationsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : locations?.content.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <p>
                {locale === "ar"
                  ? "لا توجد مواقع لهذا النادي"
                  : "No locations for this club"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations?.content.map((location) => (
                <Link
                  key={location.id}
                  href={`/${locale}/locations/${location.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-neutral-50"
                >
                  <div>
                    <p className="font-medium">
                      {getLocalizedText(location.name, locale)}
                    </p>
                    {location.address && (
                      <p className="text-sm text-neutral-500">
                        {getLocalizedText(location.address, locale)}
                      </p>
                    )}
                  </div>
                  <Badge variant={location.isActive ? "success" : "secondary"}>
                    {location.isActive
                      ? locale === "ar"
                        ? "نشط"
                        : "Active"
                      : locale === "ar"
                        ? "غير نشط"
                        : "Inactive"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
