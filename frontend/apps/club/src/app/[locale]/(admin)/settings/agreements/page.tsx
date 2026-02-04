"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Plus, FileSignature, RefreshCw } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { DataTable } from "@liyaqa/shared/components/data-table";
import { getAgreementColumns } from "@/components/admin/agreement-columns";
import {
  useAgreements,
  useDeleteAgreement,
  useActivateAgreement,
  useDeactivateAgreement,
} from "@liyaqa/shared/queries/use-agreements";
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
import type { Agreement } from "@liyaqa/shared/types/agreement";
import { toast } from "sonner";

export default function AgreementsPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const [page, setPage] = useState(0);
  const [deleteAgreement, setDeleteAgreement] = useState<Agreement | null>(null);
  const [pendingAgreementId, setPendingAgreementId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useAgreements({ page, size: 20 });
  const deleteMutation = useDeleteAgreement();
  const activateMutation = useActivateAgreement();
  const deactivateMutation = useDeactivateAgreement();

  const texts = {
    title: isArabic ? "الاتفاقيات" : "Agreements",
    description: isArabic
      ? "إدارة قوالب الاتفاقيات للأعضاء"
      : "Manage agreement templates for members",
    subscriptions: isArabic ? "قوالب الاتفاقيات" : "Agreement Templates",
    subscriptionDesc: isArabic
      ? "إخلاء المسؤولية، الشروط والأحكام، الإفصاحات الصحية"
      : "Liability waivers, terms & conditions, health disclosures",
    addAgreement: isArabic ? "إضافة اتفاقية" : "Add Agreement",
    agreementDeleted: isArabic ? "تم حذف الاتفاقية" : "Agreement deleted",
    agreementActivated: isArabic ? "تم تفعيل الاتفاقية" : "Agreement activated",
    agreementDeactivated: isArabic ? "تم إلغاء تفعيل الاتفاقية" : "Agreement deactivated",
    actionFailed: isArabic ? "فشل في تنفيذ الإجراء" : "Action failed",
    deleteTitle: isArabic ? "حذف الاتفاقية؟" : "Delete Agreement?",
    deleteDesc: isArabic
      ? "هل أنت متأكد من حذف هذه الاتفاقية؟ لن يتمكن الأعضاء من التوقيع عليها بعد الآن."
      : "Are you sure you want to delete this agreement? Members will no longer be able to sign it.",
    cancel: isArabic ? "إلغاء" : "Cancel",
    delete: isArabic ? "حذف" : "Delete",
  };

  const handleView = (agreement: Agreement) => {
    router.push(`/${locale}/settings/agreements/${agreement.id}`);
  };

  const handleEdit = (agreement: Agreement) => {
    router.push(`/${locale}/settings/agreements/${agreement.id}?edit=true`);
  };

  const handleDelete = async () => {
    if (!deleteAgreement) return;
    setPendingAgreementId(deleteAgreement.id);
    try {
      await deleteMutation.mutateAsync(deleteAgreement.id);
      toast.success(texts.agreementDeleted);
    } catch {
      toast.error(texts.actionFailed);
    } finally {
      setDeleteAgreement(null);
      setPendingAgreementId(null);
    }
  };

  const handleActivate = async (agreement: Agreement) => {
    setPendingAgreementId(agreement.id);
    try {
      await activateMutation.mutateAsync(agreement.id);
      toast.success(texts.agreementActivated);
    } catch {
      toast.error(texts.actionFailed);
    } finally {
      setPendingAgreementId(null);
    }
  };

  const handleDeactivate = async (agreement: Agreement) => {
    setPendingAgreementId(agreement.id);
    try {
      await deactivateMutation.mutateAsync(agreement.id);
      toast.success(texts.agreementDeactivated);
    } catch {
      toast.error(texts.actionFailed);
    } finally {
      setPendingAgreementId(null);
    }
  };

  const columns = getAgreementColumns({
    locale,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: setDeleteAgreement,
    onActivate: handleActivate,
    onDeactivate: handleDeactivate,
    pendingAgreementId,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href={`/${locale}/settings/agreements/new`}>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {texts.addAgreement}
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            {texts.subscriptions}
          </CardTitle>
          <CardDescription>{texts.subscriptionDesc}</CardDescription>
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
      <AlertDialog open={!!deleteAgreement} onOpenChange={() => setDeleteAgreement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{texts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {texts.deleteDesc}
              {deleteAgreement && (
                <span className="block mt-2 font-medium">
                  {isArabic
                    ? deleteAgreement.title.ar || deleteAgreement.title.en
                    : deleteAgreement.title.en}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{texts.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {texts.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
