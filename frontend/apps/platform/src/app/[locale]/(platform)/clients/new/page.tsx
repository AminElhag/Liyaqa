"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { ClientOnboardingWizard } from "@liyaqa/shared/components/platform/client-onboarding-wizard";
import { OnboardingSuccessDialog } from "@liyaqa/shared/components/platform/onboarding-success-dialog";
import { useOnboardClient } from "@liyaqa/shared/queries/platform/use-platform-clients";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";
import type { OnboardClientRequest, OnboardingResult } from "@liyaqa/shared/types/platform";

export default function NewClientPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const onboardClient = useOnboardClient();

  // State for success dialog
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | null>(null);
  const [adminEmail, setAdminEmail] = useState("");

  const texts = {
    title: locale === "ar" ? "إضافة عميل جديد" : "Onboard New Client",
    description:
      locale === "ar"
        ? "إنشاء منظمة جديدة مع نادي وحساب مسؤول"
        : "Create a new organization with a club and admin account",
    back: locale === "ar" ? "العودة للعملاء" : "Back to Clients",
    successTitle: locale === "ar" ? "تم إنشاء العميل" : "Client Created",
    successDesc:
      locale === "ar"
        ? "تم إنشاء العميل بنجاح"
        : "The client has been created successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc:
      locale === "ar"
        ? "حدث خطأ أثناء إنشاء العميل"
        : "An error occurred while creating the client",
  };

  const handleSubmit = async (request: OnboardClientRequest) => {
    // Store admin email for success dialog
    setAdminEmail(request.adminEmail);

    try {
      const result = await onboardClient.mutateAsync(request);
      // Store result and show success dialog with credentials
      setOnboardingResult(result);
      setShowSuccessDialog(true);
    } catch (err) {
      const apiError = await parseApiError(err);
      toast({
        title: texts.errorTitle,
        description: getLocalizedErrorMessage(apiError, locale),
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/clients`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/clients`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Wizard */}
      <ClientOnboardingWizard
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={onboardClient.isPending}
      />

      {/* Success Dialog with Credentials */}
      <OnboardingSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        result={onboardingResult}
        adminEmail={adminEmail}
        onViewClient={() => {
          if (onboardingResult) {
            router.push(`/${locale}/clients/${onboardingResult.organization.id}`);
          }
        }}
      />
    </div>
  );
}
