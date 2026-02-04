"use client";

import { useLocale } from "next-intl";
import { format, differenceInDays } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  Mail,
  MapPin,
  Activity,
  Dumbbell,
  Smartphone,
  Camera,
  Phone,
  TrendingUp,
  Award,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useMemberOnboarding, useCompleteOnboardingStep, useSkipOnboardingStep } from "@liyaqa/shared/queries/use-onboarding";
import type { OnboardingStep, StepStatus, StepCompletionStatus } from "@liyaqa/shared/lib/api/onboarding";

interface OnboardingChecklistProps {
  memberId: string;
  memberJoinDate?: string;
}

const stepConfig: Record<
  OnboardingStep,
  { icon: React.ReactNode; labelEn: string; labelAr: string; descriptionEn: string; descriptionAr: string }
> = {
  WELCOME_EMAIL: {
    icon: <Mail className="h-4 w-4" />,
    labelEn: "Welcome Email",
    labelAr: "رسالة الترحيب",
    descriptionEn: "Send welcome email with app download link",
    descriptionAr: "إرسال بريد ترحيب مع رابط تحميل التطبيق",
  },
  FACILITY_TOUR: {
    icon: <MapPin className="h-4 w-4" />,
    labelEn: "Facility Tour",
    labelAr: "جولة المنشأة",
    descriptionEn: "Complete facility orientation tour",
    descriptionAr: "إكمال جولة تعريفية بالمنشأة",
  },
  FITNESS_ASSESSMENT: {
    icon: <Activity className="h-4 w-4" />,
    labelEn: "Fitness Assessment",
    labelAr: "تقييم اللياقة",
    descriptionEn: "Schedule and complete initial fitness assessment",
    descriptionAr: "جدولة وإكمال تقييم اللياقة الأولي",
  },
  FIRST_WORKOUT: {
    icon: <Dumbbell className="h-4 w-4" />,
    labelEn: "First Workout",
    labelAr: "التمرين الأول",
    descriptionEn: "Member completes their first workout",
    descriptionAr: "إكمال العضو لتمرينه الأول",
  },
  APP_SETUP: {
    icon: <Smartphone className="h-4 w-4" />,
    labelEn: "App Setup",
    labelAr: "إعداد التطبيق",
    descriptionEn: "Help member download and set up mobile app",
    descriptionAr: "مساعدة العضو في تحميل وإعداد التطبيق",
  },
  PROFILE_PHOTO: {
    icon: <Camera className="h-4 w-4" />,
    labelEn: "Profile Photo",
    labelAr: "صورة الملف الشخصي",
    descriptionEn: "Upload member profile photo",
    descriptionAr: "رفع صورة الملف الشخصي للعضو",
  },
  DAY7_CHECKIN: {
    icon: <Phone className="h-4 w-4" />,
    labelEn: "Day 7 Check-in",
    labelAr: "متابعة اليوم السابع",
    descriptionEn: "Follow-up call after one week",
    descriptionAr: "مكالمة متابعة بعد أسبوع",
  },
  DAY14_PROGRESS: {
    icon: <TrendingUp className="h-4 w-4" />,
    labelEn: "Day 14 Progress",
    labelAr: "تقدم اليوم الرابع عشر",
    descriptionEn: "Review progress after two weeks",
    descriptionAr: "مراجعة التقدم بعد أسبوعين",
  },
  DAY30_REVIEW: {
    icon: <Award className="h-4 w-4" />,
    labelEn: "Day 30 Review",
    labelAr: "مراجعة اليوم الثلاثين",
    descriptionEn: "Complete onboarding review and goal check",
    descriptionAr: "إكمال مراجعة الإعداد وفحص الأهداف",
  },
};

const statusColors: Record<StepCompletionStatus, { icon: React.ReactNode; color: string }> = {
  PENDING: { icon: <Circle className="h-5 w-5" />, color: "text-gray-400" },
  IN_PROGRESS: { icon: <Clock className="h-5 w-5" />, color: "text-blue-500" },
  COMPLETED: { icon: <CheckCircle2 className="h-5 w-5" />, color: "text-green-500" },
  SKIPPED: { icon: <XCircle className="h-5 w-5" />, color: "text-yellow-500" },
};

export function OnboardingChecklist({ memberId, memberJoinDate }: OnboardingChecklistProps) {
  const locale = useLocale();
  const { data: onboarding, isLoading } = useMemberOnboarding(memberId);
  const completeStepMutation = useCompleteOnboardingStep();
  const skipStepMutation = useSkipOnboardingStep();

  const texts = {
    title: locale === "ar" ? "قائمة الإعداد" : "Onboarding Checklist",
    progress: locale === "ar" ? "التقدم" : "Progress",
    complete: locale === "ar" ? "إكمال" : "Complete",
    skip: locale === "ar" ? "تخطي" : "Skip",
    completed: locale === "ar" ? "مكتمل" : "Completed",
    skipped: locale === "ar" ? "تم التخطي" : "Skipped",
    inProgress: locale === "ar" ? "قيد التنفيذ" : "In Progress",
    pending: locale === "ar" ? "قيد الانتظار" : "Pending",
    onboardingComplete: locale === "ar" ? "اكتمل الإعداد!" : "Onboarding Complete!",
    daysInOnboarding: locale === "ar" ? "أيام في الإعداد" : "Days in onboarding",
    assignedTo: locale === "ar" ? "مسند إلى" : "Assigned to",
    noOnboarding: locale === "ar" ? "لا يوجد سجل إعداد" : "No onboarding record",
    newMember: locale === "ar" ? "عضو جديد" : "New Member",
  };

  const handleComplete = (step: OnboardingStep) => {
    completeStepMutation.mutate({
      memberId,
      request: { step, notes: undefined },
    });
  };

  const handleSkip = (step: OnboardingStep, reason: string) => {
    skipStepMutation.mutate({
      memberId,
      request: { step, reason },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!onboarding) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            {texts.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">{texts.noOnboarding}</div>
        </CardContent>
      </Card>
    );
  }

  const steps = Object.entries(onboarding.steps) as [OnboardingStep, StepStatus][];
  const completedCount = steps.filter(
    ([, stepStatus]) => stepStatus.status === "COMPLETED" || stepStatus.status === "SKIPPED"
  ).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const daysInOnboarding = memberJoinDate
    ? differenceInDays(new Date(), new Date(memberJoinDate))
    : onboarding.startedAt
    ? differenceInDays(new Date(), new Date(onboarding.startedAt))
    : 0;
  const isComplete = onboarding.completedAt !== null;

  return (
    <Card className={isComplete ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            {texts.title}
            <Badge variant="secondary" className="ml-2">
              {texts.newMember}
            </Badge>
          </CardTitle>
          {!isComplete && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {daysInOnboarding} {texts.daysInOnboarding}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{texts.progress}</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {isComplete ? (
          <div className="flex items-center justify-center gap-2 py-4 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
            <span className="font-medium text-lg">{texts.onboardingComplete}</span>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map(([step, stepStatus]) => {
              const config = stepConfig[step];
              const statusColor = statusColors[stepStatus.status];

              return (
                <div
                  key={step}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    stepStatus.status === "COMPLETED"
                      ? "bg-green-50 dark:bg-green-950/20"
                      : stepStatus.status === "SKIPPED"
                      ? "bg-yellow-50 dark:bg-yellow-950/20"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={statusColor.color}>{statusColor.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span className="font-medium text-sm">
                          {locale === "ar" ? config.labelAr : config.labelEn}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "ar" ? config.descriptionAr : config.descriptionEn}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {stepStatus.status === "COMPLETED" && (
                      <Badge variant="outline" className="text-green-600">
                        {texts.completed}
                      </Badge>
                    )}
                    {stepStatus.status === "SKIPPED" && (
                      <Badge variant="outline" className="text-yellow-600">
                        {texts.skipped}
                      </Badge>
                    )}
                    {(stepStatus.status === "PENDING" || stepStatus.status === "IN_PROGRESS") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSkip(step, "Skipped by staff")}
                          disabled={skipStepMutation.isPending}
                        >
                          {texts.skip}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleComplete(step)}
                          disabled={completeStepMutation.isPending}
                        >
                          {texts.complete}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {onboarding.assignedToName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <User className="h-4 w-4" />
            <span>
              {texts.assignedTo}: {onboarding.assignedToName}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
