"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { TrainerForm, type TrainerFormData } from "@/components/forms/trainer-form";
import { useCreateTrainer } from "@liyaqa/shared/queries/use-trainers";
import { useTenantStore } from "@liyaqa/shared/stores";
import type { CreateTrainerRequest } from "@liyaqa/shared/types/trainer";

export default function NewTrainerPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createTrainer = useCreateTrainer();
  const { organizationId } = useTenantStore();

  const texts = {
    title: locale === "ar" ? "إضافة مدرب جديد" : "Add New Trainer",
    description: locale === "ar" ? "إنشاء ملف مدرب جديد" : "Create a new trainer profile",
    back: locale === "ar" ? "العودة إلى المدربين" : "Back to Trainers",
    successTitle: locale === "ar" ? "تم إنشاء المدرب" : "Trainer Created",
    successDesc: locale === "ar" ? "تم إنشاء ملف المدرب بنجاح" : "Trainer profile created successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "حدث خطأ أثناء إنشاء المدرب" : "Failed to create trainer",
  };

  const handleSubmit = (data: TrainerFormData) => {
    // Convert form data to API request
    const request: CreateTrainerRequest = {
      userId: data.userId as `${string}-${string}-${string}-${string}-${string}`,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/trainers`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
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
