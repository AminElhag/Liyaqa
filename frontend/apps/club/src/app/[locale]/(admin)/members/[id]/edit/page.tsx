"use client";

import { use, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { MemberForm, type MemberFormData } from "@/components/forms";
import { useMember, useUpdateMember } from "@liyaqa/shared/queries";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";

interface EditMemberPageProps {
  params: Promise<{ id: string }>;
}

export default function EditMemberPage({ params }: EditMemberPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { data: member, isLoading, error: fetchError } = useMember(id);
  const updateMember = useUpdateMember();

  const texts = {
    back: locale === "ar" ? "العودة للعضو" : "Back to Member",
    title: locale === "ar" ? "تعديل العضو" : "Edit Member",
    notFound: locale === "ar" ? "لم يتم العثور على العضو" : "Member not found",
    loadError:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل البيانات"
        : "Error loading member data",
  };

  const handleSubmit = async (data: MemberFormData) => {
    setError(null);
    try {
      await updateMember.mutateAsync({ id, data });
      router.push(`/${locale}/members/${id}`);
    } catch (err) {
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  if (fetchError || !member) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-4" />
          <p className="text-destructive">
            {fetchError ? texts.loadError : texts.notFound}
          </p>
          <Button asChild className="mt-4">
            <Link href={`/${locale}/members`}>{texts.back}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/members/${id}`}>
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
      <MemberForm
        member={member}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${locale}/members/${id}`)}
        isSubmitting={updateMember.isPending}
      />
    </div>
  );
}
