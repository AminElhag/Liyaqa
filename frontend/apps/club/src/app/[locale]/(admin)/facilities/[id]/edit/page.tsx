"use client";

import { useLocale } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  FacilityForm,
  type FacilityFormData,
} from "@/components/forms/facility-form";
import {
  useFacility,
  useUpdateFacility,
} from "@liyaqa/shared/queries/use-facilities";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import type { FacilityType, GenderRestriction } from "@liyaqa/shared/types/facility";

export default function EditFacilityPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const facilityId = params.id as string;
  const { toast } = useToast();
  const { data: facility, isLoading } = useFacility(facilityId);
  const updateFacility = useUpdateFacility();

  const handleSubmit = async (data: FacilityFormData) => {
    try {
      await updateFacility.mutateAsync({
        id: facilityId,
        data: {
          nameEn: data.nameEn,
          nameAr: data.nameAr || undefined,
          descriptionEn: data.descriptionEn || undefined,
          descriptionAr: data.descriptionAr || undefined,
          type: data.type as FacilityType,
          capacity: data.capacity,
          bookingWindowDays: data.bookingWindowDays,
          minBookingMinutes: data.minBookingMinutes,
          maxBookingMinutes: data.maxBookingMinutes,
          bufferMinutes: data.bufferMinutes,
          hourlyRate: data.hourlyRate,
          hourlyRateCurrency: data.hourlyRateCurrency || undefined,
          requiresSubscription: data.requiresSubscription,
          genderRestriction:
            data.genderRestriction === "NONE"
              ? undefined
              : (data.genderRestriction as GenderRestriction),
          operatingHours: data.operatingHours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          })),
        },
      });
      toast({
        title: locale === "ar" ? "تم التحديث" : "Updated",
        description:
          locale === "ar"
            ? "تم تحديث المرفق بنجاح"
            : "Facility updated successfully",
      });
      router.push(`/${locale}/facilities/${facilityId}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في تحديث المرفق"
            : "Failed to update facility",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/facilities`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمرافق" : "Back to facilities"}
          </Link>
        </Button>
        <p className="text-neutral-500">
          {locale === "ar" ? "المرفق غير موجود" : "Facility not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/facilities/${facilityId}`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمرفق" : "Back to facility"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {locale === "ar" ? "تعديل المرفق" : "Edit Facility"}
        </h1>
        <p className="text-neutral-500">
          {locale === "ar"
            ? "تعديل معلومات المرفق"
            : "Update facility details"}
        </p>
      </div>

      <FacilityForm
        facility={facility}
        onSubmit={handleSubmit}
        isPending={updateFacility.isPending}
      />
    </div>
  );
}
