"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  SubscriptionForm,
  type SubscriptionFormValues,
} from "@liyaqa/shared/components/platform/subscription-form";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useCreateClientSubscription } from "@liyaqa/shared/queries/platform/use-client-subscriptions";
import type { CreateClientSubscriptionRequest } from "@liyaqa/shared/types/platform/client-subscription";

export default function NewClientSubscriptionPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createSubscription = useCreateClientSubscription();

  const texts = {
    title: locale === "ar" ? "إنشاء اشتراك جديد" : "Create New Subscription",
    description:
      locale === "ar"
        ? "أنشئ اشتراكاً جديداً لعميل في المنصة"
        : "Create a new platform subscription for a client",
    back: locale === "ar" ? "العودة" : "Back",
    successTitle: locale === "ar" ? "تم الإنشاء" : "Created",
    successDesc:
      locale === "ar"
        ? "تم إنشاء الاشتراك بنجاح"
        : "Subscription created successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };

  const handleSubmit = (data: SubscriptionFormValues) => {
    const request: CreateClientSubscriptionRequest = {
      organizationId: data.organizationId,
      clientPlanId: data.clientPlanId,
      agreedPriceAmount: data.agreedPriceAmount,
      agreedPriceCurrency: data.agreedPriceCurrency,
      billingCycle: data.billingCycle,
      contractMonths: data.contractMonths,
      startWithTrial: data.startWithTrial,
      trialDays: data.startWithTrial ? data.trialDays : undefined,
      discountPercentage: data.discountPercentage || undefined,
      autoRenew: data.autoRenew,
      salesRepId: data.salesRepId || undefined,
      dealId: data.dealId || undefined,
      notesEn: data.notesEn || undefined,
      notesAr: data.notesAr || undefined,
    };

    createSubscription.mutate(request, {
      onSuccess: (subscription) => {
        toast({
          title: texts.successTitle,
          description: texts.successDesc,
        });
        router.push(`/${locale}/client-subscriptions/${subscription.id}`);
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/client-subscriptions`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Form */}
      <SubscriptionForm
        onSubmit={handleSubmit}
        isLoading={createSubscription.isPending}
        mode="create"
      />
    </div>
  );
}
