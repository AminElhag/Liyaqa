"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ClientOnboardingWizard } from "@/components/platform/client-onboarding-wizard";
import { OnboardingSuccessDialog } from "@/components/platform/onboarding-success-dialog";
import { useOnboardClient } from "@/queries/platform/use-platform-clients";
import type { OnboardClientRequest, OnboardingResult } from "@/types/platform";

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

  const handleSubmit = (request: OnboardClientRequest) => {
    // Store admin email for success dialog
    setAdminEmail(request.adminEmail);

    onboardClient.mutate(request, {
      onSuccess: (result) => {
        // Store result and show success dialog with credentials
        setOnboardingResult(result);
        setShowSuccessDialog(true);
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error instanceof Error ? error.message : texts.errorDesc,
          variant: "destructive",
        });
      },
    });
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
