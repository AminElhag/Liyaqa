"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Send,
  RefreshCw,
  Edit,
  Loader2,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { WebhookForm, type WebhookFormData } from "@/components/forms/webhook-form";
import { WebhookDeliveryLog } from "@/components/admin/webhook-delivery-log";
import {
  useWebhook,
  useUpdateWebhook,
  useRegenerateWebhookSecret,
  useTestWebhook,
  useWebhookStats,
} from "@liyaqa/shared/queries/use-webhooks";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@liyaqa/shared/components/ui/alert-dialog";

export default function WebhookDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const webhookId = params.id as string;
  const isEditMode = searchParams.get("edit") === "true";

  const [showSecret, setShowSecret] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  const { data: webhook, isLoading } = useWebhook(webhookId);
  const { data: stats } = useWebhookStats(webhookId);
  const updateMutation = useUpdateWebhook();
  const regenerateSecretMutation = useRegenerateWebhookSecret();
  const testMutation = useTestWebhook();

  const handleUpdate = async (data: WebhookFormData) => {
    try {
      await updateMutation.mutateAsync({
        id: webhookId,
        data: {
          name: data.name,
          url: data.url,
          events: data.events,
          rateLimitPerMinute: data.rateLimitPerMinute,
          isActive: data.isActive,
        },
      });
      toast.success(isArabic ? "تم تحديث الويب هوك" : "Webhook updated");
      router.push(`/${locale}/settings/webhooks/${webhookId}`);
    } catch {
      toast.error(isArabic ? "فشل في التحديث" : "Failed to update");
    }
  };

  const handleRegenerateSecret = async () => {
    try {
      const result = await regenerateSecretMutation.mutateAsync(webhookId);
      setSecret(result.secret);
      setShowSecret(true);
      toast.success(isArabic ? "تم إنشاء مفتاح جديد" : "New secret generated");
    } catch {
      toast.error(isArabic ? "فشل في إنشاء المفتاح" : "Failed to regenerate");
    } finally {
      setShowRegenerateDialog(false);
    }
  };

  const handleTest = async () => {
    try {
      await testMutation.mutateAsync({ id: webhookId });
      toast.success(isArabic ? "تم إرسال الاختبار" : "Test event sent");
    } catch {
      toast.error(isArabic ? "فشل في الاختبار" : "Test failed");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isArabic ? "تم النسخ" : "Copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isArabic ? "الويب هوك غير موجود" : "Webhook not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/settings/webhooks`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{webhook.name}</h1>
              <Badge variant={webhook.isActive ? "default" : "secondary"}>
                {webhook.isActive
                  ? isArabic ? "مفعل" : "Active"
                  : isArabic ? "غير مفعل" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm" dir="ltr">
              {webhook.url}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testMutation.isPending || !webhook.isActive}
          >
            {testMutation.isPending ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 me-2" />
            )}
            {isArabic ? "اختبار" : "Test"}
          </Button>
          {!isEditMode && (
            <Link href={`/${locale}/settings/webhooks/${webhookId}?edit=true`}>
              <Button>
                <Edit className="h-4 w-4 me-2" />
                {isArabic ? "تعديل" : "Edit"}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isEditMode ? (
        <div className="max-w-3xl">
          <WebhookForm
            webhook={webhook}
            onSubmit={handleUpdate}
            isPending={updateMutation.isPending}
          />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              {isArabic ? "نظرة عامة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="deliveries">
              {isArabic ? "سجل التسليم" : "Deliveries"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-muted-foreground text-sm">
                      {isArabic ? "الإجمالي" : "Total"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                    <p className="text-muted-foreground text-sm">
                      {isArabic ? "تم التسليم" : "Delivered"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <p className="text-muted-foreground text-sm">
                      {isArabic ? "قيد الانتظار" : "Pending"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                    <p className="text-muted-foreground text-sm">
                      {isArabic ? "فشل" : "Failed"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-gray-600">{stats.exhausted}</div>
                    <p className="text-muted-foreground text-sm">
                      {isArabic ? "استنفذ" : "Exhausted"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Secret */}
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? "المفتاح السري" : "Signing Secret"}</CardTitle>
                <CardDescription>
                  {isArabic
                    ? "استخدم هذا المفتاح للتحقق من توقيع الطلبات"
                    : "Use this to verify webhook signatures"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {secret ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted p-3 rounded-md font-mono text-sm" dir="ltr">
                      {showSecret ? secret : "••••••••••••••••••••••••••••••••"}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => setShowSecret(!showSecret)}>
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(secret)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {isArabic
                      ? "المفتاح مخفي. أنشئ مفتاحاً جديداً لعرضه."
                      : "Secret is hidden. Regenerate to view it."}
                  </p>
                )}
                <Button variant="outline" onClick={() => setShowRegenerateDialog(true)}>
                  <RefreshCw className="h-4 w-4 me-2" />
                  {isArabic ? "إنشاء مفتاح جديد" : "Regenerate Secret"}
                </Button>
              </CardContent>
            </Card>

            {/* Events */}
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? "الأحداث المشترك بها" : "Subscribed Events"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {webhook.events.includes("*") ? (
                    <Badge variant="secondary">{isArabic ? "جميع الأحداث" : "All Events"}</Badge>
                  ) : (
                    webhook.events.map((event) => (
                      <Badge key={event} variant="outline">
                        {event}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliveries">
            <WebhookDeliveryLog webhookId={webhookId} />
          </TabsContent>
        </Tabs>
      )}

      {/* Regenerate secret dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabic ? "إنشاء مفتاح جديد؟" : "Regenerate Secret?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? "سيتم إلغاء المفتاح الحالي. تأكد من تحديث تطبيقك بالمفتاح الجديد."
                : "The current secret will be invalidated. Make sure to update your application with the new secret."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateSecret}>
              {isArabic ? "إنشاء" : "Regenerate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
