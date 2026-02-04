"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Snowflake } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import {
  FreezePackageForm,
  type FreezePackageFormValues,
} from "@/components/admin/freeze-package-form";
import {
  useFreezePackage,
  useUpdateFreezePackage,
} from "@liyaqa/shared/queries/use-freeze-packages";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

export default function EditFreezePackagePage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const { data: pkg, isLoading, error } = useFreezePackage(id);
  const updatePackage = useUpdateFreezePackage();

  const texts = {
    back: locale === "ar" ? "العودة للباقة" : "Back to Package",
    title: locale === "ar" ? "تعديل باقة التجميد" : "Edit Freeze Package",
    loadError: locale === "ar" ? "فشل في تحميل الباقة" : "Failed to load package",
    successTitle: locale === "ar" ? "تم الحفظ" : "Saved",
    successDesc: locale === "ar" ? "تم تحديث باقة التجميد بنجاح" : "Freeze package updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "فشل في تحديث الباقة" : "Failed to update package",
  };

  const handleSubmit = async (data: FreezePackageFormValues) => {
    try {
      await updatePackage.mutateAsync({
        id,
        data: {
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
        },
      });

      toast({
        title: texts.successTitle,
        description: texts.successDesc,
      });

      router.push(`/${locale}/freeze-packages/${id}`);
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : texts.errorDesc,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/freeze-packages`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {texts.loadError}
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultValues: Partial<FreezePackageFormValues> = {
    nameEn: pkg.name.en,
    nameAr: pkg.name.ar || "",
    descriptionEn: pkg.description?.en || "",
    descriptionAr: pkg.description?.ar || "",
    freezeDays: pkg.freezeDays,
    priceAmount: pkg.price.amount,
    priceCurrency: pkg.price.currency,
    extendsContract: pkg.extendsContract,
    requiresDocumentation: pkg.requiresDocumentation,
    sortOrder: pkg.sortOrder,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/freeze-packages/${id}`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Snowflake className="h-6 w-6 text-blue-500" />
            {texts.title}
          </h1>
          <p className="text-muted-foreground">
            <LocalizedText text={pkg.name} />
          </p>
        </div>
      </div>

      {/* Form */}
      <FreezePackageForm
        mode="edit"
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isLoading={updatePackage.isPending}
      />
    </div>
  );
}
