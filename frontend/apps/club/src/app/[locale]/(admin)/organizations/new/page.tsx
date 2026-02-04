"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  OrganizationForm,
  type OrganizationFormData,
} from "@/components/forms/organization-form";
import { useCreateOrganization } from "@liyaqa/shared/queries/use-organizations";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

export default function NewOrganizationPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const createOrganization = useCreateOrganization();

  const handleSubmit = async (data: OrganizationFormData) => {
    try {
      const result = await createOrganization.mutateAsync({
        name: {
          en: data.name.en || "",
          ar: data.name.ar || undefined,
        },
        email: data.email,
        phone: data.phone || undefined,
        website: data.website || undefined,
        address: data.address?.en || data.address?.ar
          ? {
              en: data.address.en || "",
              ar: data.address.ar || undefined,
            }
          : undefined,
        zatcaSellerName: data.zatcaSellerName || undefined,
        zatcaVatNumber: data.zatcaVatNumber || undefined,
      });
      toast({
        title: locale === "ar" ? "تم الإنشاء" : "Created",
        description:
          locale === "ar"
            ? "تم إنشاء المنظمة بنجاح"
            : "Organization created successfully",
      });
      router.push(`/${locale}/organizations/${result.id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في إنشاء المنظمة"
            : "Failed to create organization",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/organizations`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمنظمات" : "Back to organizations"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {locale === "ar" ? "إضافة منظمة جديدة" : "Add New Organization"}
        </h1>
        <p className="text-neutral-500">
          {locale === "ar"
            ? "أدخل معلومات المنظمة الجديدة"
            : "Enter the new organization details"}
        </p>
      </div>

      <OrganizationForm
        onSubmit={handleSubmit}
        isPending={createOrganization.isPending}
      />
    </div>
  );
}
