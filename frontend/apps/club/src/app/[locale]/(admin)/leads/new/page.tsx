"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { LeadForm } from "@/components/forms/lead-form";
import { useCreateLead } from "@liyaqa/shared/queries/use-leads";
import type { CreateLeadRequest } from "@liyaqa/shared/types/lead";
import { toast } from "sonner";

export default function NewLeadPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const createMutation = useCreateLead();

  const handleSubmit = async (data: CreateLeadRequest) => {
    try {
      const result = await createMutation.mutateAsync(data);
      toast.success(
        isArabic ? "تم إنشاء العميل المحتمل بنجاح" : "Lead created successfully"
      );
      router.push(`/${locale}/leads/${result.id}`);
    } catch {
      toast.error(isArabic ? "فشل في إنشاء العميل المحتمل" : "Failed to create lead");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/leads`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "إضافة عميل محتمل جديد" : "Add New Lead"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إنشاء عميل محتمل جديد في قمع المبيعات"
              : "Create a new prospect in your sales pipeline"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <LeadForm onSubmit={handleSubmit} isPending={createMutation.isPending} />
      </div>
    </div>
  );
}
