"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  User,
  Calendar,
  CreditCard,
  Snowflake,
  Sun,
  XCircle,
  RefreshCw,
  Clock,
  AlertCircle,
  Receipt,
  Edit,
  Trash2,
  Gift,
  History,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { FreezeSubscriptionDialog } from "@liyaqa/shared/components/dialogs/freeze-subscription-dialog";
import { GrantFreezeDaysDialog } from "@liyaqa/shared/components/dialogs/grant-freeze-days-dialog";
import {
  useSubscription,
  useUnfreezeSubscription,
  useCancelSubscription,
  useRenewSubscription,
  useDeleteSubscription,
  useCreateInvoiceFromSubscription,
} from "@liyaqa/shared/queries";
import {
  useSubscriptionFreezeBalance,
  useSubscriptionFreezeHistory,
} from "@liyaqa/shared/queries/use-freeze-packages";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { formatDate } from "@liyaqa/shared/utils";
import type { FreezeType } from "@liyaqa/shared/types/freeze";

export default function SubscriptionDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  // Dialog states
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);

  const { data: subscription, isLoading, error, refetch } = useSubscription(id);
  const { data: freezeBalance, refetch: refetchBalance } = useSubscriptionFreezeBalance(id);
  const { data: freezeHistory } = useSubscriptionFreezeHistory(id, { page: 0, size: 5 });

  const unfreezeSubscription = useUnfreezeSubscription();
  const cancelSubscription = useCancelSubscription();
  const renewSubscription = useRenewSubscription();
  const deleteSubscription = useDeleteSubscription();
  const createInvoice = useCreateInvoiceFromSubscription();

  const texts = {
    back: locale === "ar" ? "العودة للاشتراكات" : "Back to Subscriptions",
    subscriptionDetails:
      locale === "ar" ? "تفاصيل الاشتراك" : "Subscription Details",
    member: locale === "ar" ? "العضو" : "Member",
    plan: locale === "ar" ? "الخطة" : "Plan",
    status: locale === "ar" ? "الحالة" : "Status",
    type: locale === "ar" ? "النوع" : "Type",
    unlimited: locale === "ar" ? "غير محدود" : "Unlimited",
    limited: locale === "ar" ? "محدود" : "Limited",
    dates: locale === "ar" ? "التواريخ" : "Dates",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    endDate: locale === "ar" ? "تاريخ الانتهاء" : "End Date",
    remainingClasses: locale === "ar" ? "الحصص المتبقية" : "Remaining Classes",
    classes: locale === "ar" ? "حصة" : "classes",
    freezeInfo: locale === "ar" ? "معلومات التجميد" : "Freeze Information",
    freezeStartDate:
      locale === "ar" ? "تاريخ بدء التجميد" : "Freeze Start Date",
    freezeEndDate:
      locale === "ar" ? "تاريخ انتهاء التجميد" : "Freeze End Date",
    totalFrozenDays:
      locale === "ar" ? "إجمالي أيام التجميد" : "Total Frozen Days",
    days: locale === "ar" ? "يوم" : "days",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    freeze: locale === "ar" ? "تجميد" : "Freeze",
    unfreeze: locale === "ar" ? "إلغاء التجميد" : "Unfreeze",
    cancel: locale === "ar" ? "إلغاء الاشتراك" : "Cancel Subscription",
    renew: locale === "ar" ? "تجديد الاشتراك" : "Renew Subscription",
    error:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل الاشتراك"
        : "Error loading subscription",
    notFound:
      locale === "ar" ? "الاشتراك غير موجود" : "Subscription not found",
    confirmCancel:
      locale === "ar"
        ? "هل أنت متأكد من إلغاء هذا الاشتراك؟"
        : "Are you sure you want to cancel this subscription?",
    confirmDelete:
      locale === "ar"
        ? "هل أنت متأكد من حذف هذا الاشتراك؟"
        : "Are you sure you want to delete this subscription?",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created At",
    updatedAt: locale === "ar" ? "آخر تحديث" : "Last Updated",
    createInvoice: locale === "ar" ? "إنشاء فاتورة" : "Create Invoice",
    edit: locale === "ar" ? "تعديل" : "Edit",
    delete: locale === "ar" ? "حذف" : "Delete",
    invoiceCreated: locale === "ar" ? "تم إنشاء الفاتورة" : "Invoice Created",
    invoiceCreatedDesc:
      locale === "ar"
        ? "تم إنشاء الفاتورة بنجاح"
        : "Invoice created successfully",
    subscriptionDeleted:
      locale === "ar" ? "تم حذف الاشتراك" : "Subscription Deleted",
    subscriptionDeletedDesc:
      locale === "ar"
        ? "تم حذف الاشتراك بنجاح"
        : "Subscription deleted successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    grantFreezeDays: locale === "ar" ? "منح أيام تجميد" : "Grant Freeze Days",
    freezeBalance: locale === "ar" ? "رصيد التجميد" : "Freeze Balance",
    availableDays: locale === "ar" ? "أيام متاحة" : "Available Days",
    usedDays: locale === "ar" ? "أيام مستخدمة" : "Used Days",
    totalDays: locale === "ar" ? "إجمالي الأيام" : "Total Days",
    freezeHistory: locale === "ar" ? "سجل التجميد" : "Freeze History",
    noFreezeHistory: locale === "ar" ? "لا يوجد سجل تجميد" : "No freeze history",
    freezeTypes: {
      MEDICAL: locale === "ar" ? "طبي" : "Medical",
      TRAVEL: locale === "ar" ? "سفر" : "Travel",
      PERSONAL: locale === "ar" ? "شخصي" : "Personal",
      MILITARY: locale === "ar" ? "عسكري" : "Military",
      OTHER: locale === "ar" ? "أخرى" : "Other",
    },
    active: locale === "ar" ? "نشط" : "Active",
    ended: locale === "ar" ? "منتهي" : "Ended",
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
            {error ? texts.error : texts.notFound}
          </p>
          <Button asChild className="mt-4">
            <Link href={`/${locale}/subscriptions`}>{texts.back}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleUnfreeze = () => {
    unfreezeSubscription.mutate(subscription.id);
  };

  const handleCancel = () => {
    if (confirm(texts.confirmCancel)) {
      cancelSubscription.mutate(subscription.id);
    }
  };

  const handleRenew = () => {
    renewSubscription.mutate({ id: subscription.id }, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleCreateInvoice = () => {
    createInvoice.mutate(subscription.id, {
      onSuccess: (invoice) => {
        toast({
          title: texts.invoiceCreated,
          description: `${texts.invoiceCreatedDesc} - ${invoice.invoiceNumber}`,
        });
        router.push(`/${locale}/invoices/${invoice.id}`);
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description:
            error instanceof Error ? error.message : "Failed to create invoice",
          variant: "destructive",
        });
      },
    });
  };

  const handleDelete = () => {
    if (confirm(texts.confirmDelete)) {
      deleteSubscription.mutate(subscription.id, {
        onSuccess: () => {
          toast({
            title: texts.subscriptionDeleted,
            description: texts.subscriptionDeletedDesc,
          });
          router.push(`/${locale}/subscriptions`);
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description:
              error instanceof Error
                ? error.message
                : "Failed to delete subscription",
            variant: "destructive",
          });
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/subscriptions`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {texts.subscriptionDetails}
            </h1>
            <StatusBadge status={subscription.status} locale={locale} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Edit button - always available */}
          <Button variant="outline" asChild>
            <Link href={`/${locale}/subscriptions/${subscription.id}/edit`}>
              <Edit className="me-2 h-4 w-4" />
              {texts.edit}
            </Link>
          </Button>

          {/* Create Invoice - for PENDING, PENDING_PAYMENT, ACTIVE (only if no invoice exists) */}
          {(subscription.status === "PENDING" ||
            subscription.status === "PENDING_PAYMENT" ||
            subscription.status === "ACTIVE") && (
            <Button
              variant="outline"
              onClick={handleCreateInvoice}
              disabled={createInvoice.isPending || !!subscription.invoiceId}
            >
              <Receipt className="me-2 h-4 w-4" />
              {subscription.invoiceId ? texts.invoiceCreated : texts.createInvoice}
            </Button>
          )}

          {/* Grant Freeze Days - for ACTIVE or FROZEN */}
          {(subscription.status === "ACTIVE" ||
            subscription.status === "FROZEN") && (
            <Button
              variant="outline"
              onClick={() => setGrantDialogOpen(true)}
            >
              <Gift className="me-2 h-4 w-4" />
              {texts.grantFreezeDays}
            </Button>
          )}

          {/* Freeze - for ACTIVE only */}
          {subscription.status === "ACTIVE" && (
            <Button
              variant="outline"
              onClick={() => setFreezeDialogOpen(true)}
            >
              <Snowflake className="me-2 h-4 w-4" />
              {texts.freeze}
            </Button>
          )}

          {/* Unfreeze - for FROZEN only */}
          {subscription.status === "FROZEN" && (
            <Button
              variant="outline"
              onClick={handleUnfreeze}
              disabled={unfreezeSubscription.isPending}
            >
              <Sun className="me-2 h-4 w-4" />
              {texts.unfreeze}
            </Button>
          )}

          {/* Renew - for EXPIRED or CANCELLED */}
          {(subscription.status === "EXPIRED" ||
            subscription.status === "CANCELLED") && (
            <Button onClick={handleRenew} disabled={renewSubscription.isPending}>
              <RefreshCw className="me-2 h-4 w-4" />
              {texts.renew}
            </Button>
          )}

          {/* Cancel - for ACTIVE or FROZEN */}
          {(subscription.status === "ACTIVE" ||
            subscription.status === "FROZEN") && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelSubscription.isPending}
            >
              <XCircle className="me-2 h-4 w-4" />
              {texts.cancel}
            </Button>
          )}

          {/* Delete - for CANCELLED or EXPIRED only */}
          {(subscription.status === "CANCELLED" ||
            subscription.status === "EXPIRED") && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSubscription.isPending}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {texts.delete}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Member Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {texts.member}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/${locale}/members/${subscription.memberId}`}
              className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <p className="font-medium text-lg">
                {locale === "ar" ? "عرض تفاصيل العضو" : "View Member Details"}
              </p>
            </Link>
          </CardContent>
        </Card>

        {/* Plan Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {texts.plan}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/${locale}/plans/${subscription.planId}`}
              className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <p className="font-medium text-lg">
                {subscription.planName ? (
                  <LocalizedText text={subscription.planName} />
                ) : (
                  locale === "ar" ? "عرض الخطة" : "View Plan"
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {subscription.classesRemaining === undefined
                  ? texts.unlimited
                  : texts.limited}
              </p>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {texts.dates}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
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
            {subscription.classesRemaining !== undefined && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {texts.remainingClasses}
                </p>
                <p className="text-lg">
                  {subscription.classesRemaining} {texts.classes}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Freeze Information (if subscription has been frozen) */}
      {(subscription.freezeDaysRemaining > 0 ||
        subscription.frozenAt ||
        subscription.status === "FROZEN") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Snowflake className="h-5 w-5" />
              {texts.freezeInfo}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {subscription.frozenAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {locale === "ar" ? "تاريخ التجميد" : "Frozen At"}
                  </p>
                  <p className="text-lg">
                    {formatDate(subscription.frozenAt, locale)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {locale === "ar" ? "أيام التجميد المتبقية" : "Freeze Days Remaining"}
                </p>
                <p className="text-lg">
                  {subscription.freezeDaysRemaining} {texts.days}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Freeze Balance Card */}
      {freezeBalance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-blue-500" />
              {texts.freezeBalance}
            </CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "رصيد أيام التجميد المتاح للاستخدام"
                : "Available freeze days balance for use"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">{texts.availableDays}</p>
                <p className="text-3xl font-bold text-blue-600">
                  {freezeBalance.availableDays}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">{texts.usedDays}</p>
                <p className="text-3xl font-bold text-slate-600">
                  {freezeBalance.usedFreezeDays}
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-muted-foreground">{texts.totalDays}</p>
                <p className="text-3xl font-bold">
                  {freezeBalance.totalFreezeDays}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Freeze History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {texts.freezeHistory}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!freezeHistory?.content?.length ? (
            <p className="text-center py-6 text-muted-foreground">
              {texts.noFreezeHistory}
            </p>
          ) : (
            <div className="space-y-3">
              {freezeHistory.content.map((history) => (
                <div
                  key={history.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={history.isActive ? "default" : "secondary"}>
                        {history.isActive ? texts.active : texts.ended}
                      </Badge>
                      <Badge variant="outline">
                        {texts.freezeTypes[history.freezeType as FreezeType] ||
                          history.freezeType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(history.freezeStartDate, locale)}
                      {history.freezeEndDate &&
                        ` - ${formatDate(history.freezeEndDate, locale)}`}
                    </p>
                    {history.reason && (
                      <p className="text-sm mt-1">{history.reason}</p>
                    )}
                  </div>
                  <div className="text-end">
                    <p className="text-lg font-bold">
                      {history.freezeDays} {texts.days}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {locale === "ar" ? "معلومات إضافية" : "Additional Information"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {texts.createdAt}
              </p>
              <p>{formatDate(subscription.createdAt, locale)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {texts.updatedAt}
              </p>
              <p>{formatDate(subscription.updatedAt, locale)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Freeze Subscription Dialog */}
      <FreezeSubscriptionDialog
        open={freezeDialogOpen}
        onOpenChange={setFreezeDialogOpen}
        subscriptionId={subscription.id}
        memberId={subscription.memberId}
        onSuccess={() => {
          refetch();
          refetchBalance();
        }}
      />

      {/* Grant Freeze Days Dialog */}
      <GrantFreezeDaysDialog
        open={grantDialogOpen}
        onOpenChange={setGrantDialogOpen}
        subscriptionId={subscription.id}
        memberId={subscription.memberId}
        onSuccess={() => {
          refetch();
          refetchBalance();
        }}
      />
    </div>
  );
}
