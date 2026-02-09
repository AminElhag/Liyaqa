import { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/stores/toast-store";
import { WizardStepper } from "./wizard-stepper";
import {
  OrganizationStep,
  ClubStep,
  AdminStep,
  SubscriptionStep,
  ReviewStep,
  onboardingSchema,
  STEP_REQUIRED_FIELDS,
  WIZARD_STEPS,
} from "./client-onboarding-steps";
import type { OnboardingFormValues } from "./client-onboarding-steps";
import type { OrganizationType } from "@/types/organization";
import type { BillingCycle, OnboardClientRequest } from "@/types";
import { cn } from "@/lib/utils";

interface ClientOnboardingWizardProps {
  onSubmit: (data: OnboardClientRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

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

export function ClientOnboardingWizard({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ClientOnboardingWizardProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const isRtl = locale === "ar";
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const form = useForm<OnboardingFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: {
      // Organization
      organizationNameEn: "",
      organizationNameAr: "",
      organizationTradeNameEn: "",
      organizationTradeNameAr: "",
      organizationType: "",
      organizationEmail: "",
      organizationPhone: "",
      organizationWebsite: "",
      vatRegistrationNumber: "",
      commercialRegistrationNumber: "",
      // Club
      clubNameEn: "",
      clubNameAr: "",
      clubDescriptionEn: "",
      clubDescriptionAr: "",
      clubSlug: "",
      // Admin
      adminEmail: "",
      adminPassword: "",
      adminDisplayNameEn: "",
      adminDisplayNameAr: "",
      // Subscription
      createSubscription: false,
      clientPlanId: "",
      agreedPriceAmount: 0,
      agreedPriceCurrency: "SAR",
      billingCycle: "MONTHLY",
      contractMonths: 12,
      startWithTrial: false,
      trialDays: 14,
      discountPercentage: 0,
    },
  });

  const { trigger, watch, handleSubmit } = form;

  const texts = {
    back: locale === "ar" ? "\u0627\u0644\u0633\u0627\u0628\u0642" : "Back",
    next: locale === "ar" ? "\u0627\u0644\u062A\u0627\u0644\u064A" : "Next",
    cancel: locale === "ar" ? "\u0625\u0644\u063A\u0627\u0621" : "Cancel",
    create: locale === "ar" ? "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0639\u0645\u064A\u0644" : "Create Client",
    creating: locale === "ar" ? "\u062C\u0627\u0631\u064A \u0627\u0644\u0625\u0646\u0634\u0627\u0621..." : "Creating...",
    validationError: locale === "ar" ? "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062D\u0642\u0642" : "Validation Error",
    pleaseFixErrors:
      locale === "ar"
        ? "\u064A\u0631\u062C\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u062A\u0627\u0644\u064A\u0629"
        : "Please review and fix the following fields",
  };

  // Handle validation errors when form submission fails
  const handleInvalid = (errors: FieldErrors<OnboardingFormValues>) => {
    const errorFields = Object.keys(errors);
    const firstErrorField = errorFields[0];
    const firstError = errors[firstErrorField as keyof OnboardingFormValues];

    toast.error(firstError?.message || texts.pleaseFixErrors);

    // Navigate to the step containing the first error
    if (firstErrorField) {
      const stepIndex = getStepForField(firstErrorField);
      if (stepIndex !== currentStep) {
        setDirection(stepIndex > currentStep ? 1 : -1);
        setCurrentStep(stepIndex);
      }
    }
  };

  // Get which step a field belongs to
  const getStepForField = (fieldName: string): number => {
    if (fieldName.startsWith("organization")) return 0;
    if (fieldName.startsWith("club")) return 1;
    if (fieldName.startsWith("admin")) return 2;
    return 3; // subscription fields
  };

  // Validate current step before proceeding
  const validateCurrentStep = async (): Promise<boolean> => {
    const requiredFields = STEP_REQUIRED_FIELDS[currentStep] || [];

    // Special case for subscription step
    if (currentStep === 3) {
      const createSubscription = watch("createSubscription");
      if (createSubscription) {
        const clientPlanId = watch("clientPlanId");
        if (!clientPlanId) {
          // Trigger validation error for clientPlanId
          return trigger("clientPlanId");
        }
      }
      return true;
    }

    if (requiredFields.length === 0) return true;

    const result = await trigger(requiredFields);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      setDirection(-1);
      setCurrentStep(stepIndex);
    }
  };

  const handleEditStep = (stepIndex: number) => {
    setDirection(-1);
    setCurrentStep(stepIndex);
  };

  const handleFormSubmit = (data: OnboardingFormValues) => {
    const request: OnboardClientRequest = {
      organizationNameEn: data.organizationNameEn,
      organizationNameAr: data.organizationNameAr || undefined,
      organizationTradeNameEn: data.organizationTradeNameEn || undefined,
      organizationTradeNameAr: data.organizationTradeNameAr || undefined,
      organizationType: (data.organizationType as OrganizationType) || undefined,
      organizationEmail: data.organizationEmail || undefined,
      organizationPhone: data.organizationPhone || undefined,
      organizationWebsite: data.organizationWebsite || undefined,
      vatRegistrationNumber: data.vatRegistrationNumber || undefined,
      commercialRegistrationNumber: data.commercialRegistrationNumber || undefined,
      clubNameEn: data.clubNameEn,
      clubNameAr: data.clubNameAr || undefined,
      clubDescriptionEn: data.clubDescriptionEn || undefined,
      clubDescriptionAr: data.clubDescriptionAr || undefined,
      clubSlug: data.clubSlug || undefined,
      adminEmail: data.adminEmail,
      adminPassword: data.adminPassword,
      adminDisplayNameEn: data.adminDisplayNameEn,
      adminDisplayNameAr: data.adminDisplayNameAr || undefined,
    };

    // Add subscription details if enabled
    if (data.createSubscription && data.clientPlanId) {
      request.clientPlanId = data.clientPlanId;
      request.agreedPriceAmount = data.agreedPriceAmount;
      request.agreedPriceCurrency = data.agreedPriceCurrency;
      request.billingCycle = data.billingCycle as BillingCycle;
      request.contractMonths = data.contractMonths;
      request.startWithTrial = data.startWithTrial;
      request.trialDays = data.trialDays || 14;
      request.discountPercentage = data.discountPercentage;
    }

    onSubmit(request);
  };

  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Prevent Enter key from submitting the form on non-final steps
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !isLastStep) {
      e.preventDefault();
    }
  };

  // Map steps to the WizardStepper format
  const wizardSteps = WIZARD_STEPS.map((step) => ({
    id: step.id,
    title: step.title,
    titleAr: step.titleAr,
    description: step.description,
    descriptionAr: step.descriptionAr,
    color: step.color,
  }));

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <OrganizationStep form={form} locale={locale} />;
      case 1:
        return <ClubStep form={form} locale={locale} />;
      case 2:
        return <AdminStep form={form} locale={locale} />;
      case 3:
        return <SubscriptionStep form={form} locale={locale} />;
      case 4:
        return <ReviewStep form={form} locale={locale} onEditStep={handleEditStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <WizardStepper
        steps={wizardSteps}
        currentStep={currentStep}
        locale={locale}
        onStepClick={handleStepClick}
        allowClickPrevious
      />

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit, handleInvalid)} onKeyDown={handleKeyDown}>
        {/* Step Content with Animation */}
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
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div
          className={cn(
            "flex items-center justify-between mt-8 pt-6 border-t",
            isRtl && "flex-row-reverse"
          )}
        >
          {/* Cancel / Back */}
          <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
            {isFirstStep ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                {texts.cancel}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="gap-2"
              >
                {isRtl ? (
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
            )}
          </div>

          {/* Next / Submit */}
          {isLastStep ? (
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700",
                "shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {texts.creating}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {texts.create}
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className="gap-2"
            >
              {isRtl ? (
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
      </form>
    </div>
  );
}
