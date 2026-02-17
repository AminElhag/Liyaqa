"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { PageHeader } from "@liyaqa/shared/components/page-header";
import { BookingCalendar } from "@/components/facilities";
import { cn } from "@liyaqa/shared/utils";
import { useFacility } from "@liyaqa/shared/queries/use-facilities";
import { useLocalizedText } from "@liyaqa/shared/components/ui/localized-text";

export default function FacilityBookingsPage() {
  const params = useParams();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const facilityId = params.id as string;

  const { data: facility, isLoading } = useFacility(facilityId);
  const name = useLocalizedText(facility?.name);

  const texts = {
    title: isRtl ? `حجوزات ${name || "المرفق"}` : `${name || "Facility"} Bookings`,
    subtitle: isRtl ? "عرض وإدارة الحجوزات" : "View and manage bookings",
    back: isRtl ? "رجوع" : "Back",
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={texts.title} description={texts.subtitle}>
        <Button asChild variant="outline">
          <Link href={`/${locale}/facilities/${facilityId}`}>
            <ArrowLeft className={cn("h-4 w-4", isRtl ? "ms-2 rotate-180" : "me-2")} />
            {texts.back}
          </Link>
        </Button>
      </PageHeader>

      <BookingCalendar facilityId={facilityId} facilityName={name} />
    </div>
  );
}
