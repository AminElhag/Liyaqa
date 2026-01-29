"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Clock,
  Users,
  CreditCard,
  UserPlus,
  Dumbbell,
  CheckCircle2,
  Sparkles,
  Trophy,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

export type OnboardingStep =
  | "ACCOUNT_CREATED"
  | "EMAIL_VERIFIED"
  | "PROFILE_COMPLETED"
  | "FIRST_LOCATION_ADDED"
  | "MEMBERSHIP_PLANS_CREATED"
  | "FIRST_MEMBER_ADDED"
  | "PAYMENT_GATEWAY_CONNECTED"
  | "ACCESS_CONTROL_CONFIGURED"
  | "STAFF_INVITED"
  | "MOBILE_APP_CONFIGURED";

interface WizardStep {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ComponentType<{ className?: string }>;
  points: number;
  onboardingStep?: OnboardingStep;
  color: string;
  estimatedTime: string;
  estimatedTimeAr: string;
}

interface FacilitySetupWizardProps {
  completedSteps: OnboardingStep[];
  totalPoints: number;
  onStepComplete: (step: OnboardingStep) => Promise<void>;
}

// ============================================
// STEP DEFINITIONS
// ============================================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "business-info",
    title: "Business Information",
    titleAr: "معلومات النشاط التجاري",
    description: "Set up your gym name, address, and contact details",
    descriptionAr: "إعداد اسم الصالة الرياضية والعنوان وتفاصيل الاتصال",
    icon: Building2,
    points: 10,
    onboardingStep: "PROFILE_COMPLETED",
    color: "from-blue-500 to-blue-600",
    estimatedTime: "5 min",
    estimatedTimeAr: "5 دقائق",
  },
  {
    id: "operating-hours",
    title: "Operating Hours",
    titleAr: "ساعات العمل",
    description: "Configure your daily operating hours and prayer times",
    descriptionAr: "تكوين ساعات العمل اليومية وأوقات الصلاة",
    icon: Clock,
    points: 15,
    onboardingStep: "FIRST_LOCATION_ADDED",
    color: "from-emerald-500 to-emerald-600",
    estimatedTime: "10 min",
    estimatedTimeAr: "10 دقائق",
  },
  {
    id: "membership-categories",
    title: "Membership Categories",
    titleAr: "فئات العضوية",
    description: "Create categories like Individual, Family, Student, and VIP",
    descriptionAr: "إنشاء فئات مثل فردي وعائلي وطالب وكبار الشخصيات",
    icon: Users,
    points: 15,
    color: "from-violet-500 to-violet-600",
    estimatedTime: "15 min",
    estimatedTimeAr: "15 دقيقة",
  },
  {
    id: "membership-plans",
    title: "Membership Plans",
    titleAr: "خطط العضوية",
    description: "Set up your pricing plans and subscription options",
    descriptionAr: "إعداد خطط الأسعار وخيارات الاشتراك",
    icon: CreditCard,
    points: 20,
    onboardingStep: "MEMBERSHIP_PLANS_CREATED",
    color: "from-amber-500 to-amber-600",
    estimatedTime: "20 min",
    estimatedTimeAr: "20 دقيقة",
  },
  {
    id: "staff-roles",
    title: "Staff & Roles",
    titleAr: "الموظفون والأدوار",
    description: "Add trainers, front desk staff, and configure permissions",
    descriptionAr: "إضافة المدربين وموظفي الاستقبال وتكوين الأذونات",
    icon: UserPlus,
    points: 10,
    onboardingStep: "STAFF_INVITED",
    color: "from-pink-500 to-pink-600",
    estimatedTime: "15 min",
    estimatedTimeAr: "15 دقيقة",
  },
  {
    id: "facilities-equipment",
    title: "Facilities & Equipment",
    titleAr: "المرافق والمعدات",
    description: "Configure pools, studios, and equipment tracking",
    descriptionAr: "تكوين حمامات السباحة والاستوديوهات وتتبع المعدات",
    icon: Dumbbell,
    points: 15,
    onboardingStep: "ACCESS_CONTROL_CONFIGURED",
    color: "from-cyan-500 to-cyan-600",
    estimatedTime: "20 min",
    estimatedTimeAr: "20 دقيقة",
  },
  {
    id: "payment-setup",
    title: "Payment Setup",
    titleAr: "إعداد الدفع",
    description: "Connect your bank account and payment gateways",
    descriptionAr: "ربط حسابك المصرفي وبوابات الدفع",
    icon: CreditCard,
    points: 20,
    onboardingStep: "PAYMENT_GATEWAY_CONNECTED",
    color: "from-green-500 to-green-600",
    estimatedTime: "10 min",
    estimatedTimeAr: "10 دقائق",
  },
  {
    id: "go-live",
    title: "Go-Live Checklist",
    titleAr: "قائمة التحقق للإطلاق",
    description: "Final verification before launching your gym",
    descriptionAr: "التحقق النهائي قبل إطلاق صالتك الرياضية",
    icon: CheckCircle2,
    points: 15,
    onboardingStep: "MOBILE_APP_CONFIGURED",
    color: "from-purple-500 to-purple-600",
    estimatedTime: "5 min",
    estimatedTimeAr: "5 دقائق",
  },
];

// Feature unlock thresholds
const FEATURE_UNLOCKS = [
  { threshold: 60, feature: "Marketing Suite", featureAr: "أدوات التسويق" },
  { threshold: 90, feature: "Advanced Analytics", featureAr: "تحليلات متقدمة" },
  { threshold: 165, feature: "API Access", featureAr: "وصول API" },
];

// ============================================
// ANIMATION VARIANTS
// ============================================

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

// ============================================
// COMPONENT
// ============================================

export function FacilitySetupWizard({
  completedSteps,
  totalPoints,
  onStepComplete,
}: FacilitySetupWizardProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Calculate overall progress
  const maxPoints = WIZARD_STEPS.reduce((sum, step) => sum + step.points, 0);
  const progressPercent = Math.round((totalPoints / maxPoints) * 100);

  // Check if step is completed
  const isStepCompleted = (step: WizardStep) => {
    if (!step.onboardingStep) return false;
    return completedSteps.includes(step.onboardingStep);
  };

  // Get next incomplete step
  useEffect(() => {
    const nextIncomplete = WIZARD_STEPS.findIndex(
      (step) => !isStepCompleted(step)
    );
    if (nextIncomplete !== -1 && nextIncomplete !== currentStep) {
      setCurrentStep(nextIncomplete);
    }
  }, [completedSteps]);

  const handleNext = () => {
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepClick = (index: number) => {
    if (index < currentStep || isStepCompleted(WIZARD_STEPS[index])) {
      setDirection(index > currentStep ? 1 : -1);
      setCurrentStep(index);
    }
  };

  const handleCompleteStep = async () => {
    const step = WIZARD_STEPS[currentStep];
    if (!step.onboardingStep) return;

    setIsCompleting(true);
    try {
      await onStepComplete(step.onboardingStep);
      // Auto-advance to next step
      if (currentStep < WIZARD_STEPS.length - 1) {
        setTimeout(() => handleNext(), 500);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const currentWizardStep = WIZARD_STEPS[currentStep];
  const isCurrentStepCompleted = isStepCompleted(currentWizardStep);
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  const texts = {
    setupProgress: isArabic ? "تقدم الإعداد" : "Setup Progress",
    pointsEarned: isArabic ? "نقاط مكتسبة" : "Points Earned",
    step: isArabic ? "خطوة" : "Step",
    of: isArabic ? "من" : "of",
    back: isArabic ? "السابق" : "Back",
    next: isArabic ? "التالي" : "Next",
    markComplete: isArabic ? "وضع علامة مكتمل" : "Mark as Complete",
    completing: isArabic ? "جاري الإكمال..." : "Completing...",
    completed: isArabic ? "مكتمل" : "Completed",
    estimatedTime: isArabic ? "الوقت المقدر" : "Est. time",
    featureUnlocks: isArabic ? "إلغاء قفل الميزات" : "Feature Unlocks",
    unlocked: isArabic ? "تم فتح القفل" : "Unlocked",
    locked: isArabic ? "مقفل" : "Locked",
    congratulations: isArabic ? "تهانينا!" : "Congratulations!",
    allComplete: isArabic
      ? "لقد أكملت جميع خطوات الإعداد!"
      : "You've completed all setup steps!",
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">{texts.setupProgress}</h2>
              <p className="text-sm text-muted-foreground">
                {texts.step} {currentStep + 1} {texts.of} {WIZARD_STEPS.length}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="text-lg font-bold">{totalPoints}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {texts.pointsEarned}
              </p>
            </div>
          </div>

          <Progress value={progressPercent} className="h-2" />

          {/* Feature Unlocks */}
          <div className="mt-4 flex flex-wrap gap-2">
            {FEATURE_UNLOCKS.map((unlock) => {
              const isUnlocked = totalPoints >= unlock.threshold;
              return (
                <Badge
                  key={unlock.threshold}
                  variant={isUnlocked ? "default" : "secondary"}
                  className={cn(
                    "gap-1",
                    isUnlocked && "bg-green-500 hover:bg-green-600"
                  )}
                >
                  {isUnlocked ? (
                    <Unlock className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  {isArabic ? unlock.featureAr : unlock.feature}
                  {!isUnlocked && (
                    <span className="text-xs opacity-75">
                      ({unlock.threshold}pts)
                    </span>
                  )}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Indicators */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {WIZARD_STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const completed = isStepCompleted(step);
          const isCurrent = index === currentStep;

          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(index)}
              disabled={index > currentStep && !completed}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                isCurrent && "border-primary bg-primary/5",
                completed && "border-green-500 bg-green-50",
                !isCurrent &&
                  !completed &&
                  index <= currentStep &&
                  "border-border hover:border-primary/50",
                index > currentStep &&
                  !completed &&
                  "opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  completed && "bg-green-500 text-white",
                  isCurrent && !completed && `bg-gradient-to-br ${step.color} text-white`,
                  !isCurrent && !completed && "bg-muted"
                )}
              >
                {completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:inline",
                  isCurrent && "text-primary",
                  completed && "text-green-600"
                )}
              >
                {isArabic ? step.titleAr : step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      `bg-gradient-to-br ${currentWizardStep.color} text-white`
                    )}
                  >
                    <currentWizardStep.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>
                      {isArabic
                        ? currentWizardStep.titleAr
                        : currentWizardStep.title}
                    </CardTitle>
                    <CardDescription>
                      {isArabic
                        ? currentWizardStep.descriptionAr
                        : currentWizardStep.description}
                    </CardDescription>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {isArabic
                      ? currentWizardStep.estimatedTimeAr
                      : currentWizardStep.estimatedTime}
                  </Badge>
                  <div className="mt-1">
                    <Badge className={cn("gap-1", `bg-gradient-to-br ${currentWizardStep.color}`)}>
                      +{currentWizardStep.points} pts
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Step-specific content would go here */}
              {isCurrentStepCompleted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-600 mb-2">
                    {texts.completed}
                  </h3>
                  <p className="text-muted-foreground">
                    {isArabic
                      ? "تم إكمال هذه الخطوة بنجاح"
                      : "This step has been completed successfully"}
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-6">
                    {isArabic
                      ? "أكمل هذه الخطوة للحصول على النقاط والمتابعة"
                      : "Complete this step to earn points and continue"}
                  </p>
                  <Button
                    onClick={handleCompleteStep}
                    disabled={isCompleting}
                    className={cn(
                      "gap-2",
                      `bg-gradient-to-br ${currentWizardStep.color} hover:opacity-90`
                    )}
                  >
                    {isCompleting ? (
                      texts.completing
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {texts.markComplete}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className={cn("flex items-center justify-between", isArabic && "flex-row-reverse")}>
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep}
          className="gap-2"
        >
          {isArabic ? (
            <>
              {texts.back}
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4" />
              {texts.back}
            </>
          )}
        </Button>

        {isLastStep && progressPercent >= 100 ? (
          <div className="flex items-center gap-2 text-green-600">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">{texts.congratulations}</span>
          </div>
        ) : (
          <Button onClick={handleNext} disabled={isLastStep} className="gap-2">
            {isArabic ? (
              <>
                <ArrowLeft className="h-4 w-4" />
                {texts.next}
              </>
            ) : (
              <>
                {texts.next}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
