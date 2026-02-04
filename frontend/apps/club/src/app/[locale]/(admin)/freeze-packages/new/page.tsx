"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Snowflake } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  FreezePackageForm,
  type FreezePackageFormValues,
} from "@/components/admin/freeze-package-form";
import { useCreateFreezePackage } from "@liyaqa/shared/queries/use-freeze-packages";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

export default function NewFreezePackagePage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const createPackage = useCreateFreezePackage();

  const texts = {
    back: locale === "ar" ? "العودة للباقات" : "Back to Packages",
    title: locale === "ar" ? "إنشاء باقة تجميد جديدة" : "Create New Freeze Package",
    subtitle: locale === "ar" ? "إضافة باقة تجميد جديدة للأعضاء" : "Add a new freeze package for members",
    successTitle: locale === "ar" ? "تم الإنشاء" : "Created",
    successDesc: locale === "ar" ? "تم إنشاء باقة التجميد بنجاح" : "Freeze package created successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "فشل في إنشاء الباقة" : "Failed to create package",
  };

  const handleSubmit = async (data: FreezePackageFormValues) => {
    try {
      await createPackage.mutateAsync({
        name: {
          en: data.nameEn,
          ar: data.nameAr || undefined,
        },
        description: data.descriptionEn
          ? {
              en: data.descriptionEn,
              ar: data.descriptionAr || undefined,
            }
          : undefined,
        freezeDays: data.freezeDays,
        priceAmount: data.priceAmount,
        priceCurrency: data.priceCurrency,
        extendsContract: data.extendsContract,
        requiresDocumentation: data.requiresDocumentation,
        sortOrder: data.sortOrder,
      });

      toast({
        title: texts.successTitle,
        description: texts.successDesc,
      });

      router.push(`/${locale}/freeze-packages`);
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : texts.errorDesc,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/freeze-packages`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Snowflake className="h-6 w-6 text-blue-500" />
            {texts.title}
          </h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
      </div>

      {/* Form */}
      <FreezePackageForm
        mode="create"
        onSubmit={handleSubmit}
        isLoading={createPackage.isPending}
      />
    </div>
  );
}
