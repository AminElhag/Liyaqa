"use client";

import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { TrainerForm, type TrainerFormData } from "@/components/forms/trainer-form";
import { useTrainer, useUpdateTrainerProfile, useUpdateTrainerSkills } from "@liyaqa/shared/queries/use-trainers";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { UUID } from "@liyaqa/shared/types/api";
import type { UpdateTrainerProfileRequest } from "@liyaqa/shared/types/trainer";

export default function EditTrainerPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as UUID;
  const isRTL = locale === "ar";

  const { data: trainer, isLoading, error } = useTrainer(id);
  const updateTrainer = useUpdateTrainerProfile();
  const updateSkills = useUpdateTrainerSkills();

  const texts = {
    title: locale === "ar" ? "تعديل المدرب" : "Edit Trainer",
    description: locale === "ar" ? "تحديث معلومات المدرب" : "Update trainer information",
    back: locale === "ar" ? "العودة إلى المدرب" : "Back to Trainer",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل المدرب" : "Error loading trainer",
    notFound: locale === "ar" ? "المدرب غير موجود" : "Trainer not found",
    successTitle: locale === "ar" ? "تم تحديث المدرب" : "Trainer Updated",
    successDesc: locale === "ar" ? "تم تحديث معلومات المدرب بنجاح" : "Trainer information updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "حدث خطأ أثناء تحديث المدرب" : "Failed to update trainer",
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">{error ? texts.error : texts.notFound}</p>
      </div>
    );
  }

  const name = getLocalizedText(trainer.displayName, locale) || "Trainer";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const handleSubmit = (data: TrainerFormData) => {
    const request: UpdateTrainerProfileRequest = {
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
      // PT-specific fields
      homeServiceAvailable: data.homeServiceAvailable,
      travelFeeAmount: data.travelFeeAmount,
      travelFeeCurrency: data.travelFeeCurrency || undefined,
      travelRadiusKm: data.travelRadiusKm,
      maxConcurrentClients: data.maxConcurrentClients,
    };

    // Update skills if changed
    const currentSkillIds = trainer.skills?.map((s) => s.categoryId).sort() || [];
    const newSkillIds = (data.skillCategoryIds || []).sort();
    const skillsChanged =
      currentSkillIds.length !== newSkillIds.length ||
      currentSkillIds.some((id, i) => id !== newSkillIds[i]);

    if (skillsChanged) {
      updateSkills.mutate({
        id,
        data: {
          categoryIds: (data.skillCategoryIds || []) as `${string}-${string}-${string}-${string}-${string}`[],
        },
      });
    }

    updateTrainer.mutate(
      { id, data: request },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.successDesc,
          });
          router.push(`/${locale}/trainers/${id}`);
        },
        onError: () => {
          toast({
            title: texts.errorTitle,
            description: texts.errorDesc,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/${locale}/trainers/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {texts.back}
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{name}</p>
        </div>
      </div>

      {/* Form */}
      <TrainerForm
        trainer={trainer}
        onSubmit={handleSubmit}
        isPending={updateTrainer.isPending}
      />
    </div>
  );
}
