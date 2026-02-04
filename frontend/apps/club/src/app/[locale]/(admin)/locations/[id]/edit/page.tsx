"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Building2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  LocationForm,
  type LocationFormData,
} from "@/components/forms/location-form";
import { useLocation, useUpdateLocation } from "@liyaqa/shared/queries/use-locations";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { getLocalizedText } from "@liyaqa/shared/utils";

interface EditLocationPageProps {
  params: Promise<{ id: string }>;
}

export default function EditLocationPage({ params }: EditLocationPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const { data: location, isLoading, error } = useLocation(id);
  const updateLocation = useUpdateLocation();

  const handleSubmit = async (data: LocationFormData) => {
    try {
      await updateLocation.mutateAsync({
        id,
        data: {
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
        },
      });
      toast({
        title: locale === "ar" ? "تم الحفظ" : "Saved",
        description:
          locale === "ar"
            ? "تم حفظ التغييرات بنجاح"
            : "Changes saved successfully",
      });
      router.push(`/${locale}/locations/${id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في حفظ التغييرات" : "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
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
          <Link href={`/${locale}/locations/${id}`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للموقع" : "Back to location"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {locale === "ar" ? "تعديل الموقع" : "Edit Location"}
        </h1>
        <p className="text-neutral-500">
          {getLocalizedText(location.name, locale)}
        </p>
      </div>

      <LocationForm
        location={location}
        onSubmit={handleSubmit}
        isPending={updateLocation.isPending}
      />
    </div>
  );
}
