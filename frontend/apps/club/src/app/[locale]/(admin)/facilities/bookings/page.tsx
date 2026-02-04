"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { PageHeader } from "@liyaqa/shared/components/page-header";
import { BookingCalendar } from "@/components/facilities";
import { cn } from "@liyaqa/shared/utils";
import { useFacilities } from "@liyaqa/shared/queries/use-facilities";
import { useLocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import type { Facility } from "@liyaqa/shared/types/facility";

export default function FacilityBookingsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");

  const { data: facilitiesData, isLoading: facilitiesLoading } = useFacilities({ size: 100 });
  const facilities = facilitiesData?.content || [];
  const activeFacilities = facilities.filter((f) => f.status === "ACTIVE");

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  const texts = {
    title: isRtl ? "حجوزات المرافق" : "Facility Bookings",
    subtitle: isRtl ? "إدارة حجوزات المرافق" : "Manage facility bookings",
    back: isRtl ? "رجوع" : "Back",
    selectFacility: isRtl ? "اختر المرفق" : "Select Facility",
    noFacilities: isRtl ? "لا توجد مرافق نشطة" : "No active facilities",
    createFacility: isRtl ? "إنشاء مرفق" : "Create Facility",
  };

  if (facilitiesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={texts.title}
        description={texts.subtitle}
      >
        <Button asChild variant="outline">
          <Link href="/facilities">
            <ArrowLeft className={cn("h-4 w-4", isRtl ? "ms-2 rotate-180" : "me-2")} />
            {texts.back}
          </Link>
        </Button>
      </PageHeader>

      {activeFacilities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{texts.noFacilities}</h3>
          <Button asChild className="mt-4">
            <Link href="/facilities/new">{texts.createFacility}</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Facility Selector */}
          <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
            <label className="text-sm font-medium">{texts.selectFacility}:</label>
            <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder={texts.selectFacility} />
              </SelectTrigger>
              <SelectContent>
                {activeFacilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    <FacilityOption facility={facility} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar */}
          {selectedFacilityId && selectedFacility ? (
            <FacilityCalendarWrapper facility={selectedFacility} />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-md3-lg">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{texts.selectFacility}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FacilityOption({ facility }: { facility: Facility }) {
  const name = useLocalizedText(facility.name);
  return <span>{name}</span>;
}

function FacilityCalendarWrapper({ facility }: { facility: Facility }) {
  const name = useLocalizedText(facility.name);
  return (
    <BookingCalendar
      facilityId={facility.id}
      facilityName={name}
    />
  );
}
