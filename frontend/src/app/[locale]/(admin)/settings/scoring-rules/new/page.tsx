"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ScoringRuleForm,
  type ScoringRuleFormData,
} from "@/components/forms/scoring-rule-form";
import { useCreateScoringRule } from "@/queries/use-lead-rules";
import { toast } from "sonner";

export default function NewScoringRulePage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const createMutation = useCreateScoringRule();

  const handleSubmit = async (data: ScoringRuleFormData) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        triggerType: data.triggerType,
        triggerValue: data.triggerValue,
        scoreChange: data.scoreChange,
        isActive: data.isActive,
      });
      toast.success(
        isArabic ? "تم إنشاء القاعدة بنجاح" : "Rule created successfully"
      );
      router.push(`/${locale}/settings/scoring-rules`);
    } catch {
      toast.error(isArabic ? "فشل في إنشاء القاعدة" : "Failed to create rule");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/settings/scoring-rules`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "إضافة قاعدة جديدة" : "Add New Scoring Rule"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إنشاء قاعدة جديدة لاحتساب نقاط العملاء المحتملين"
              : "Create a new rule for automatic lead scoring"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <ScoringRuleForm
          onSubmit={handleSubmit}
          isPending={createMutation.isPending}
        />
      </div>
    </div>
  );
}
