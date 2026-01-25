"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AssignmentRuleForm,
  type AssignmentRuleFormData,
} from "@/components/forms/assignment-rule-form";
import {
  useAssignmentRule,
  useUpdateAssignmentRule,
} from "@/queries/use-lead-rules";
import { toast } from "sonner";

export default function EditAssignmentRulePage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const ruleId = params.id as string;

  const { data: rule, isLoading } = useAssignmentRule(ruleId);
  const updateMutation = useUpdateAssignmentRule();

  const handleSubmit = async (data: AssignmentRuleFormData) => {
    try {
      await updateMutation.mutateAsync({
        id: ruleId,
        data: {
          name: data.name,
          priority: data.priority,
          isActive: data.isActive,
          config: {
            userIds: data.config.userIds,
            locationMappings: data.config.locationMappings,
            sourceMappings: data.config.sourceMappings,
            defaultUserId: data.config.defaultUserId,
          },
        },
      });
      toast.success(isArabic ? "تم تحديث القاعدة" : "Rule updated");
      router.push(`/${locale}/settings/assignment-rules`);
    } catch {
      toast.error(isArabic ? "فشل في التحديث" : "Failed to update");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full max-w-3xl" />
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isArabic ? "القاعدة غير موجودة" : "Rule not found"}
        </p>
        <Link href={`/${locale}/settings/assignment-rules`}>
          <Button variant="link" className="mt-4">
            {isArabic ? "العودة للقائمة" : "Back to list"}
          </Button>
        </Link>
      </div>
    );
  }

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
            {isArabic ? "تعديل القاعدة" : "Edit Assignment Rule"}
          </h1>
          <p className="text-muted-foreground">{rule.name}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <AssignmentRuleForm
          rule={rule}
          onSubmit={handleSubmit}
          isPending={updateMutation.isPending}
        />
      </div>
    </div>
  );
}
