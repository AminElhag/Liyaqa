"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Users,
  Building,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useLocation } from "@liyaqa/shared/queries/use-locations";
import { formatDate, getLocalizedText } from "@liyaqa/shared/utils";

interface LocationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LocationDetailPage({
  params,
}: LocationDetailPageProps) {
  const { id } = use(params);
  const locale = useLocale();

  const { data: location, isLoading, error } = useLocation(id);

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

  if (error || !location) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/locations`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمواقع" : "Back to locations"}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>
              {locale === "ar"
                ? "لم يتم العثور على الموقع"
                : "Location not found"}
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
          <Link href={`/${locale}/locations`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمواقع" : "Back to locations"}
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              {getLocalizedText(location.name, locale)}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={location.isActive ? "success" : "secondary"}>
                {location.isActive
                  ? locale === "ar"
                    ? "نشط"
                    : "Active"
                  : locale === "ar"
                    ? "غير نشط"
                    : "Inactive"}
              </Badge>
              {location.clubName && (
                <Link
                  href={`/${locale}/clubs/${location.clubId}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Building className="h-4 w-4" />
                  {getLocalizedText(location.clubName, locale)}
                </Link>
              )}
            </div>
          </div>
          <Button asChild>
            <Link href={`/${locale}/locations/${id}/edit`}>
              <Pencil className="h-4 w-4 me-2" />
              {locale === "ar" ? "تعديل" : "Edit"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Location Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "المعلومات الأساسية" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {location.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">
                    {locale === "ar" ? "العنوان" : "Address"}
                  </p>
                  <p className="font-medium">
                    {getLocalizedText(location.address, locale)}
                  </p>
                </div>
              </div>
            )}
            {location.capacity && (
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">
                    {locale === "ar" ? "السعة" : "Capacity"}
                  </p>
                  <p className="font-medium">{location.capacity}</p>
                </div>
              </div>
            )}
            {location.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">
                    {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                  </p>
                  <p className="font-medium">{location.email}</p>
                </div>
              </div>
            )}
            {location.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">
                    {locale === "ar" ? "الهاتف" : "Phone"}
                  </p>
                  <p className="font-medium">{location.phone}</p>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            {locale === "ar" ? "أُنشئ:" : "Created:"}{" "}
            {formatDate(location.createdAt, locale)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
