"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  User,
  Dumbbell,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

/**
 * Signup wizard step type
 */
type Step = "info" | "gym" | "plan" | "confirm";

/**
 * Form data structure
 */
interface SignupData {
  // Personal info
  fullName: string;
  email: string;
  phone: string;
  // Gym info
  gymName: string;
  expectedMembers: string;
  gymType: string;
  locations: string;
  openingTimeline: string;
  // Plan selection
  selectedPlan: string;
  billingCycle: string;
}

const initialData: SignupData = {
  fullName: "",
  email: "",
  phone: "",
  gymName: "",
  expectedMembers: "",
  gymType: "",
  locations: "",
  openingTimeline: "",
  selectedPlan: "",
  billingCycle: "annual",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRtl = locale === "ar";

  const [currentStep, setCurrentStep] = useState<Step>("info");
  const [formData, setFormData] = useState<SignupData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get plan from URL if provided
  useEffect(() => {
    const plan = searchParams.get("plan");
    const billing = searchParams.get("billing");
    if (plan) {
      setFormData((prev) => ({
        ...prev,
        selectedPlan: plan,
        billingCycle: billing || "annual",
      }));
    }
  }, [searchParams]);

  const steps: { id: Step; label: string; labelAr: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Your Info", labelAr: "معلوماتك", icon: <User className="h-5 w-5" /> },
    { id: "gym", label: "About Your Gym", labelAr: "عن صالتك", icon: <Dumbbell className="h-5 w-5" /> },
    { id: "plan", label: "Choose Plan", labelAr: "اختر الخطة", icon: <CreditCard className="h-5 w-5" /> },
    { id: "confirm", label: "Confirm", labelAr: "تأكيد", icon: <Check className="h-5 w-5" /> },
  ];

  const texts = {
    title: isRtl ? "ابدأ تجربتك المجانية" : "Start Your Free Trial",
    subtitle: isRtl ? "14 يومًا مجانًا. لا حاجة لبطاقة ائتمان." : "14 days free. No credit card required.",
    next: isRtl ? "التالي" : "Next",
    back: isRtl ? "السابق" : "Back",
    submit: isRtl ? "إنشاء حساب" : "Create Account",
    step1: {
      title: isRtl ? "أخبرنا عن نفسك" : "Tell Us About Yourself",
      fullName: isRtl ? "الاسم الكامل" : "Full Name",
      email: isRtl ? "البريد الإلكتروني" : "Email",
      phone: isRtl ? "رقم الهاتف" : "Phone Number",
      gymName: isRtl ? "اسم الصالة الرياضية" : "Gym Name",
    },
    step2: {
      title: isRtl ? "أخبرنا عن صالتك الرياضية" : "Tell Us About Your Gym",
      expectedMembers: isRtl ? "عدد الأعضاء المتوقع" : "Expected Members",
      gymType: isRtl ? "نوع الصالة" : "Gym Type",
      locations: isRtl ? "عدد المواقع" : "Number of Locations",
      openingTimeline: isRtl ? "متى ستفتتح؟" : "When Opening?",
      memberOptions: [
        { value: "under100", label: isRtl ? "أقل من 100" : "Under 100" },
        { value: "100-500", label: "100 - 500" },
        { value: "500+", label: isRtl ? "أكثر من 500" : "500+" },
      ],
      gymTypeOptions: [
        { value: "full-service", label: isRtl ? "صالة رياضية كاملة" : "Full-Service Gym" },
        { value: "boutique", label: isRtl ? "صالة بوتيك/استوديو" : "Boutique/Studio" },
        { value: "crossfit", label: isRtl ? "كروس فيت" : "CrossFit Box" },
        { value: "martial-arts", label: isRtl ? "فنون قتالية" : "Martial Arts" },
      ],
      locationOptions: [
        { value: "1", label: "1" },
        { value: "2-3", label: "2-3" },
        { value: "4+", label: "4+" },
      ],
      timelineOptions: [
        { value: "now", label: isRtl ? "الآن" : "Now" },
        { value: "1-month", label: isRtl ? "خلال شهر" : "Within 1 Month" },
        { value: "later", label: isRtl ? "لاحقًا" : "Later" },
      ],
    },
    step3: {
      title: isRtl ? "نوصي لك بـ" : "We Recommend",
      basedOn: isRtl ? "بناءً على احتياجاتك:" : "Based on your needs:",
    },
    step4: {
      title: isRtl ? "راجع وأكد" : "Review & Confirm",
      yourInfo: isRtl ? "معلوماتك" : "Your Information",
      gymInfo: isRtl ? "معلومات الصالة" : "Gym Information",
      selectedPlan: isRtl ? "الخطة المختارة" : "Selected Plan",
      trialInfo: isRtl
        ? "ستحصل على 14 يومًا مجانًا مع جميع ميزات الخطة المحترفة"
        : "You'll get 14 days free with full Professional features",
    },
  };

  const updateFormData = (field: keyof SignupData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const getRecommendedPlan = (): string => {
    // Logic to recommend plan based on form data
    if (formData.expectedMembers === "500+" || formData.locations === "4+") {
      return "enterprise";
    }
    if (formData.expectedMembers === "100-500" || formData.locations === "2-3") {
      return "professional";
    }
    return "starter";
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // In a real implementation, this would call the API to create the account
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Redirect to onboarding or dashboard
    router.push(`/${locale}/signup/success`);
  };

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    currentStepIndex >= idx
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {currentStepIndex > idx ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-12 sm:w-24 mx-2",
                      currentStepIndex > idx ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span
                key={step.id}
                className={cn(
                  "text-xs",
                  currentStep === step.id ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {isRtl ? step.labelAr : step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <AnimatePresence mode="wait">
            {currentStep === "info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle>{texts.step1.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{texts.step1.fullName}</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => updateFormData("fullName", e.target.value)}
                      placeholder={isRtl ? "أحمد الراشد" : "Ahmed Al-Rashid"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{texts.step1.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="ahmed@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{texts.step1.phone}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="+966 50 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gymName">{texts.step1.gymName}</Label>
                    <Input
                      id="gymName"
                      value={formData.gymName}
                      onChange={(e) => updateFormData("gymName", e.target.value)}
                      placeholder={isRtl ? "قوة الرياض" : "Riyadh Strength"}
                    />
                  </div>
                </CardContent>
              </motion.div>
            )}

            {currentStep === "gym" && (
              <motion.div
                key="gym"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle>{texts.step2.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>{texts.step2.expectedMembers}</Label>
                    <RadioGroup
                      value={formData.expectedMembers}
                      onValueChange={(v) => updateFormData("expectedMembers", v)}
                      className="flex gap-4"
                    >
                      {texts.step2.memberOptions.map((opt) => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`members-${opt.value}`} />
                          <Label htmlFor={`members-${opt.value}`} className="cursor-pointer">
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>{texts.step2.gymType}</Label>
                    <RadioGroup
                      value={formData.gymType}
                      onValueChange={(v) => updateFormData("gymType", v)}
                      className="grid grid-cols-2 gap-3"
                    >
                      {texts.step2.gymTypeOptions.map((opt) => (
                        <div key={opt.value}>
                          <RadioGroupItem
                            value={opt.value}
                            id={`type-${opt.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`type-${opt.value}`}
                            className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                          >
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>{texts.step2.locations}</Label>
                    <RadioGroup
                      value={formData.locations}
                      onValueChange={(v) => updateFormData("locations", v)}
                      className="flex gap-4"
                    >
                      {texts.step2.locationOptions.map((opt) => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`locations-${opt.value}`} />
                          <Label htmlFor={`locations-${opt.value}`} className="cursor-pointer">
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>{texts.step2.openingTimeline}</Label>
                    <RadioGroup
                      value={formData.openingTimeline}
                      onValueChange={(v) => updateFormData("openingTimeline", v)}
                      className="flex gap-4"
                    >
                      {texts.step2.timelineOptions.map((opt) => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`timeline-${opt.value}`} />
                          <Label htmlFor={`timeline-${opt.value}`} className="cursor-pointer">
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {currentStep === "plan" && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {texts.step3.title} Professional
                  </CardTitle>
                  <CardDescription>{texts.step3.basedOn}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Building2 className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold text-lg">Professional</h3>
                        <p className="text-sm text-muted-foreground">
                          {isRtl ? "مثالي للصالات الرياضية المتنامية" : "Perfect for growing gyms"}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {isRtl ? "حتى 500 عضو" : "Up to 500 members"}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {isRtl ? "3 مواقع" : "3 locations"}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {isRtl ? "أدوات التسويق والتحكم في الوصول" : "Marketing tools & access control"}
                      </li>
                    </ul>
                    <div className="text-center py-4 border-t">
                      <div className="text-3xl font-bold">
                        SAR 499<span className="text-lg font-normal text-muted-foreground">/mo</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isRtl ? "14 يومًا تجربة مجانية" : "14-day free trial"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {currentStep === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle>{texts.step4.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">{texts.step4.yourInfo}</h4>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
                      <p><strong>{formData.fullName}</strong></p>
                      <p>{formData.email}</p>
                      <p>{formData.phone}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{texts.step4.gymInfo}</h4>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
                      <p><strong>{formData.gymName}</strong></p>
                      <p>{formData.expectedMembers} {isRtl ? "عضو متوقع" : "expected members"}</p>
                      <p>{formData.locations} {isRtl ? "موقع" : "location(s)"}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{texts.step4.selectedPlan}</h4>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Professional Plan</p>
                          <p className="text-sm text-muted-foreground">{texts.step4.trialInfo}</p>
                        </div>
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between p-6 pt-0">
            {currentStepIndex > 0 ? (
              <Button
                variant="outline"
                onClick={() => goToStep(steps[currentStepIndex - 1].id)}
              >
                {isRtl ? <ChevronRight className="h-4 w-4 me-2" /> : <ChevronLeft className="h-4 w-4 me-2" />}
                {texts.back}
              </Button>
            ) : (
              <div />
            )}

            {currentStepIndex < steps.length - 1 ? (
              <Button onClick={() => goToStep(steps[currentStepIndex + 1].id)}>
                {texts.next}
                {isRtl ? <ChevronLeft className="h-4 w-4 ms-2" /> : <ChevronRight className="h-4 w-4 ms-2" />}
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {isRtl ? "جاري الإنشاء..." : "Creating..."}
                  </span>
                ) : (
                  texts.submit
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
