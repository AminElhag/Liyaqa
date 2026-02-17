"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  FacilityForm,
  type FacilityFormData,
} from "@/components/forms/facility-form";
import { useCreateFacility } from "@liyaqa/shared/queries/use-facilities";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import type { FacilityType, GenderRestriction } from "@liyaqa/shared/types/facility";

export default function NewFacilityPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createFacility = useCreateFacility();

  const handleSubmit = async (data: FacilityFormData) => {
    try {
      const result = await createFacility.mutateAsync({
        locationId: data.locationId,
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
      });
      toast({
        title: locale === "ar" ? "تم الإنشاء" : "Created",
        description:
          locale === "ar"
            ? "تم إنشاء المرفق بنجاح"
            : "Facility created successfully",
      });
      router.push(`/${locale}/facilities/${result.id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في إنشاء المرفق" : "Failed to create facility",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/facilities`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمرافق" : "Back to facilities"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {locale === "ar" ? "إضافة مرفق جديد" : "Add New Facility"}
        </h1>
        <p className="text-neutral-500">
          {locale === "ar"
            ? "أدخل معلومات المرفق الجديد"
            : "Enter the new facility details"}
        </p>
      </div>

      <FacilityForm
        onSubmit={handleSubmit}
        isPending={createFacility.isPending}
      />
    </div>
  );
}
