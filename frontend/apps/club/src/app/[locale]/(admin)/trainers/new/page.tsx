"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Dumbbell } from "lucide-react";
import Link from "next/link";
import { cn } from "@liyaqa/shared/utils";
import { Button } from "@liyaqa/shared/components/ui/button";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { TrainerForm, type TrainerFormData } from "@/components/forms/trainer-form";
import { useCreateTrainer } from "@liyaqa/shared/queries/use-trainers";
import { useTenantStore } from "@liyaqa/shared/stores";
import type { CreateTrainerRequest } from "@liyaqa/shared/types/trainer";

export default function NewTrainerPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const { toast } = useToast();
  const createTrainer = useCreateTrainer();
  const { organizationId } = useTenantStore();
  const isRTL = locale === "ar";

  const texts = {
    title: locale === "ar" ? "إضافة مدرب جديد" : "Add New Trainer",
    description: locale === "ar" ? "إنشاء ملف مدرب جديد لفريقك" : "Create a new trainer profile for your team",
    back: locale === "ar" ? "العودة إلى المدربين" : "Back to Trainers",
    successTitle: locale === "ar" ? "تم إنشاء المدرب" : "Trainer Created",
    successDesc: locale === "ar" ? "تم إنشاء ملف المدرب بنجاح" : "Trainer profile created successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "حدث خطأ أثناء إنشاء المدرب" : "Failed to create trainer",
  };

  const handleSubmit = (data: TrainerFormData) => {
    const request: CreateTrainerRequest = {
      userId: data.userId
        ? (data.userId as `${string}-${string}-${string}-${string}-${string}`)
        : undefined,
      organizationId: organizationId as `${string}-${string}-${string}-${string}-${string}`,
      // Basic Info
      displayName: data.displayName?.en || data.displayName?.ar
        ? { en: data.displayName.en || undefined, ar: data.displayName.ar || undefined }
        : undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      gender: data.gender,
      // Profile
      bio: data.bio.en || data.bio.ar ? data.bio : undefined,
      profileImageUrl: data.profileImageUrl || undefined,
      experienceYears: data.experienceYears,
      employmentType: data.employmentType,
      trainerType: data.trainerType,
      specializations: data.specializations
        ? data.specializations.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      hourlyRate: data.hourlyRate,
      ptSessionRate: data.ptSessionRate,
      compensationModel: data.compensationModel,
      phone: data.phone || undefined,
      notes: data.notes.en || data.notes.ar ? data.notes : undefined,
      // Skills
      skillCategoryIds: data.skillCategoryIds?.length
        ? (data.skillCategoryIds as `${string}-${string}-${string}-${string}-${string}`[])
        : undefined,
      // PT-specific fields
      homeServiceAvailable: data.homeServiceAvailable,
      travelFeeAmount: data.travelFeeAmount,
      travelFeeCurrency: data.travelFeeCurrency || undefined,
      travelRadiusKm: data.travelRadiusKm,
      maxConcurrentClients: data.maxConcurrentClients,
    };

    createTrainer.mutate(request, {
      onSuccess: (trainer) => {
        toast({
          title: texts.successTitle,
          description: texts.successDesc,
        });
        router.push(`/${locale}/trainers/${trainer.id}`);
      },
      onError: () => {
        toast({
          title: texts.errorTitle,
          description: texts.errorDesc,
          variant: "destructive",
        });
      },
    });
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/${locale}/trainers`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {texts.back}
        </Link>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              "bg-gradient-to-br from-orange-100 to-amber-100",
              "dark:from-orange-900/40 dark:to-amber-900/40"
            )}
          >
            <Dumbbell className="h-7 w-7 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{texts.title}</h1>
            <p className="text-muted-foreground">{texts.description}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <TrainerForm
        onSubmit={handleSubmit}
        isPending={createTrainer.isPending}
        showUserField
      />
    </div>
  );
}
