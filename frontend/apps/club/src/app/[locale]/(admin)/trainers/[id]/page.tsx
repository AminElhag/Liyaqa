"use client";

import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, CheckCircle, Power, Briefcase, Mail, Phone, Award, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { LoadingButton } from "@liyaqa/shared/components/ui/loading-button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@liyaqa/shared/components/ui/avatar";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { TrainerStatusBadge } from "@/components/admin/trainer-status-badge";
import { TrainerTypeBadge } from "@/components/admin/trainer-type-badge";
import {
  useTrainer,
  useActivateTrainer,
  useDeactivateTrainer,
  useSetTrainerOnLeave,
} from "@liyaqa/shared/queries/use-trainers";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { UUID } from "@liyaqa/shared/types/api";

export default function TrainerDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as UUID;

  const { data: trainer, isLoading, error } = useTrainer(id);
  const activateTrainer = useActivateTrainer();
  const deactivateTrainer = useDeactivateTrainer();
  const setOnLeave = useSetTrainerOnLeave();

  const texts = {
    back: locale === "ar" ? "العودة إلى المدربين" : "Back to Trainers",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    setOnLeave: locale === "ar" ? "إجازة" : "Set On Leave",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل المدرب" : "Error loading trainer",
    notFound: locale === "ar" ? "المدرب غير موجود" : "Trainer not found",

    // Section titles
    profileInfo: locale === "ar" ? "معلومات الملف الشخصي" : "Profile Information",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    qualifications: locale === "ar" ? "المؤهلات" : "Qualifications",
    compensation: locale === "ar" ? "التعويضات" : "Compensation",

    // Fields
    bio: locale === "ar" ? "السيرة الذاتية" : "Bio",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    experienceYears: locale === "ar" ? "سنوات الخبرة" : "Years of Experience",
    specializations: locale === "ar" ? "التخصصات" : "Specializations",
    certifications: locale === "ar" ? "الشهادات" : "Certifications",
    hourlyRate: locale === "ar" ? "السعر بالساعة" : "Hourly Rate",
    ptSessionRate: locale === "ar" ? "سعر جلسة PT" : "PT Session Rate",
    compensationModel: locale === "ar" ? "نموذج التعويض" : "Compensation Model",
    years: locale === "ar" ? "سنوات" : "years",
    na: locale === "ar" ? "غير محدد" : "N/A",
    noCertifications: locale === "ar" ? "لا توجد شهادات" : "No certifications",
    noSpecializations: locale === "ar" ? "لا توجد تخصصات" : "No specializations",

    // Toast
    activatedSuccess: locale === "ar" ? "تم تفعيل المدرب بنجاح" : "Trainer activated successfully",
    deactivatedSuccess: locale === "ar" ? "تم إلغاء تفعيل المدرب بنجاح" : "Trainer deactivated successfully",
    onLeaveSuccess: locale === "ar" ? "تم وضع المدرب في إجازة بنجاح" : "Trainer set on leave successfully",
    actionError: locale === "ar" ? "حدث خطأ أثناء تنفيذ العملية" : "Error performing action",
    // Loading states
    activating: locale === "ar" ? "جاري التفعيل..." : "Activating...",
    deactivating: locale === "ar" ? "جاري إلغاء التفعيل..." : "Deactivating...",
    settingOnLeave: locale === "ar" ? "جاري وضع الإجازة..." : "Setting on leave...",
  };

  const COMPENSATION_LABELS: Record<string, { en: string; ar: string }> = {
    HOURLY: { en: "Hourly", ar: "بالساعة" },
    PER_SESSION: { en: "Per Session", ar: "لكل جلسة" },
    REVENUE_SHARE: { en: "Revenue Share", ar: "حصة الإيرادات" },
    SALARY_PLUS_COMMISSION: { en: "Salary + Commission", ar: "راتب + عمولة" },
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

  const name = getLocalizedText(trainer.displayName, locale) || texts.na;
  const initials = name.slice(0, 2).toUpperCase();
  const bio = getLocalizedText(trainer.bio, locale);
  const canActivate = trainer.status === "INACTIVE" || trainer.status === "ON_LEAVE";
  const canDeactivate = trainer.status === "ACTIVE";
  const canSetOnLeave = trainer.status === "ACTIVE";

  // Check if any action is pending to disable all buttons
  const isAnyActionPending =
    activateTrainer.isPending ||
    deactivateTrainer.isPending ||
    setOnLeave.isPending;

  const handleActivate = () => {
    activateTrainer.mutate(id, {
      onSuccess: () => toast({ title: texts.activatedSuccess }),
      onError: () => toast({ title: texts.actionError, variant: "destructive" }),
    });
  };

  const handleDeactivate = () => {
    deactivateTrainer.mutate(id, {
      onSuccess: () => toast({ title: texts.deactivatedSuccess }),
      onError: () => toast({ title: texts.actionError, variant: "destructive" }),
    });
  };

  const handleSetOnLeave = () => {
    setOnLeave.mutate(id, {
      onSuccess: () => toast({ title: texts.onLeaveSuccess }),
      onError: () => toast({ title: texts.actionError, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/trainers`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={trainer.profileImageUrl || undefined} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
                <TrainerStatusBadge status={trainer.status} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <TrainerTypeBadge type={trainer.trainerType} showIcon />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canActivate && (
            <LoadingButton
              variant="outline"
              onClick={handleActivate}
              isLoading={activateTrainer.isPending}
              disabled={isAnyActionPending}
              loadingText={texts.activating}
            >
              <CheckCircle className="me-2 h-4 w-4" />
              {texts.activate}
            </LoadingButton>
          )}
          {canSetOnLeave && (
            <LoadingButton
              variant="outline"
              onClick={handleSetOnLeave}
              isLoading={setOnLeave.isPending}
              disabled={isAnyActionPending}
              loadingText={texts.settingOnLeave}
            >
              <Briefcase className="me-2 h-4 w-4" />
              {texts.setOnLeave}
            </LoadingButton>
          )}
          {canDeactivate && (
            <LoadingButton
              variant="outline"
              onClick={handleDeactivate}
              isLoading={deactivateTrainer.isPending}
              disabled={isAnyActionPending}
              loadingText={texts.deactivating}
            >
              <Power className="me-2 h-4 w-4" />
              {texts.deactivate}
            </LoadingButton>
          )}
          <Button asChild disabled={isAnyActionPending}>
            <Link href={`/${locale}/trainers/${id}/edit`}>
              <Edit className="me-2 h-4 w-4" />
              {texts.edit}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.profileInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bio && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">{texts.bio}</p>
                <p className="mt-1">{bio}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{texts.experienceYears}:</span>
              <span>
                {trainer.experienceYears
                  ? `${trainer.experienceYears} ${texts.years}`
                  : texts.na}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.contactInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{trainer.userEmail || texts.na}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{trainer.phone || texts.na}</span>
            </div>
          </CardContent>
        </Card>

        {/* Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.qualifications}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{texts.specializations}</p>
              {trainer.specializations && trainer.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {trainer.specializations.map((spec, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{texts.noSpecializations}</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{texts.certifications}</p>
              {trainer.certifications && trainer.certifications.length > 0 ? (
                <div className="space-y-2">
                  {trainer.certifications.map((cert, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-600" />
                      <span>{cert.name}</span>
                      {cert.issuedBy && (
                        <span className="text-sm text-muted-foreground">({cert.issuedBy})</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{texts.noCertifications}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.compensation}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{texts.hourlyRate}:</span>
              <span>{trainer.hourlyRate ? `${trainer.hourlyRate} SAR` : texts.na}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{texts.ptSessionRate}:</span>
              <span>{trainer.ptSessionRate ? `${trainer.ptSessionRate} SAR` : texts.na}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{texts.compensationModel}:</span>
              <span>
                {trainer.compensationModel
                  ? locale === "ar"
                    ? COMPENSATION_LABELS[trainer.compensationModel]?.ar
                    : COMPENSATION_LABELS[trainer.compensationModel]?.en
                  : texts.na}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
