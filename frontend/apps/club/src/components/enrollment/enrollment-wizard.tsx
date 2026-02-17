"use client";

import { useState, useCallback, useEffect } from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api/client";
import { useCreateEnrollment } from "@liyaqa/shared/queries/use-enrollment";
import { ArrowLeft, ArrowRight, Loader2, UserPlus } from "lucide-react";
import { EnrollmentStepIndicator } from "./enrollment-step-indicator";
import { MemberStep } from "./steps/member-step";
import { PlanStep } from "./steps/plan-step";
import { ContractStep } from "./steps/contract-step";
import { PaymentStep } from "./steps/payment-step";
import { ReviewStep } from "./steps/review-step";
import { EnrollmentSuccess } from "./enrollment-success";
import { enrollmentFormSchema, type EnrollmentFormData } from "./enrollment-schemas";
import type { EnrollmentRequest } from "@liyaqa/shared/types/enrollment";
import type { EnrollmentResponse } from "@liyaqa/shared/types/enrollment";

const TOTAL_STEPS = 5;

interface EnrollmentWizardProps {
  existingMemberId?: string;
}

export function EnrollmentWizard({ existingMemberId }: EnrollmentWizardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<EnrollmentResponse | null>(null);

  const createEnrollment = useCreateEnrollment();

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      memberType: existingMemberId ? "existing" : "new",
      existingMemberId: existingMemberId ?? "",
      firstNameEn: "",
      firstNameAr: "",
      lastNameEn: "",
      lastNameAr: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      nationalId: "",
      planId: "",
      startDate: new Date().toISOString().split("T")[0],
      autoRenew: false,
      contractType: "MONTH_TO_MONTH",
      contractTerm: "MONTHLY",
      categoryId: "",
      paymentMethod: "",
      voucherCode: "",
      discountType: "",
      discountReason: "",
      staffNotes: "",
      referredByMemberId: "",
    },
  });

  const texts = {
    steps: [
      { label: isAr ? "العضو" : "Member", description: isAr ? "معلومات العضو" : "Member info" },
      { label: isAr ? "الخطة" : "Plan", description: isAr ? "اختيار الخطة" : "Select plan" },
      { label: isAr ? "العقد" : "Contract", description: isAr ? "شروط العقد" : "Contract terms" },
      { label: isAr ? "الدفع" : "Payment", description: isAr ? "الدفع والرسوم" : "Payment & fees" },
      { label: isAr ? "مراجعة" : "Review", description: isAr ? "تأكيد التسجيل" : "Confirm enrollment" },
    ],
    back: isAr ? "رجوع" : "Back",
    next: isAr ? "التالي" : "Next",
    enroll: isAr ? "تسجيل العضو" : "Enroll Member",
    enrolling: isAr ? "جارٍ التسجيل..." : "Enrolling...",
    shortcutNext: "Ctrl+Enter",
    shortcutBack: "Esc",
    success: isAr ? "تم التسجيل بنجاح" : "Enrollment successful",
    error: isAr ? "فشل التسجيل" : "Enrollment failed",
  };

  // Per-step validation
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const values = form.getValues();
    switch (currentStep) {
      case 0: // Member
        if (values.memberType === "existing") {
          return !!values.existingMemberId;
        }
        return !!values.firstNameEn && !!values.lastNameEn && !!values.email;
      case 1: // Plan
        return !!values.planId;
      case 2: // Contract
        return !!values.contractType;
      case 3: // Payment
        return true; // payment is optional
      case 4: // Review
        return true;
      default:
        return false;
    }
  }, [currentStep, form]);

  const goNext = useCallback(async () => {
    const valid = await validateCurrentStep();
    if (!valid) {
      toast({
        title: isAr ? "يرجى ملء الحقول المطلوبة" : "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, validateCurrentStep, toast, isAr]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // Keyboard shortcuts: Ctrl+Enter to advance, Escape to go back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (result) return; // Don't handle shortcuts on success screen
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (currentStep === TOTAL_STEPS - 1) {
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
  }, [currentStep, result]);

  const handleSubmit = async () => {
    const values = form.getValues();

    const payload: EnrollmentRequest = {
      planId: values.planId,
      startDate: values.startDate || undefined,
      autoRenew: values.autoRenew,
      contractType: values.contractType || "MONTH_TO_MONTH",
      contractTerm: values.contractTerm || "MONTHLY",
      categoryId: values.categoryId || undefined,
      paymentMethod: values.paymentMethod || undefined,
      paidAmount: values.paidAmount || undefined,
      paidCurrency: "SAR",
      voucherCode: values.voucherCode || undefined,
      discountType: values.discountType || undefined,
      discountValue: values.discountValue || undefined,
      discountReason: values.discountReason || undefined,
      staffNotes: values.staffNotes || undefined,
      referredByMemberId: values.referredByMemberId || undefined,
    };

    if (values.memberType === "existing") {
      payload.existingMemberId = values.existingMemberId;
    } else {
      payload.newMember = {
        firstNameEn: values.firstNameEn!,
        firstNameAr: values.firstNameAr || undefined,
        lastNameEn: values.lastNameEn!,
        lastNameAr: values.lastNameAr || undefined,
        email: values.email!,
        phone: values.phone || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        gender: values.gender || undefined,
        nationalId: values.nationalId || undefined,
      };
    }

    try {
      const response = await createEnrollment.mutateAsync(payload);
      setResult(response);
      toast({ title: texts.success });
    } catch (error) {
      const apiError = await parseApiError(error);
      toast({
        title: texts.error,
        description: getLocalizedErrorMessage(apiError, locale),
        variant: "destructive",
      });
    }
  };

  const handleEnrollAnother = () => {
    form.reset();
    setResult(null);
    setCurrentStep(0);
  };

  // Success screen
  if (result) {
    return <EnrollmentSuccess result={result} onEnrollAnother={handleEnrollAnother} />;
  }

  // Wizard steps
  const stepComponents = [
    <MemberStep key="member" form={form} />,
    <PlanStep key="plan" form={form} />,
    <ContractStep key="contract" form={form} />,
    <PaymentStep key="payment" form={form} />,
    <ReviewStep key="review" form={form} />,
  ];

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isSubmitting = createEnrollment.isPending;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <EnrollmentStepIndicator
        steps={texts.steps}
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          {stepComponents[currentStep]}
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
          {texts.back}
          <kbd className="ms-2 hidden rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            {texts.shortcutBack}
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
                {texts.enrolling}
              </>
            ) : (
              <>
                <UserPlus className="me-2 h-4 w-4" />
                {texts.enroll}
              </>
            )}
            <kbd className="ms-2 hidden rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] sm:inline">
              {texts.shortcutNext}
            </kbd>
          </Button>
        ) : (
          <Button type="button" onClick={goNext} disabled={isSubmitting}>
            {texts.next}
            <ArrowRight className="ms-2 h-4 w-4" />
            <kbd className="ms-2 hidden rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] sm:inline">
              {texts.shortcutNext}
            </kbd>
          </Button>
        )}
      </div>
    </div>
  );
}
