"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, UserPlus } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useCreateMember } from "@liyaqa/shared/queries/use-members";
import { useCreateSubscription } from "@liyaqa/shared/queries/use-subscriptions";
import { useSignAgreement } from "@liyaqa/shared/queries/use-agreements";
import { useCreateMemberHealth } from "@liyaqa/shared/queries/use-member-health";
import { useActiveAgreements } from "@liyaqa/shared/queries/use-agreements";
import { WizardProgress, type WizardStep } from "./wizard-progress";
import { PersonalInfoStep } from "./steps/personal-info-step";
import { ContactStep } from "./steps/contact-step";
import { HealthInfoStep } from "./steps/health-info-step";
import { AgreementsStep } from "./steps/agreements-step";
import { SubscriptionStep } from "./steps/subscription-step";
import { ReviewStep } from "./steps/review-step";
import {
  registrationSchema,
  defaultRegistrationValues,
  personalInfoSchema,
  type RegistrationData,
} from "./schemas/registration-schema";

export function MemberRegistrationWizard() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMember = useCreateMember();
  const createSubscription = useCreateSubscription();
  const signAgreement = useSignAgreement();
  const createHealth = useCreateMemberHealth();
  const { data: agreements = [] } = useActiveAgreements();

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: defaultRegistrationValues,
    mode: "onChange",
  });

  const texts = {
    steps: [
      {
        id: "personal",
        title: locale === "ar" ? "المعلومات الشخصية" : "Personal Info",
      },
      { id: "contact", title: locale === "ar" ? "الاتصال" : "Contact" },
      { id: "health", title: locale === "ar" ? "الصحة" : "Health" },
      { id: "agreements", title: locale === "ar" ? "الاتفاقيات" : "Agreements" },
      { id: "subscription", title: locale === "ar" ? "الاشتراك" : "Subscription" },
      { id: "review", title: locale === "ar" ? "المراجعة" : "Review" },
    ] as WizardStep[],
    back: locale === "ar" ? "السابق" : "Back",
    next: locale === "ar" ? "التالي" : "Next",
    submit: locale === "ar" ? "تسجيل العضو" : "Register Member",
    submitting: locale === "ar" ? "جاري التسجيل..." : "Registering...",
    successTitle: locale === "ar" ? "تم التسجيل بنجاح" : "Registration Successful",
    successDescription:
      locale === "ar"
        ? "تم تسجيل العضو بنجاح"
        : "The member has been registered successfully",
    errorTitle: locale === "ar" ? "خطأ في التسجيل" : "Registration Error",
    errorDescription:
      locale === "ar"
        ? "حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى."
        : "An error occurred during registration. Please try again.",
    validationError:
      locale === "ar"
        ? "يرجى ملء جميع الحقول المطلوبة"
        : "Please fill in all required fields",
  };

  const handleNext = async () => {
    // Validate current step before proceeding
    let isValid = true;

    if (currentStep === 0) {
      // Validate personal info step
      // Trigger validation on entire firstName/lastName objects (not just .en)
      // This ensures the .refine() validation runs for "at least one language required"
      isValid = await form.trigger([
        "firstName",
        "lastName",
        "email",
        "phone",
      ]);
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, texts.steps.length - 1));
    } else {
      toast({
        title: texts.errorTitle,
        description: texts.validationError,
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const data = form.getValues();

      // 1. Create the member
      const member = await createMember.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        notes: data.registrationNotes,
        nationality: data.nationality,
        nationalId: data.nationalId,
        preferredLanguage: data.preferredLanguage,
      });

      // 2. Create health information if provided
      if (data.health) {
        await createHealth.mutateAsync({
          memberId: member.id,
          data: data.health,
        });
      }

      // 3. Sign agreements
      const signedIds = data.agreements?.signedAgreementIds || [];
      for (const agreementId of signedIds) {
        await signAgreement.mutateAsync({
          memberId: member.id,
          agreementId,
          data: {
            signatureData: data.agreements?.signatures?.[agreementId],
          },
        });
      }

      // 4. Create subscription if plan selected
      if (data.subscription?.planId) {
        await createSubscription.mutateAsync({
          memberId: member.id,
          planId: data.subscription.planId,
          startDate: data.subscription.startDate,
        });
      }

      toast({
        title: texts.successTitle,
        description: texts.successDescription,
      });

      // Navigate to member detail page
      router.push(`/${locale}/members/${member.id}`);
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: texts.errorTitle,
        description:
          error instanceof Error ? error.message : texts.errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfoStep form={form} />;
      case 1:
        return <ContactStep form={form} />;
      case 2:
        return <HealthInfoStep form={form} />;
      case 3:
        return <AgreementsStep form={form} />;
      case 4:
        return <SubscriptionStep form={form} />;
      case 5:
        return <ReviewStep form={form} onEditStep={handleEditStep} />;
      default:
        return null;
    }
  };

  const isLastStep = currentStep === texts.steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Check if all mandatory agreements are signed
  const signedIds = form.watch("agreements.signedAgreementIds") || [];
  const mandatoryAgreements = agreements.filter((a) => a.isMandatory);
  const allMandatorySigned = mandatoryAgreements.every((a) =>
    signedIds.includes(a.id)
  );

  // Disable submit if on last step and mandatory agreements not signed
  const canSubmit = isLastStep && allMandatorySigned && !isSubmitting;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <WizardProgress
        steps={texts.steps}
        currentStep={currentStep}
        onStepClick={handleEditStep}
        allowNavigation={true}
      />

      {/* Step Content */}
      <div className="min-h-[400px]">{renderStep()}</div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep || isSubmitting}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {texts.back}
        </Button>

        {isLastStep ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {texts.submitting}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                {texts.submit}
              </>
            )}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext} disabled={isSubmitting}>
            {texts.next}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Re-export for convenience
export { type RegistrationData } from "./schemas/registration-schema";
