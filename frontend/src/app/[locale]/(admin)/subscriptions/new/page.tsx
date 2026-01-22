"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SubscriptionForm, type SubscriptionFormData } from "@/components/forms";
import { useActivePlans, useCreateSubscription, useMember } from "@/queries";
import { parseApiError, getLocalizedErrorMessage } from "@/lib/api";
import { LocalizedText } from "@/components/ui/localized-text";

export default function NewSubscriptionPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = searchParams.get("memberId");

  const [error, setError] = useState<string | null>(null);

  const { data: plans, isLoading: isLoadingPlans } = useActivePlans();
  const { data: member } = useMember(memberId || "", {
    enabled: !!memberId,
  });
  const createSubscription = useCreateSubscription();

  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    title: locale === "ar" ? "اشتراك جديد" : "New Subscription",
  };

  const handleSubmit = async (data: SubscriptionFormData) => {
    setError(null);
    try {
      await createSubscription.mutateAsync(data);
      if (memberId) {
        router.push(`/${locale}/members/${memberId}`);
      } else {
        router.push(`/${locale}/subscriptions`);
      }
    } catch (err) {
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
    }
  };

  const memberName = member
    ? `${member.firstName.en || ""} ${member.lastName.en || ""}`
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link
            href={
              memberId
                ? `/${locale}/members/${memberId}`
                : `/${locale}/subscriptions`
            }
          >
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{texts.title}</h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <SubscriptionForm
        memberId={memberId || undefined}
        memberName={memberName}
        plans={plans || []}
        onSubmit={handleSubmit}
        onCancel={() =>
          router.push(
            memberId
              ? `/${locale}/members/${memberId}`
              : `/${locale}/subscriptions`
          )
        }
        isSubmitting={createSubscription.isPending}
        isLoadingPlans={isLoadingPlans}
      />
    </div>
  );
}
