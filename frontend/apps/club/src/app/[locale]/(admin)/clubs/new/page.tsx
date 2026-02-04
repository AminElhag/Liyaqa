"use client";

import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { ClubForm, type ClubFormData } from "@/components/forms/club-form";
import { useCreateClub } from "@liyaqa/shared/queries/use-clubs";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

export default function NewClubPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const organizationId = searchParams.get("organizationId") || undefined;
  const createClub = useCreateClub();

  const handleSubmit = async (data: ClubFormData) => {
    try {
      const result = await createClub.mutateAsync({
        organizationId: data.organizationId,
        name: {
          en: data.name.en,
          ar: data.name.ar || undefined,
        },
        email: data.email,
        phone: data.phone || undefined,
        address: data.address?.en || data.address?.ar
          ? {
              en: data.address.en || "",
              ar: data.address.ar || undefined,
            }
          : undefined,
      });
      toast({
        title: locale === "ar" ? "تم الإنشاء" : "Created",
        description:
          locale === "ar" ? "تم إنشاء النادي بنجاح" : "Club created successfully",
      });
      router.push(`/${locale}/clubs/${result.id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في إنشاء النادي" : "Failed to create club",
        variant: "destructive",
      });
    }
  };

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
        <h1 className="text-2xl font-bold text-neutral-900">
          {locale === "ar" ? "إضافة نادي جديد" : "Add New Club"}
        </h1>
        <p className="text-neutral-500">
          {locale === "ar"
            ? "أدخل معلومات النادي الجديد"
            : "Enter the new club details"}
        </p>
      </div>

      <ClubForm
        defaultOrganizationId={organizationId}
        onSubmit={handleSubmit}
        isPending={createClub.isPending}
      />
    </div>
  );
}
