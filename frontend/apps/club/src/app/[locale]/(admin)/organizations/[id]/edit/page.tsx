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
  OrganizationForm,
  type OrganizationFormData,
} from "@/components/forms/organization-form";
import {
  useOrganization,
  useUpdateOrganization,
} from "@liyaqa/shared/queries/use-organizations";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { getLocalizedText } from "@liyaqa/shared/utils";

interface EditOrganizationPageProps {
  params: Promise<{ id: string }>;
}

export default function EditOrganizationPage({
  params,
}: EditOrganizationPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const { data: organization, isLoading, error } = useOrganization(id);
  const updateOrganization = useUpdateOrganization();

  const handleSubmit = async (data: OrganizationFormData) => {
    try {
      await updateOrganization.mutateAsync({
        id,
        data: {
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
        },
      });
      toast({
        title: locale === "ar" ? "تم الحفظ" : "Saved",
        description:
          locale === "ar"
            ? "تم حفظ التغييرات بنجاح"
            : "Changes saved successfully",
      });
      router.push(`/${locale}/organizations/${id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في حفظ التغييرات"
            : "Failed to save changes",
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

  if (error || !organization) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/organizations`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمنظمات" : "Back to organizations"}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>
              {locale === "ar"
                ? "لم يتم العثور على المنظمة"
                : "Organization not found"}
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
          <Link href={`/${locale}/organizations/${id}`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمنظمة" : "Back to organization"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {locale === "ar" ? "تعديل المنظمة" : "Edit Organization"}
        </h1>
        <p className="text-neutral-500">
          {getLocalizedText(organization.name, locale)}
        </p>
      </div>

      <OrganizationForm
        organization={organization}
        onSubmit={handleSubmit}
        isPending={updateOrganization.isPending}
      />
    </div>
  );
}
