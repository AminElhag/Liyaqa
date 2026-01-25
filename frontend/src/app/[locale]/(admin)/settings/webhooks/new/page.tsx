"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebhookForm, type WebhookFormData } from "@/components/forms/webhook-form";
import { useCreateWebhook } from "@/queries/use-webhooks";
import { toast } from "sonner";

export default function NewWebhookPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const createMutation = useCreateWebhook();

  const handleSubmit = async (data: WebhookFormData) => {
    try {
      const result = await createMutation.mutateAsync({
        name: data.name,
        url: data.url,
        events: data.events,
        rateLimitPerMinute: data.rateLimitPerMinute,
      });
      toast.success(
        isArabic ? "تم إنشاء الويب هوك بنجاح" : "Webhook created successfully"
      );
      router.push(`/${locale}/settings/webhooks/${result.id}`);
    } catch {
      toast.error(isArabic ? "فشل في إنشاء الويب هوك" : "Failed to create webhook");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/settings/webhooks`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "إضافة ويب هوك جديد" : "Add New Webhook"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إنشاء نقطة نهاية جديدة لاستقبال الأحداث"
              : "Create a new endpoint to receive events"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <WebhookForm onSubmit={handleSubmit} isPending={createMutation.isPending} />
      </div>
    </div>
  );
}
