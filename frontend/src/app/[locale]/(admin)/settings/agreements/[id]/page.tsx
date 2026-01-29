"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AgreementForm } from "@/components/admin/agreement-form";
import { TYPE_LABELS, TYPE_COLORS } from "@/components/admin/agreement-columns";
import {
  useAgreement,
  useUpdateAgreement,
  useActivateAgreement,
  useDeactivateAgreement,
} from "@/queries/use-agreements";
import type { UpdateAgreementRequest } from "@/types/agreement";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export default function AgreementDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;
  const agreementId = params.id as string;
  const isEditMode = searchParams.get("edit") === "true";

  const { data: agreement, isLoading } = useAgreement(agreementId);
  const updateMutation = useUpdateAgreement();
  const activateMutation = useActivateAgreement();
  const deactivateMutation = useDeactivateAgreement();

  const texts = {
    backToList: isArabic ? "العودة إلى القائمة" : "Back to list",
    edit: isArabic ? "تعديل" : "Edit",
    activate: isArabic ? "تفعيل" : "Activate",
    deactivate: isArabic ? "إلغاء التفعيل" : "Deactivate",
    active: isArabic ? "مفعل" : "Active",
    inactive: isArabic ? "غير مفعل" : "Inactive",
    details: isArabic ? "تفاصيل الاتفاقية" : "Agreement Details",
    type: isArabic ? "النوع" : "Type",
    version: isArabic ? "الإصدار" : "Version",
    effectiveDate: isArabic ? "تاريخ السريان" : "Effective Date",
    mandatory: isArabic ? "إلزامي" : "Mandatory",
    healthQuestions: isArabic ? "أسئلة صحية" : "Health Questions",
    sortOrder: isArabic ? "ترتيب العرض" : "Sort Order",
    yes: isArabic ? "نعم" : "Yes",
    no: isArabic ? "لا" : "No",
    contentEn: isArabic ? "المحتوى (الإنجليزية)" : "Content (English)",
    contentAr: isArabic ? "المحتوى (العربية)" : "Content (Arabic)",
    notFound: isArabic ? "الاتفاقية غير موجودة" : "Agreement not found",
    updated: isArabic ? "تم تحديث الاتفاقية" : "Agreement updated",
    activated: isArabic ? "تم تفعيل الاتفاقية" : "Agreement activated",
    deactivated: isArabic ? "تم إلغاء تفعيل الاتفاقية" : "Agreement deactivated",
    actionFailed: isArabic ? "فشل في تنفيذ الإجراء" : "Action failed",
    createdAt: isArabic ? "تاريخ الإنشاء" : "Created",
    updatedAt: isArabic ? "آخر تحديث" : "Last Updated",
  };

  const handleUpdate = async (data: UpdateAgreementRequest) => {
    try {
      await updateMutation.mutateAsync({ id: agreementId, data });
      toast.success(texts.updated);
      router.push(`/${locale}/settings/agreements/${agreementId}`);
    } catch {
      toast.error(texts.actionFailed);
    }
  };

  const handleActivate = async () => {
    try {
      await activateMutation.mutateAsync(agreementId);
      toast.success(texts.activated);
    } catch {
      toast.error(texts.actionFailed);
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync(agreementId);
      toast.success(texts.deactivated);
    } catch {
      toast.error(texts.actionFailed);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/settings/agreements/${agreementId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{texts.notFound}</p>
      </div>
    );
  }

  const title = isArabic ? agreement.title.ar || agreement.title.en : agreement.title.en;
  const typeLabel = TYPE_LABELS[agreement.type];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/settings/agreements`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <Badge variant={agreement.isActive ? "default" : "secondary"}>
                {agreement.isActive ? texts.active : texts.inactive}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[agreement.type]}`}
              >
                {isArabic ? typeLabel.ar : typeLabel.en}
              </span>
              <span className="text-muted-foreground text-sm">
                v{agreement.agreementVersion}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {agreement.isActive ? (
            <Button
              variant="outline"
              onClick={handleDeactivate}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending && (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              )}
              {texts.deactivate}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleActivate}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending && (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              )}
              {texts.activate}
            </Button>
          )}
          {!isEditMode && (
            <Link href={`/${locale}/settings/agreements/${agreementId}?edit=true`}>
              <Button>
                <Edit className="h-4 w-4 me-2" />
                {texts.edit}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isEditMode ? (
        <div className="max-w-3xl">
          <AgreementForm
            agreement={agreement}
            onSubmit={handleUpdate}
            isPending={updateMutation.isPending}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.details}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">{texts.type}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[agreement.type]}`}
                  >
                    {isArabic ? typeLabel.ar : typeLabel.en}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{texts.version}</p>
                  <p className="font-medium font-mono">v{agreement.agreementVersion}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{texts.effectiveDate}</p>
                  <p className="font-medium">
                    {format(new Date(agreement.effectiveDate), "PP", { locale: dateLocale })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{texts.sortOrder}</p>
                  <p className="font-medium">{agreement.sortOrder}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{texts.mandatory}</p>
                  <p className="font-medium">
                    {agreement.isMandatory ? texts.yes : texts.no}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{texts.healthQuestions}</p>
                  <p className="font-medium">
                    {agreement.hasHealthQuestions ? texts.yes : texts.no}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{texts.createdAt}</p>
                  <p className="font-medium">
                    {format(new Date(agreement.createdAt), "PP", { locale: dateLocale })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{texts.updatedAt}</p>
                  <p className="font-medium">
                    {format(new Date(agreement.updatedAt), "PP", { locale: dateLocale })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content English */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.contentEn}</CardTitle>
              <CardDescription>{agreement.title.en}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap bg-muted/50 p-4 rounded-lg"
                dir="ltr"
              >
                {agreement.content.en}
              </div>
            </CardContent>
          </Card>

          {/* Content Arabic */}
          {agreement.content.ar && (
            <Card>
              <CardHeader>
                <CardTitle>{texts.contentAr}</CardTitle>
                <CardDescription>{agreement.title.ar || agreement.title.en}</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap bg-muted/50 p-4 rounded-lg"
                  dir="rtl"
                >
                  {agreement.content.ar}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
