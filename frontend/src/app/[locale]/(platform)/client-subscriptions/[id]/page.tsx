"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  PauseCircle,
  XCircle,
  RefreshCw,
  ArrowRightLeft,
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  Building2,
  Package,
  User,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/spinner";
import { SubscriptionStatusBadge } from "@/components/platform/subscription-status-badge";
import { RenewSubscriptionDialog } from "@/components/platform/renew-subscription-dialog";
import { ChangePlanDialog } from "@/components/platform/change-plan-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import {
  useClientSubscription,
  useActivateClientSubscription,
  useSuspendClientSubscription,
  useCancelClientSubscription,
} from "@/queries/platform/use-client-subscriptions";
import { usePlatformClient } from "@/queries/platform/use-platform-clients";
import { useClientPlan } from "@/queries/platform/use-client-plans";
import type { BillingCycle } from "@/types/platform/client-plan";
import type { LocalizedText, Money } from "@/types/api";

const BILLING_CYCLE_LABELS: Record<BillingCycle, { en: string; ar: string }> = {
  MONTHLY: { en: "Monthly", ar: "شهري" },
  QUARTERLY: { en: "Quarterly", ar: "ربع سنوي" },
  ANNUAL: { en: "Annual", ar: "سنوي" },
};

/**
 * Get localized text based on locale.
 */
function getLocalizedText(text: LocalizedText | undefined, locale: string): string {
  if (!text) return "-";
  return locale === "ar" ? text.ar || text.en : text.en;
}

export default function ClientSubscriptionDetailPage() {
  const params = useParams();
  const subscriptionId = params.id as string;
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Permissions
  const canEdit = user?.role === "PLATFORM_ADMIN";

  // Data fetching
  const { data: subscription, isLoading, error } = useClientSubscription(subscriptionId);

  // Fetch related data
  const { data: organization } = usePlatformClient(subscription?.organizationId || "");
  const { data: plan } = useClientPlan(subscription?.clientPlanId || "");

  // Mutations
  const activateSubscription = useActivateClientSubscription();
  const suspendSubscription = useSuspendClientSubscription();
  const cancelSubscription = useCancelClientSubscription();

  // Dialog state
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);

  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    suspend: locale === "ar" ? "تعليق" : "Suspend",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    renew: locale === "ar" ? "تجديد" : "Renew",
    changePlan: locale === "ar" ? "تغيير الخطة" : "Change Plan",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    notFound: locale === "ar" ? "الاشتراك غير موجود" : "Subscription not found",
    errorLoading:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",

    // Sections
    orgAndPlan: locale === "ar" ? "المؤسسة والخطة" : "Organization & Plan",
    pricing: locale === "ar" ? "التسعير" : "Pricing",
    contractTerms: locale === "ar" ? "شروط العقد" : "Contract Terms",
    trialInfo: locale === "ar" ? "معلومات التجربة" : "Trial Information",
    salesTracking: locale === "ar" ? "تتبع المبيعات" : "Sales Tracking",
    notes: locale === "ar" ? "ملاحظات" : "Notes",
    timestamps: locale === "ar" ? "التواريخ" : "Timestamps",

    // Fields
    organization: locale === "ar" ? "المؤسسة" : "Organization",
    plan: locale === "ar" ? "الخطة" : "Plan",
    agreedPrice: locale === "ar" ? "السعر المتفق عليه" : "Agreed Price",
    effectiveMonthly: locale === "ar" ? "الشهري الفعلي" : "Effective Monthly",
    discount: locale === "ar" ? "الخصم" : "Discount",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    endDate: locale === "ar" ? "تاريخ الانتهاء" : "End Date",
    contractMonths: locale === "ar" ? "مدة العقد" : "Contract Duration",
    billingCycle: locale === "ar" ? "دورة الفوترة" : "Billing Cycle",
    autoRenew: locale === "ar" ? "تجديد تلقائي" : "Auto Renew",
    remainingDays: locale === "ar" ? "الأيام المتبقية" : "Remaining Days",
    trialStatus: locale === "ar" ? "حالة التجربة" : "Trial Status",
    trialEndsAt: locale === "ar" ? "انتهاء التجربة" : "Trial Ends At",
    remainingTrialDays: locale === "ar" ? "أيام التجربة المتبقية" : "Remaining Trial Days",
    salesRepId: locale === "ar" ? "مندوب المبيعات" : "Sales Rep",
    dealId: locale === "ar" ? "الصفقة" : "Deal",
    notesEn: locale === "ar" ? "ملاحظات (إنجليزي)" : "Notes (English)",
    notesAr: locale === "ar" ? "ملاحظات (عربي)" : "Notes (Arabic)",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created At",
    updatedAt: locale === "ar" ? "آخر تحديث" : "Last Updated",

    // Values
    months: locale === "ar" ? "شهر" : "months",
    days: locale === "ar" ? "يوم" : "days",
    yes: locale === "ar" ? "نعم" : "Yes",
    no: locale === "ar" ? "لا" : "No",
    inTrial: locale === "ar" ? "في فترة التجربة" : "In Trial",
    notInTrial: locale === "ar" ? "ليس في تجربة" : "Not in Trial",
    noNotes: locale === "ar" ? "لا توجد ملاحظات" : "No notes",
    notSet: locale === "ar" ? "غير محدد" : "Not set",

    // Actions
    activateSuccess: locale === "ar" ? "تم تفعيل الاشتراك" : "Subscription activated",
    suspendSuccess: locale === "ar" ? "تم تعليق الاشتراك" : "Subscription suspended",
    cancelSuccess: locale === "ar" ? "تم إلغاء الاشتراك" : "Subscription cancelled",
    suspendConfirm:
      locale === "ar"
        ? "هل أنت متأكد من تعليق هذا الاشتراك؟"
        : "Are you sure you want to suspend this subscription?",
    cancelConfirm:
      locale === "ar"
        ? "هل أنت متأكد من إلغاء هذا الاشتراك؟ لا يمكن التراجع عن هذا الإجراء."
        : "Are you sure you want to cancel this subscription? This action cannot be undone.",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    comingSoon: locale === "ar" ? "قريباً" : "Coming soon",
  };

  const formatCurrency = (money: Money) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: money.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(money.amount);

  const formatDate = (dateString: string, includeTime = false) =>
    new Date(dateString).toLocaleDateString(
      locale === "ar" ? "ar-SA" : "en-SA",
      includeTime
        ? {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        : {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
    );

  // Handlers
  const handleActivate = () => {
    activateSubscription.mutate(subscriptionId, {
      onSuccess: () => {
        toast({ title: texts.activateSuccess });
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleSuspend = () => {
    if (!confirm(texts.suspendConfirm)) return;

    suspendSubscription.mutate(subscriptionId, {
      onSuccess: () => {
        toast({ title: texts.suspendSuccess });
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleCancel = () => {
    if (!confirm(texts.cancelConfirm)) return;

    cancelSubscription.mutate(subscriptionId, {
      onSuccess: () => {
        toast({ title: texts.cancelSuccess });
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleRenew = () => {
    setRenewDialogOpen(true);
  };

  const handleChangePlan = () => {
    setChangePlanDialogOpen(true);
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
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorLoading : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  const status = subscription.status;

  // Action availability based on status
  const canActivate = ["TRIAL", "SUSPENDED"].includes(status);
  const canSuspend = status === "ACTIVE";
  const canCancelSub = ["ACTIVE", "SUSPENDED"].includes(status);
  const canRenewSub = ["ACTIVE", "SUSPENDED", "EXPIRED"].includes(status);
  const canChangePlanSub = status === "ACTIVE";
  const canEditSub = !["CANCELLED", "EXPIRED"].includes(status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/client-subscriptions`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                {organization
                  ? getLocalizedText(organization.name, locale)
                  : `${texts.organization} #${subscription.organizationId.slice(0, 8)}`}
              </h1>
              <SubscriptionStatusBadge status={subscription.status} />
            </div>
            {plan && (
              <p className="mt-1 text-muted-foreground">
                {getLocalizedText(plan.name, locale)}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {canEditSub && (
              <Button variant="outline" asChild>
                <Link href={`/${locale}/client-subscriptions/${subscriptionId}/edit`}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </Link>
              </Button>
            )}
            {canActivate && (
              <Button
                variant="outline"
                onClick={handleActivate}
                disabled={activateSubscription.isPending}
              >
                <CheckCircle className="me-2 h-4 w-4 text-green-600" />
                {texts.activate}
              </Button>
            )}
            {canSuspend && (
              <Button
                variant="outline"
                onClick={handleSuspend}
                disabled={suspendSubscription.isPending}
                className="text-amber-600"
              >
                <PauseCircle className="me-2 h-4 w-4" />
                {texts.suspend}
              </Button>
            )}
            {canChangePlanSub && (
              <Button variant="outline" onClick={handleChangePlan}>
                <ArrowRightLeft className="me-2 h-4 w-4 text-blue-600" />
                {texts.changePlan}
              </Button>
            )}
            {canRenewSub && (
              <Button variant="outline" onClick={handleRenew}>
                <RefreshCw className="me-2 h-4 w-4 text-primary" />
                {texts.renew}
              </Button>
            )}
            {canCancelSub && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelSubscription.isPending}
              >
                <XCircle className="me-2 h-4 w-4" />
                {texts.cancel}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization & Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>{texts.orgAndPlan}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.organization}</p>
                <p className="font-medium">
                  {organization
                    ? getLocalizedText(organization.name, locale)
                    : subscription.organizationId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.plan}</p>
                <p className="font-medium">
                  {plan
                    ? getLocalizedText(plan.name, locale)
                    : subscription.clientPlanId}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>{texts.pricing}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.agreedPrice}</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(subscription.agreedPrice)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.effectiveMonthly}</p>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(subscription.effectiveMonthlyPrice)}
                </p>
              </div>
            </div>
            {subscription.discountPercentage && subscription.discountPercentage > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground">{texts.discount}</p>
                <p className="text-lg font-semibold text-green-700">
                  {subscription.discountPercentage}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Terms Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>{texts.contractTerms}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.startDate}</p>
                <p className="font-medium">{formatDate(subscription.startDate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.endDate}</p>
                <p className="font-medium">{formatDate(subscription.endDate)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.contractMonths}</p>
                <p className="font-medium">
                  {subscription.contractMonths} {texts.months}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.billingCycle}</p>
                <p className="font-medium">
                  {locale === "ar"
                    ? BILLING_CYCLE_LABELS[subscription.billingCycle].ar
                    : BILLING_CYCLE_LABELS[subscription.billingCycle].en}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.autoRenew}</p>
                <p className="font-medium">
                  {subscription.autoRenew ? texts.yes : texts.no}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.remainingDays}</p>
                <p
                  className={`font-medium ${
                    subscription.remainingDays <= 0
                      ? "text-destructive"
                      : subscription.remainingDays <= 30
                      ? "text-amber-600"
                      : "text-green-600"
                  }`}
                >
                  {subscription.remainingDays} {texts.days}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>{texts.trialInfo}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.trialStatus}</p>
                <p className={`font-medium ${subscription.isInTrial ? "text-blue-600" : ""}`}>
                  {subscription.isInTrial ? texts.inTrial : texts.notInTrial}
                </p>
              </div>
            </div>
            {subscription.trialEndsAt && (
              <>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{texts.trialEndsAt}</p>
                    <p className="font-medium">{formatDate(subscription.trialEndsAt)}</p>
                  </div>
                </div>
                {subscription.remainingTrialDays !== undefined && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-muted-foreground">
                      {texts.remainingTrialDays}
                    </p>
                    <p className="text-lg font-semibold text-blue-700">
                      {subscription.remainingTrialDays} {texts.days}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Sales Tracking Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>{texts.salesTracking}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.salesRepId}</p>
                <p className="font-medium">
                  {subscription.salesRepId || texts.notSet}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.dealId}</p>
                <p className="font-medium">{subscription.dealId || texts.notSet}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        {subscription.notes && (subscription.notes.en || subscription.notes.ar) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>{texts.notes}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription.notes.en && (
                <div>
                  <p className="text-sm text-muted-foreground">{texts.notesEn}</p>
                  <p className="mt-1 whitespace-pre-wrap">{subscription.notes.en}</p>
                </div>
              )}
              {subscription.notes.ar && (
                <div>
                  <p className="text-sm text-muted-foreground">{texts.notesAr}</p>
                  <p className="mt-1 whitespace-pre-wrap" dir="rtl">
                    {subscription.notes.ar}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timestamps Card (Full Width) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>{texts.timestamps}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.createdAt}</p>
                  <p className="font-medium">{formatDate(subscription.createdAt, true)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.updatedAt}</p>
                  <p className="font-medium">{formatDate(subscription.updatedAt, true)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <RenewSubscriptionDialog
        subscription={subscription}
        open={renewDialogOpen}
        onOpenChange={setRenewDialogOpen}
      />

      <ChangePlanDialog
        subscription={subscription}
        open={changePlanDialogOpen}
        onOpenChange={setChangePlanDialogOpen}
      />
    </div>
  );
}
