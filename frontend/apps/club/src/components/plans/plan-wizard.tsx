"use client";

import { useState, useCallback, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import {
  Alert,
  AlertDescription,
} from "@liyaqa/shared/components/ui/alert";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api/client";
import { useCreatePlan, useUpdatePlan } from "@liyaqa/shared/queries/use-plans";
import { ArrowLeft, ArrowRight, Loader2, Save, AlertTriangle } from "lucide-react";
import { EnrollmentStepIndicator } from "@/components/enrollment/enrollment-step-indicator";
import { PlanTypeSelector } from "./plan-type-selector";
import { IdentityPricingStep } from "./steps/identity-pricing-step";
import { FeaturesStep } from "./steps/features-step";
import { EligibilityContractStep } from "./steps/eligibility-contract-step";
import { ReviewStep } from "./steps/review-step";
import {
  planWizardSchema,
  getStepsForType,
  getDefaultValues,
  type PlanWizardFormData,
} from "./plan-schemas";
import type { MembershipPlan, MembershipPlanType } from "@liyaqa/shared/types/member";
import type { CreatePlanRequest } from "@liyaqa/shared/lib/api/plans";

interface PlanWizardProps {
  plan?: MembershipPlan;
}

export function PlanWizard({ plan }: PlanWizardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!plan;

  const [planType, setPlanType] = useState<MembershipPlanType | null>(
    plan?.planType ?? null
  );
  const [currentStep, setCurrentStep] = useState(0);

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const isSubmitting = createPlan.isPending || updatePlan.isPending;

  const form = useForm<PlanWizardFormData>({
    resolver: zodResolver(planWizardSchema),
    defaultValues: plan
      ? mapPlanToFormData(plan)
      : planType
        ? getDefaultValues(planType)
        : getDefaultValues("RECURRING"),
  });

  // Reset form when plan type is selected
  useEffect(() => {
    if (planType && !isEditMode) {
      form.reset(getDefaultValues(planType));
      setCurrentStep(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planType, isEditMode]);

  const steps = planType ? getStepsForType(planType) : [];
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  // Per-step validation
  const validateCurrentStep = useCallback((): boolean => {
    const values = form.getValues();
    switch (currentStep) {
      case 0: // Identity & Pricing
        return !!values.nameEn;
      case 1: // Features
        return true;
      case 2: // Eligibility or Review (depends on type)
        return true;
      case 3: // Review (for types with contract step)
        return true;
      default:
        return true;
    }
  }, [currentStep, form]);

  const goNext = useCallback(() => {
    if (!validateCurrentStep()) {
      toast({
        title: isAr ? "يرجى ملء الحقول المطلوبة" : "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, totalSteps, validateCurrentStep, toast, isAr]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!planType) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (isLastStep) {
          handleSubmit();
        } else {
          goNext();
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, planType, isLastStep]);

  const handleSubmit = async () => {
    const values = form.getValues();

    const payload: CreatePlanRequest = {
      name: { en: values.nameEn, ar: values.nameAr || undefined },
      description: values.descriptionEn
        ? { en: values.descriptionEn, ar: values.descriptionAr || undefined }
        : undefined,
      planType: planType!,
      status: isEditMode ? undefined : values.saveAs === "draft" ? "DRAFT" : "ACTIVE",
      membershipFee: {
        amount: values.membershipFee.amount,
        currency: values.membershipFee.currency,
        taxRate: values.membershipFee.taxRate,
      },
      administrationFee: {
        amount: values.administrationFee.amount,
        currency: values.administrationFee.currency,
        taxRate: values.administrationFee.taxRate,
      },
      joinFee: {
        amount: values.joinFee.amount,
        currency: values.joinFee.currency,
        taxRate: values.joinFee.taxRate,
      },
      billingPeriod: values.billingPeriod,
      durationDays: values.durationDays ?? undefined,
      maxClassesPerPeriod: values.maxClassesPerPeriod ?? undefined,
      classAccessLevel: values.classAccessLevel,
      eligibleClassCategories: values.eligibleClassCategories || undefined,
      // PT access
      ptAccessLevel: values.ptAccessLevel,
      maxPtSessionsPerPeriod: values.maxPtSessionsPerPeriod ?? undefined,
      ptSessionsIncluded: values.ptSessionsIncluded ?? undefined,
      hasGuestPasses: values.hasGuestPasses,
      guestPassesCount: values.guestPassesCount,
      hasLockerAccess: values.hasLockerAccess,
      hasSaunaAccess: values.hasSaunaAccess,
      hasPoolAccess: values.hasPoolAccess,
      freezeDaysAllowed: values.freezeDaysAllowed,
      isActive: isEditMode ? undefined : values.saveAs === "active",
      sortOrder: values.sortOrder,
      // Contract config
      contractType: values.contractType as CreatePlanRequest["contractType"],
      supportedTerms: values.supportedTerms as CreatePlanRequest["supportedTerms"],
      defaultCommitmentMonths: values.defaultCommitmentMonths,
      minimumCommitmentMonths: values.minimumCommitmentMonths ?? undefined,
      defaultNoticePeriodDays: values.defaultNoticePeriodDays,
      earlyTerminationFeeType: values.earlyTerminationFeeType as CreatePlanRequest["earlyTerminationFeeType"],
      earlyTerminationFeeValue: values.earlyTerminationFeeValue ?? undefined,
      coolingOffDays: values.coolingOffDays,
      // Availability
      availableFrom: values.availableFrom || undefined,
      availableUntil: values.availableUntil || undefined,
      minimumAge: values.minimumAge ?? undefined,
      maximumAge: values.maximumAge ?? undefined,
      // Class pack
      sessionCount: values.sessionCount ?? undefined,
      expiryDays: values.expiryDays ?? undefined,
      // Trial
      convertsToPlanId: values.convertsToPlanId || undefined,
    };

    try {
      if (isEditMode && plan) {
        await updatePlan.mutateAsync({ id: plan.id, data: payload });
        toast({
          title: isAr ? "تم الحفظ" : "Saved",
          description: isAr ? "تم حفظ التغييرات بنجاح" : "Changes saved successfully",
        });
        router.push(`/${locale}/plans/${plan.id}`);
      } else {
        const result = await createPlan.mutateAsync(payload);
        toast({
          title: isAr ? "تم الإنشاء" : "Created",
          description: isAr ? "تم إنشاء الباقة بنجاح" : "Plan created successfully",
        });
        router.push(`/${locale}/plans/${result.id}`);
      }
    } catch (error) {
      const apiError = await parseApiError(error);
      toast({
        title: isAr ? "خطأ" : "Error",
        description: getLocalizedErrorMessage(apiError, locale),
        variant: "destructive",
      });
    }
  };

  // Type selection phase
  if (!planType) {
    return <PlanTypeSelector onSelect={setPlanType} />;
  }

  // Map step index to component
  const getStepComponent = (stepIndex: number) => {
    const hasContractStep = planType === "RECURRING" || planType === "TRIAL";

    if (stepIndex === 0) {
      return <IdentityPricingStep form={form} planType={planType} />;
    }
    if (stepIndex === 1) {
      return <FeaturesStep form={form} />;
    }
    if (hasContractStep && stepIndex === 2) {
      return <EligibilityContractStep form={form} />;
    }
    // Last step is always Review
    return <ReviewStep form={form} planType={planType} isEditMode={isEditMode} />;
  };

  const stepTexts = steps.map((s) => ({
    label: isAr ? s.labelAr : s.label,
    description: isAr ? s.descriptionAr : s.description,
  }));

  return (
    <div className="space-y-6">
      {/* Active plan warning */}
      {isEditMode && plan?.status === "ACTIVE" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {isAr
              ? "هذه الباقة نشطة. التغييرات في التسعير أو المميزات ستطبق على التسجيلات الجديدة فقط."
              : "This plan is active. Changes to pricing or features will apply to new enrollments only. Existing subscribers keep their contract terms."}
          </AlertDescription>
        </Alert>
      )}

      {/* Step indicator */}
      <EnrollmentStepIndicator
        steps={stepTexts}
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step < currentStep) setCurrentStep(step);
        }}
      />

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          {getStepComponent(currentStep)}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={currentStep === 0 || isSubmitting}
        >
          <ArrowLeft className="me-2 h-4 w-4" />
          {isAr ? "رجوع" : "Back"}
          <kbd className="ms-2 hidden rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            Esc
          </kbd>
        </Button>

        {isLastStep ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {isAr ? "جارٍ الحفظ..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="me-2 h-4 w-4" />
                {isEditMode
                  ? (isAr ? "حفظ التغييرات" : "Save Changes")
                  : (isAr ? "إنشاء الباقة" : "Create Plan")}
              </>
            )}
            <kbd className="ms-2 hidden rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] sm:inline">
              Ctrl+Enter
            </kbd>
          </Button>
        ) : (
          <Button type="button" onClick={goNext} disabled={isSubmitting}>
            {isAr ? "التالي" : "Next"}
            <ArrowRight className="ms-2 h-4 w-4" />
            <kbd className="ms-2 hidden rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] sm:inline">
              Ctrl+Enter
            </kbd>
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Map an existing MembershipPlan to wizard form data for edit mode.
 */
function mapPlanToFormData(plan: MembershipPlan): PlanWizardFormData {
  return {
    planType: plan.planType || "RECURRING",
    nameEn: plan.name.en || "",
    nameAr: plan.name.ar || "",
    descriptionEn: plan.description?.en || "",
    descriptionAr: plan.description?.ar || "",
    membershipFee: {
      amount: plan.membershipFee?.amount ?? 0,
      currency: plan.membershipFee?.currency ?? "SAR",
      taxRate: plan.membershipFee?.taxRate ?? 15,
    },
    administrationFee: {
      amount: plan.administrationFee?.amount ?? 0,
      currency: plan.administrationFee?.currency ?? "SAR",
      taxRate: plan.administrationFee?.taxRate ?? 15,
    },
    joinFee: {
      amount: plan.joinFee?.amount ?? 0,
      currency: plan.joinFee?.currency ?? "SAR",
      taxRate: plan.joinFee?.taxRate ?? 0,
    },
    billingPeriod: plan.billingPeriod || "MONTHLY",
    durationDays: plan.durationDays ?? null,
    sessionCount: plan.sessionCount ?? null,
    expiryDays: plan.expiryDays ?? null,
    convertsToPlanId: plan.convertsToPlanId || "",
    hasPoolAccess: plan.hasPoolAccess ?? false,
    hasSaunaAccess: plan.hasSaunaAccess ?? false,
    hasLockerAccess: plan.hasLockerAccess ?? false,
    maxClassesPerPeriod: plan.maxClassesPerPeriod ?? null,
    classAccessLevel: plan.classAccessLevel ?? "UNLIMITED",
    eligibleClassCategories: plan.eligibleClassCategories ?? null,
    hasGuestPasses: plan.hasGuestPasses ?? false,
    guestPassesCount: plan.guestPassesCount ?? 0,
    freezeDaysAllowed: plan.freezeDaysAllowed ?? 0,
    availableFrom: plan.availableFrom || "",
    availableUntil: plan.availableUntil || "",
    minimumAge: plan.minimumAge ?? null,
    maximumAge: plan.maximumAge ?? null,
    contractType: (plan.contractType as "MONTH_TO_MONTH" | "FIXED_TERM") || "MONTH_TO_MONTH",
    supportedTerms: plan.supportedTerms || ["MONTHLY"],
    defaultCommitmentMonths: plan.defaultCommitmentMonths ?? 1,
    minimumCommitmentMonths: plan.minimumCommitmentMonths ?? null,
    defaultNoticePeriodDays: plan.defaultNoticePeriodDays ?? 30,
    coolingOffDays: plan.coolingOffDays ?? 14,
    earlyTerminationFeeType: (plan.earlyTerminationFeeType as PlanWizardFormData["earlyTerminationFeeType"]) || "NONE",
    earlyTerminationFeeValue: plan.earlyTerminationFeeValue ?? null,
    // PT access
    ptAccessLevel: (plan.ptAccessLevel as PlanWizardFormData["ptAccessLevel"]) || "NO_ACCESS",
    maxPtSessionsPerPeriod: plan.maxPtSessionsPerPeriod ?? null,
    ptSessionsIncluded: plan.ptSessionsIncluded ?? null,
    saveAs: "active",
    sortOrder: plan.sortOrder ?? 0,
  };
}
