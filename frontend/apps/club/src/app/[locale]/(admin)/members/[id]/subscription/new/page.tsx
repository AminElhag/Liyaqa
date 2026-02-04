"use client";

import { use, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { SubscriptionForm, type SubscriptionFormData } from "@/components/forms";
import { useActivePlans, useCreateSubscription, useMember } from "@liyaqa/shared/queries";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";
import { Loading } from "@liyaqa/shared/components/ui/spinner";

interface MemberSubscriptionNewPageProps {
  params: Promise<{ id: string }>;
}

export default function MemberSubscriptionNewPage({
  params,
}: MemberSubscriptionNewPageProps) {
  const { id: memberId } = use(params);
  const locale = useLocale();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const { data: member, isLoading: isLoadingMember } = useMember(memberId);
  const { data: plans, isLoading: isLoadingPlans } = useActivePlans();
  const createSubscription = useCreateSubscription();

  const texts = {
    back: locale === "ar" ? "العودة للعضو" : "Back to Member",
    title: locale === "ar" ? "اشتراك جديد" : "New Subscription",
    for: locale === "ar" ? "لـ" : "for",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    memberNotFound:
      locale === "ar" ? "العضو غير موجود" : "Member not found",
  };

  const handleSubmit = async (data: SubscriptionFormData) => {
    setError(null);
    try {
      await createSubscription.mutateAsync(data);
      router.push(`/${locale}/members/${memberId}`);
    } catch (err) {
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
    }
  };

  if (isLoadingMember) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/members`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
        </div>
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {texts.memberNotFound}
        </div>
      </div>
    );
  }

  const memberName = `${member.firstName.en || ""} ${member.lastName.en || ""}`.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/members/${memberId}`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">
            {texts.for} {memberName}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <SubscriptionForm
        memberId={memberId}
        memberName={memberName}
        plans={plans || []}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${locale}/members/${memberId}`)}
        isSubmitting={createSubscription.isPending}
        isLoadingPlans={isLoadingPlans}
      />
    </div>
  );
}
