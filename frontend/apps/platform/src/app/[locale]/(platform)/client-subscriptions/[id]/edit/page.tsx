"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  SubscriptionForm,
  type SubscriptionFormValues,
} from "@liyaqa/shared/components/platform/subscription-form";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useClientSubscription,
  useUpdateClientSubscription,
} from "@liyaqa/shared/queries/platform/use-client-subscriptions";
import { usePlatformClient } from "@liyaqa/shared/queries/platform/use-platform-clients";
import type { UpdateClientSubscriptionRequest } from "@liyaqa/shared/types/platform/client-subscription";
import type { LocalizedText } from "@liyaqa/shared/types/api";

/**
 * Get localized text based on locale.
 */
function getLocalizedText(text: LocalizedText | undefined, locale: string): string {
  if (!text) return "";
  return locale === "ar" ? text.ar || text.en : text.en;
}

export default function EditClientSubscriptionPage() {
  const params = useParams();
  const subscriptionId = params.id as string;
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  // Data fetching
  const { data: subscription, isLoading, error } = useClientSubscription(subscriptionId);
  const { data: organization } = usePlatformClient(subscription?.organizationId || "");

  // Mutation
  const updateSubscription = useUpdateClientSubscription();

  const texts = {
    title: locale === "ar" ? "تعديل الاشتراك" : "Edit Subscription",
    back: locale === "ar" ? "العودة" : "Back",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    notFound: locale === "ar" ? "الاشتراك غير موجود" : "Subscription not found",
    errorLoading:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    successTitle: locale === "ar" ? "تم التحديث" : "Updated",
    successDesc:
      locale === "ar"
        ? "تم تحديث الاشتراك بنجاح"
        : "Subscription updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };

  const handleSubmit = (data: SubscriptionFormValues) => {
    const request: UpdateClientSubscriptionRequest = {
      agreedPriceAmount: data.agreedPriceAmount,
      agreedPriceCurrency: data.agreedPriceCurrency,
      billingCycle: data.billingCycle,
      discountPercentage: data.discountPercentage || undefined,
      autoRenew: data.autoRenew,
      notesEn: data.notesEn || undefined,
      notesAr: data.notesAr || undefined,
    };

    updateSubscription.mutate(
      { id: subscriptionId, data: request },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.successDesc,
          });
          router.push(`/${locale}/client-subscriptions/${subscriptionId}`);
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorLoading : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  // Check if subscription can be edited
  if (["CANCELLED", "EXPIRED"].includes(subscription.status)) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {locale === "ar"
            ? "لا يمكن تعديل الاشتراكات الملغاة أو المنتهية"
            : "Cancelled or expired subscriptions cannot be edited"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/client-subscriptions/${subscriptionId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">
            {organization
              ? getLocalizedText(organization.name, locale)
              : subscription.organizationId}
          </p>
        </div>
      </div>

      {/* Form */}
      <SubscriptionForm
        subscription={subscription}
        onSubmit={handleSubmit}
        isLoading={updateSubscription.isPending}
        mode="edit"
      />
    </div>
  );
}
