"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { useMember } from "@liyaqa/shared/queries/use-members";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { EnrollmentWizard } from "@/components/enrollment";

export default function MemberEnrollPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = use(params);
  const locale = useLocale();
  const { data: member, isLoading } = useMember(id);

  const isAr = locale === "ar";

  const texts = {
    back: isAr ? "العودة للعضو" : "Back to Member",
    title: isAr ? "تسجيل عضوية" : "Enroll Member",
    subtitle: isAr ? "تسجيل عضوية جديدة لهذا العضو" : "Create a new membership for this member",
    loading: isAr ? "جارٍ التحميل..." : "Loading...",
  };

  const memberName = member
    ? isAr
      ? `${member.firstName.ar || member.firstName.en} ${member.lastName.ar || member.lastName.en}`
      : `${member.firstName.en} ${member.lastName.en}`
    : "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/members/${id}`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {texts.title}
            {memberName && (
              <span className="text-muted-foreground"> — {memberName}</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">{texts.subtitle}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <EnrollmentWizard existingMemberId={id} />
      )}
    </div>
  );
}
