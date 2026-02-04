"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Plus, Building2, Users, Clock, DollarSign } from "lucide-react";

import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useFacilities } from "@liyaqa/shared/queries/use-facilities";
import { useLocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import type { Facility, FacilityType, FacilityStatus } from "@liyaqa/shared/types/facility";

const facilityTypeLabels: Record<FacilityType, { en: string; ar: string }> = {
  SWIMMING_POOL: { en: "Swimming Pool", ar: "مسبح" },
  TENNIS_COURT: { en: "Tennis Court", ar: "ملعب تنس" },
  SQUASH_COURT: { en: "Squash Court", ar: "ملعب سكواش" },
  SAUNA: { en: "Sauna", ar: "ساونا" },
  STEAM_ROOM: { en: "Steam Room", ar: "غرفة بخار" },
  JACUZZI: { en: "Jacuzzi", ar: "جاكوزي" },
  MASSAGE_ROOM: { en: "Massage Room", ar: "غرفة مساج" },
  PRIVATE_STUDIO: { en: "Private Studio", ar: "استوديو خاص" },
  BASKETBALL_COURT: { en: "Basketball Court", ar: "ملعب كرة سلة" },
  PADEL_COURT: { en: "Padel Court", ar: "ملعب بادل" },
  OTHER: { en: "Other", ar: "أخرى" },
};

const statusConfig: Record<FacilityStatus, { labelEn: string; labelAr: string; variant: "default" | "secondary" | "destructive" }> = {
  ACTIVE: { labelEn: "Active", labelAr: "نشط", variant: "default" },
  INACTIVE: { labelEn: "Inactive", labelAr: "غير نشط", variant: "secondary" },
  MAINTENANCE: { labelEn: "Maintenance", labelAr: "صيانة", variant: "destructive" },
};

function FacilityCard({ facility }: { facility: Facility }) {
  const locale = useLocale();
  const name = useLocalizedText(facility.name);
  const description = useLocalizedText(facility.description);
  const typeLabel = facilityTypeLabels[facility.type];
  const statusInfo = statusConfig[facility.status];

  return (
    <Link href={`/${locale}/facilities/${facility.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription>
                {locale === "ar" ? typeLabel.ar : typeLabel.en}
              </CardDescription>
            </div>
            <Badge variant={statusInfo.variant}>
              {locale === "ar" ? statusInfo.labelAr : statusInfo.labelEn}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {description}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {facility.capacity}{" "}
                {locale === "ar" ? "شخص" : "capacity"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {facility.minBookingMinutes}{" "}
                {locale === "ar" ? "دقيقة" : "min"}
              </span>
            </div>
            {facility.hourlyRate && (
              <div className="flex items-center gap-2 col-span-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>
                  {facility.hourlyRateCurrency} {facility.hourlyRate}
                  {locale === "ar" ? "/ساعة" : "/hour"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function FacilitiesPage() {
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useFacilities({ page, size: 12 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const facilities = data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {locale === "ar" ? "المرافق" : "Facilities"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إدارة المرافق القابلة للحجز"
              : "Manage bookable facilities"}
          </p>
        </div>
        <Link href={`/${locale}/facilities/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {locale === "ar" ? "مرفق جديد" : "New Facility"}
          </Button>
        </Link>
      </div>

      {facilities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {locale === "ar" ? "لا توجد مرافق" : "No Facilities"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {locale === "ar"
                ? "لم يتم إنشاء أي مرافق بعد"
                : "No facilities have been created yet"}
            </p>
            <Link href={`/${locale}/facilities/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {locale === "ar" ? "إنشاء مرفق" : "Create Facility"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.first}
              >
                {locale === "ar" ? "السابق" : "Previous"}
              </Button>
              <span className="flex items-center px-4">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
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
