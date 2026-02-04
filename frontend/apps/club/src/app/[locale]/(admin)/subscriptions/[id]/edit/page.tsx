"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  AlertCircle,
  Save,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useSubscription, useUpdateSubscription } from "@liyaqa/shared/queries";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { formatDate } from "@liyaqa/shared/utils";

// Zod schema for edit form
const editSubscriptionSchema = z.object({
  autoRenew: z.boolean(),
  notes: z.string().optional(),
});

type EditSubscriptionFormData = z.infer<typeof editSubscriptionSchema>;

export default function EditSubscriptionPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const { data: subscription, isLoading, error } = useSubscription(id);
  const updateSubscription = useUpdateSubscription();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EditSubscriptionFormData>({
    resolver: zodResolver(editSubscriptionSchema),
    defaultValues: {
      autoRenew: subscription?.autoRenew ?? false,
      notes: subscription?.notes ?? "",
    },
    values: subscription
      ? {
          autoRenew: subscription.autoRenew,
          notes: subscription.notes ?? "",
        }
      : undefined,
  });

  const watchAutoRenew = watch("autoRenew");

  const texts = {
    back: locale === "ar" ? "العودة للاشتراك" : "Back to Subscription",
    editSubscription: locale === "ar" ? "تعديل الاشتراك" : "Edit Subscription",
    editDescription:
      locale === "ar"
        ? "تعديل إعدادات الاشتراك"
        : "Modify subscription settings",
    subscriptionInfo:
      locale === "ar" ? "معلومات الاشتراك" : "Subscription Information",
    plan: locale === "ar" ? "الخطة" : "Plan",
    status: locale === "ar" ? "الحالة" : "Status",
    dates: locale === "ar" ? "التواريخ" : "Dates",
    settings: locale === "ar" ? "الإعدادات" : "Settings",
    autoRenew: locale === "ar" ? "التجديد التلقائي" : "Auto Renew",
    autoRenewDescription:
      locale === "ar"
        ? "تجديد الاشتراك تلقائيا عند انتهائه"
        : "Automatically renew subscription when it expires",
    notes: locale === "ar" ? "ملاحظات" : "Notes",
    notesPlaceholder:
      locale === "ar"
        ? "ملاحظات إضافية حول هذا الاشتراك..."
        : "Additional notes about this subscription...",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    save: locale === "ar" ? "حفظ التغييرات" : "Save Changes",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    success: locale === "ar" ? "تم التحديث" : "Updated",
    successDesc:
      locale === "ar"
        ? "تم تحديث الاشتراك بنجاح"
        : "Subscription updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    loadError:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل الاشتراك"
        : "Error loading subscription",
    notFound: locale === "ar" ? "الاشتراك غير موجود" : "Subscription not found",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    endDate: locale === "ar" ? "تاريخ الانتهاء" : "End Date",
  };

  const onSubmit = (data: EditSubscriptionFormData) => {
    updateSubscription.mutate(
      { id, data },
      {
        onSuccess: () => {
          toast({
            title: texts.success,
            description: texts.successDesc,
          });
          router.push(`/${locale}/subscriptions/${id}`);
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description:
              error instanceof Error
                ? error.message
                : "Failed to update subscription",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-4" />
          <p className="text-destructive">
            {error ? texts.loadError : texts.notFound}
          </p>
          <Button asChild className="mt-4">
            <Link href={`/${locale}/subscriptions`}>{texts.back}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/subscriptions/${id}`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{texts.editSubscription}</h1>
            <p className="text-muted-foreground">{texts.editDescription}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Subscription Info (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {texts.subscriptionInfo}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {texts.plan}
                </p>
                <p className="text-lg">
                  {subscription.planName ? (
                    <LocalizedText text={subscription.planName} />
                  ) : (
                    "-"
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {texts.status}
                </p>
                <StatusBadge status={subscription.status} locale={locale} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {texts.dates}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {texts.startDate}
                </p>
                <p className="text-lg">
                  {formatDate(subscription.startDate, locale)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {texts.endDate}
                </p>
                <p className="text-lg">
                  {formatDate(subscription.endDate, locale)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editable Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.settings}</CardTitle>
            <CardDescription>{texts.editDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto Renew Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="autoRenew" className="text-base font-medium">
                  {texts.autoRenew}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {texts.autoRenewDescription}
                </p>
              </div>
              <Switch
                id="autoRenew"
                checked={watchAutoRenew}
                onCheckedChange={(checked) => setValue("autoRenew", checked, { shouldDirty: true })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{texts.notes}</Label>
              <Textarea
                id="notes"
                placeholder={texts.notesPlaceholder}
                rows={4}
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/${locale}/subscriptions/${id}`}>{texts.cancel}</Link>
          </Button>
          <Button
            type="submit"
            disabled={updateSubscription.isPending || !isDirty}
          >
            <Save className="me-2 h-4 w-4" />
            {updateSubscription.isPending ? texts.saving : texts.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
