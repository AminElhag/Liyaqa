"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Package, Edit, Play, Pause, Trash2, Gift } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@liyaqa/shared/components/ui/alert-dialog";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useClassPack,
  useUpdateClassPack,
  useActivateClassPack,
  useDeactivateClassPack,
  useDeleteClassPack,
} from "@liyaqa/shared/queries";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";
import {
  ClassPackForm,
  type ClassPackFormData,
} from "@/components/admin/class-pack-form";
import { GrantPackToMemberDialog } from "@/components/admin/grant-pack-to-member-dialog";

const texts = {
  en: {
    back: "Back to Class Packs",
    edit: "Edit",
    activate: "Activate",
    deactivate: "Deactivate",
    delete: "Delete",
    deleteConfirmTitle: "Delete Class Pack",
    deleteConfirmDesc: "Are you sure you want to delete this class pack? This action cannot be undone.",
    cancel: "Cancel",
    confirm: "Delete",
    packActivated: "Class pack activated",
    packDeactivated: "Class pack deactivated",
    packDeleted: "Class pack deleted",
    packUpdated: "Class pack updated",
    errorLoading: "Error loading class pack",
    notFound: "Class pack not found",
    details: "Details",
    credits: "Credits",
    price: "Price",
    priceWithTax: "Price (incl. tax)",
    taxRate: "Tax Rate",
    validity: "Validity",
    noExpiry: "No expiry",
    days: "days",
    classes: "classes",
    sortOrder: "Sort Order",
    editMode: "Edit Mode",
    viewMode: "View Mode",
    assignToMember: "Assign to Member",
  },
  ar: {
    back: "العودة لباقات الحصص",
    edit: "تعديل",
    activate: "تفعيل",
    deactivate: "تعطيل",
    delete: "حذف",
    deleteConfirmTitle: "حذف الباقة",
    deleteConfirmDesc: "هل أنت متأكد من حذف هذه الباقة؟ لا يمكن التراجع عن هذا الإجراء.",
    cancel: "إلغاء",
    confirm: "حذف",
    packActivated: "تم تفعيل الباقة",
    packDeactivated: "تم تعطيل الباقة",
    packDeleted: "تم حذف الباقة",
    packUpdated: "تم تحديث الباقة",
    errorLoading: "حدث خطأ أثناء تحميل الباقة",
    notFound: "الباقة غير موجودة",
    details: "التفاصيل",
    credits: "الحصص",
    price: "السعر",
    priceWithTax: "السعر (شامل الضريبة)",
    taxRate: "نسبة الضريبة",
    validity: "الصلاحية",
    noExpiry: "بدون انتهاء",
    days: "أيام",
    classes: "حصص",
    sortOrder: "ترتيب العرض",
    editMode: "وضع التعديل",
    viewMode: "وضع العرض",
    assignToMember: "تعيين لعضو",
  },
};

export default function ClassPackDetailPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const t = texts[locale];
  const isRTL = locale === "ar";
  const packId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);

  // Fetch pack
  const { data: pack, isLoading, error: loadError } = useClassPack(packId);

  // Mutations
  const updatePack = useUpdateClassPack();
  const activatePack = useActivateClassPack();
  const deactivatePack = useDeactivateClassPack();
  const deletePack = useDeleteClassPack();

  const handleUpdate = async (data: ClassPackFormData) => {
    setError(null);
    try {
      await updatePack.mutateAsync({
        id: packId,
        data: {
          nameEn: data.nameEn,
          nameAr: data.nameAr || undefined,
          descriptionEn: data.descriptionEn || undefined,
          descriptionAr: data.descriptionAr || undefined,
          classCount: data.classCount,
          priceAmount: data.priceAmount,
          priceCurrency: data.priceCurrency,
          taxRate: data.taxRate,
          validityDays: data.validityDays || undefined,
          sortOrder: data.sortOrder,
          imageUrl: data.imageUrl || undefined,
        },
      });
      toast({ title: t.packUpdated });
      setIsEditing(false);
    } catch (err) {
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
    }
  };

  const handleActivate = async () => {
    try {
      await activatePack.mutateAsync(packId);
      toast({ title: t.packActivated });
    } catch (err) {
      const apiError = await parseApiError(err);
      toast({ title: getLocalizedErrorMessage(apiError, locale), variant: "destructive" });
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivatePack.mutateAsync(packId);
      toast({ title: t.packDeactivated });
    } catch (err) {
      const apiError = await parseApiError(err);
      toast({ title: getLocalizedErrorMessage(apiError, locale), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePack.mutateAsync(packId);
      toast({ title: t.packDeleted });
      router.push(`/${locale}/class-packs`);
    } catch (err) {
      const apiError = await parseApiError(err);
      toast({ title: getLocalizedErrorMessage(apiError, locale), variant: "destructive" });
    }
  };

  const formatPrice = (price: { amount: number; currency: string }) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: price.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price.amount);
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (loadError || !pack) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {loadError ? t.errorLoading : t.notFound}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/${locale}/class-packs`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {t.back}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                "bg-gradient-to-br from-emerald-100 to-teal-100",
                "dark:from-emerald-900/40 dark:to-teal-900/40"
              )}
            >
              <Package className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  <LocalizedText text={pack.name} />
                </h1>
                <StatusBadge status={pack.status} locale={locale} />
              </div>
              {pack.description && (
                <p className="text-muted-foreground mt-1">
                  <LocalizedText text={pack.description} />
                </p>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 me-2" />
                {t.edit}
              </Button>
              {pack.status === "ACTIVE" && (
                <Button variant="outline" onClick={() => setGrantDialogOpen(true)}>
                  <Gift className="h-4 w-4 me-2" />
                  {t.assignToMember}
                </Button>
              )}
              {pack.status === "ACTIVE" ? (
                <Button variant="outline" onClick={handleDeactivate}>
                  <Pause className="h-4 w-4 me-2" />
                  {t.deactivate}
                </Button>
              ) : (
                <Button variant="outline" onClick={handleActivate}>
                  <Play className="h-4 w-4 me-2" />
                  {t.activate}
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 me-2" />
                    {t.delete}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{t.deleteConfirmDesc}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>{t.confirm}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{t.editMode}</Badge>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              {t.viewMode}
            </Button>
          </div>
          <ClassPackForm
            initialData={pack}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isSubmitting={updatePack.isPending}
          />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t.details}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">{t.credits}</p>
                <p className="text-lg font-semibold">
                  {pack.classCount} {t.classes}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.price}</p>
                <p className="text-lg font-semibold">{formatPrice(pack.price)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.priceWithTax}</p>
                <p className="text-lg font-semibold">{formatPrice(pack.priceWithTax)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.taxRate}</p>
                <p className="text-lg font-semibold">{pack.taxRate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.validity}</p>
                <p className="text-lg font-semibold">
                  {pack.validityDays ? `${pack.validityDays} ${t.days}` : t.noExpiry}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.sortOrder}</p>
                <p className="text-lg font-semibold">{pack.sortOrder}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grant Pack to Member Dialog */}
      {pack && (
        <GrantPackToMemberDialog
          open={grantDialogOpen}
          onOpenChange={setGrantDialogOpen}
          classPack={pack}
          locale={locale}
        />
      )}
    </div>
  );
}
