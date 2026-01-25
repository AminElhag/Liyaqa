"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Plus, Webhook as WebhookIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { getWebhookColumns } from "@/components/admin/webhook-columns";
import {
  useWebhooks,
  useDeleteWebhook,
  useActivateWebhook,
  useDeactivateWebhook,
  useTestWebhook,
} from "@/queries/use-webhooks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Webhook } from "@/types/webhook";
import { toast } from "sonner";

export default function WebhooksPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const [page, setPage] = useState(0);
  const [deleteWebhook, setDeleteWebhook] = useState<Webhook | null>(null);
  const [pendingWebhookId, setPendingWebhookId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useWebhooks({ page, size: 20 });
  const deleteMutation = useDeleteWebhook();
  const activateMutation = useActivateWebhook();
  const deactivateMutation = useDeactivateWebhook();
  const testMutation = useTestWebhook();

  const handleView = (webhook: Webhook) => {
    router.push(`/${locale}/settings/webhooks/${webhook.id}`);
  };

  const handleEdit = (webhook: Webhook) => {
    router.push(`/${locale}/settings/webhooks/${webhook.id}?edit=true`);
  };

  const handleDelete = async () => {
    if (!deleteWebhook) return;
    setPendingWebhookId(deleteWebhook.id);
    try {
      await deleteMutation.mutateAsync(deleteWebhook.id);
      toast.success(isArabic ? "تم حذف الويب هوك" : "Webhook deleted");
    } catch {
      toast.error(isArabic ? "فشل في الحذف" : "Failed to delete");
    } finally {
      setDeleteWebhook(null);
      setPendingWebhookId(null);
    }
  };

  const handleActivate = async (webhook: Webhook) => {
    setPendingWebhookId(webhook.id);
    try {
      await activateMutation.mutateAsync(webhook.id);
      toast.success(isArabic ? "تم تفعيل الويب هوك" : "Webhook activated");
    } catch {
      toast.error(isArabic ? "فشل في التفعيل" : "Failed to activate");
    } finally {
      setPendingWebhookId(null);
    }
  };

  const handleDeactivate = async (webhook: Webhook) => {
    setPendingWebhookId(webhook.id);
    try {
      await deactivateMutation.mutateAsync(webhook.id);
      toast.success(isArabic ? "تم إلغاء تفعيل الويب هوك" : "Webhook deactivated");
    } catch {
      toast.error(isArabic ? "فشل في إلغاء التفعيل" : "Failed to deactivate");
    } finally {
      setPendingWebhookId(null);
    }
  };

  const handleTest = async (webhook: Webhook) => {
    setPendingWebhookId(webhook.id);
    try {
      await testMutation.mutateAsync({ id: webhook.id });
      toast.success(isArabic ? "تم إرسال الاختبار" : "Test event sent");
    } catch {
      toast.error(isArabic ? "فشل في إرسال الاختبار" : "Failed to send test");
    } finally {
      setPendingWebhookId(null);
    }
  };

  const columns = getWebhookColumns({
    locale,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: setDeleteWebhook,
    onActivate: handleActivate,
    onDeactivate: handleDeactivate,
    onTest: handleTest,
    pendingWebhookId,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "الويب هوك" : "Webhooks"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة نقاط النهاية للإشعارات الآلية"
              : "Manage webhook endpoints for automated notifications"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href={`/${locale}/settings/webhooks/new`}>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {isArabic ? "إضافة ويب هوك" : "Add Webhook"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WebhookIcon className="h-5 w-5" />
            {isArabic ? "الاشتراكات" : "Subscriptions"}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? "إرسال الأحداث تلقائياً إلى الأنظمة الخارجية"
              : "Automatically send events to external systems"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.content ?? []}
            isLoading={isLoading}
            pageCount={data?.totalPages ?? 0}
            pageIndex={page}
            onPageChange={setPage}
            manualPagination
          />
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteWebhook} onOpenChange={() => setDeleteWebhook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabic ? "حذف الويب هوك؟" : "Delete Webhook?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? `هل أنت متأكد من حذف "${deleteWebhook?.name}"؟ سيتم حذف جميع سجلات التسليم.`
                : `Are you sure you want to delete "${deleteWebhook?.name}"? All delivery logs will be deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isArabic ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
