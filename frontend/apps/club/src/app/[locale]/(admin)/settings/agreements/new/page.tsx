"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { AgreementForm } from "@/components/admin/agreement-form";
import { useCreateAgreement } from "@liyaqa/shared/queries/use-agreements";
import type { CreateAgreementRequest, UpdateAgreementRequest } from "@liyaqa/shared/types/agreement";
import { toast } from "sonner";

export default function NewAgreementPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const createMutation = useCreateAgreement();

  const texts = {
    title: isArabic ? "إضافة اتفاقية جديدة" : "Add New Agreement",
    description: isArabic
      ? "إنشاء قالب اتفاقية جديد للأعضاء"
      : "Create a new agreement template for members",
    success: isArabic ? "تم إنشاء الاتفاقية بنجاح" : "Agreement created successfully",
    error: isArabic ? "فشل في إنشاء الاتفاقية" : "Failed to create agreement",
  };

  const handleSubmit = async (data: CreateAgreementRequest | UpdateAgreementRequest) => {
    try {
      const result = await createMutation.mutateAsync(data as CreateAgreementRequest);
      toast.success(texts.success);
      router.push(`/${locale}/settings/agreements/${result.id}`);
    } catch {
      toast.error(texts.error);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/settings/agreements`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/settings/agreements`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <AgreementForm
          onSubmit={handleSubmit}
          isPending={createMutation.isPending}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
