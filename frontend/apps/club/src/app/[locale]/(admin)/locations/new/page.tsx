"use client";

import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  LocationForm,
  type LocationFormData,
} from "@/components/forms/location-form";
import { useCreateLocation } from "@liyaqa/shared/queries/use-locations";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

export default function NewLocationPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const clubId = searchParams.get("clubId") || user?.tenantId || undefined;
  const createLocation = useCreateLocation();

  const handleSubmit = async (data: LocationFormData) => {
    try {
      const result = await createLocation.mutateAsync({
        clubId: data.clubId,
        name: {
          en: data.name.en,
          ar: data.name.ar || undefined,
        },
        address: data.address?.en || data.address?.ar
          ? {
              en: data.address.en || "",
              ar: data.address.ar || undefined,
            }
          : undefined,
        capacity: data.capacity || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
      });
      toast({
        title: locale === "ar" ? "تم الإنشاء" : "Created",
        description:
          locale === "ar"
            ? "تم إنشاء الموقع بنجاح"
            : "Location created successfully",
      });
      router.push(`/${locale}/locations/${result.id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في إنشاء الموقع" : "Failed to create location",
        variant: "destructive",
      });
    }
  };

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
        <h1 className="text-2xl font-bold text-neutral-900">
          {locale === "ar" ? "إضافة موقع جديد" : "Add New Location"}
        </h1>
        <p className="text-neutral-500">
          {locale === "ar"
            ? "أدخل معلومات الموقع الجديد"
            : "Enter the new location details"}
        </p>
      </div>

      <LocationForm
        defaultClubId={clubId}
        onSubmit={handleSubmit}
        isPending={createLocation.isPending}
      />
    </div>
  );
}
