"use client";

import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { TrainerForm, type TrainerFormData } from "@/components/forms/trainer-form";
import { useTrainer, useUpdateTrainerProfile } from "@/queries/use-trainers";
import { getLocalizedText } from "@/lib/utils";
import type { UUID } from "@/types/api";
import type { UpdateTrainerProfileRequest } from "@/types/trainer";

export default function EditTrainerPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as UUID;

  const { data: trainer, isLoading, error } = useTrainer(id);
  const updateTrainer = useUpdateTrainerProfile();

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
    };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/trainers/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{texts.title}</h1>
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
