"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AssignmentRuleForm,
  type AssignmentRuleFormData,
} from "@/components/forms/assignment-rule-form";
import { useCreateAssignmentRule } from "@/queries/use-lead-rules";
import { toast } from "sonner";

export default function NewAssignmentRulePage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const createMutation = useCreateAssignmentRule();

  const handleSubmit = async (data: AssignmentRuleFormData) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        ruleType: data.ruleType,
        priority: data.priority,
        isActive: data.isActive,
        config: {
          userIds: data.config.userIds,
          locationMappings: data.config.locationMappings,
          sourceMappings: data.config.sourceMappings,
          defaultUserId: data.config.defaultUserId,
        },
      });
      toast.success(
        isArabic ? "تم إنشاء القاعدة بنجاح" : "Rule created successfully"
      );
      router.push(`/${locale}/settings/assignment-rules`);
    } catch {
      toast.error(isArabic ? "فشل في إنشاء القاعدة" : "Failed to create rule");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/settings/assignment-rules`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "إضافة قاعدة جديدة" : "Add New Assignment Rule"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إنشاء قاعدة جديدة لتعيين العملاء المحتملين"
              : "Create a new rule for automatic lead assignment"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <AssignmentRuleForm
          onSubmit={handleSubmit}
          isPending={createMutation.isPending}
        />
      </div>
    </div>
  );
}
