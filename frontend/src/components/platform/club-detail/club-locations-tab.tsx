"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClubLocations } from "@/queries/platform/use-club-detail";
import type { ClubLocation, LocationStatus, GenderPolicy } from "@/types/platform";

interface ClubLocationsTabProps {
  clubId: string;
  locale: string;
}

function LocationStatusBadge({ status, locale }: { status: LocationStatus; locale: string }) {
  const config: Record<LocationStatus, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" }> = {
    ACTIVE: { label: "Active", labelAr: "نشط", variant: "default" },
    TEMPORARILY_CLOSED: { label: "Temporarily Closed", labelAr: "مغلق مؤقتاً", variant: "secondary" },
    PERMANENTLY_CLOSED: { label: "Permanently Closed", labelAr: "مغلق نهائياً", variant: "destructive" },
  };
  const c = config[status] || { label: status, labelAr: status, variant: "secondary" as const };
  return <Badge variant={c.variant}>{locale === "ar" ? c.labelAr : c.label}</Badge>;
}

function GenderPolicyBadge({ policy, locale }: { policy: GenderPolicy; locale: string }) {
  const config: Record<GenderPolicy, { label: string; labelAr: string; color: string }> = {
    MIXED: { label: "Mixed", labelAr: "مختلط", color: "bg-blue-100 text-blue-700" },
    MALE_ONLY: { label: "Male Only", labelAr: "رجال فقط", color: "bg-sky-100 text-sky-700" },
    FEMALE_ONLY: { label: "Female Only", labelAr: "نساء فقط", color: "bg-pink-100 text-pink-700" },
    TIME_BASED: { label: "Time-Based", labelAr: "حسب الوقت", color: "bg-purple-100 text-purple-700" },
  };
  const c = config[policy] || { label: policy, labelAr: policy, color: "bg-slate-100 text-slate-700" };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
      {locale === "ar" ? c.labelAr : c.label}
    </span>
  );
}

function LocationCard({ location, locale }: { location: ClubLocation; locale: string }) {
  const name = locale === "ar" ? location.name.ar || location.name.en : location.name.en;
  const address = location.address?.formatted;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                <GenderPolicyBadge policy={location.genderPolicy} locale={locale} />
              </CardDescription>
            </div>
          </div>
          <LocationStatusBadge status={location.status} locale={locale} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{address}</span>
          </div>
        )}
        {location.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span dir="ltr">{location.phone}</span>
          </div>
        )}
        {location.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{location.email}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ClubLocationsTab({ clubId, locale }: ClubLocationsTabProps) {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useClubLocations(clubId, { page, size: 12 });

  const texts = {
    locations: locale === "ar" ? "المواقع" : "Locations",
    noLocations: locale === "ar" ? "لا توجد مواقع" : "No locations found",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    previous: locale === "ar" ? "السابق" : "Previous",
    next: locale === "ar" ? "التالي" : "Next",
    pageOf: locale === "ar" ? "صفحة {current} من {total}" : "Page {current} of {total}",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.content.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {texts.noLocations}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.content.map((location) => (
          <LocationCard key={location.id} location={location} locale={locale} />
        ))}
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {texts.pageOf
              .replace("{current}", String(page + 1))
              .replace("{total}", String(data.totalPages))}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              {texts.previous}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages - 1}
            >
              {texts.next}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
