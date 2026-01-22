"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Package,
  DollarSign,
  Building2,
  Users,
  Calendar,
  Zap,
  BarChart3,
  Code,
  HeadphonesIcon,
  Palette,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/spinner";
import { getLocalizedText } from "@/lib/utils";
import { PlanStatusBadge } from "@/components/platform/plan-status-badge";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import {
  useClientPlan,
  useActivateClientPlan,
  useDeactivateClientPlan,
  useDeleteClientPlan,
} from "@/queries/platform/use-client-plans";
import type { BillingCycle } from "@/types/platform/client-plan";

const BILLING_CYCLE_LABELS: Record<BillingCycle, { en: string; ar: string }> = {
  MONTHLY: { en: "Monthly", ar: "شهري" },
  QUARTERLY: { en: "Quarterly", ar: "ربع سنوي" },
  ANNUAL: { en: "Annual", ar: "سنوي" },
};

export default function ClientPlanDetailPage() {
  const params = useParams();
  const planId = params.id as string;
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Permissions
  const canEdit = user?.role === "PLATFORM_ADMIN";

  // Data fetching
  const { data: plan, isLoading, error } = useClientPlan(planId);

  // Mutations
  const activatePlan = useActivateClientPlan();
  const deactivatePlan = useDeactivateClientPlan();
  const deletePlan = useDeleteClientPlan();

  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    delete: locale === "ar" ? "حذف" : "Delete",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    notFound: locale === "ar" ? "الخطة غير موجودة" : "Plan not found",
    errorLoading:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",

    // Sections
    pricing: locale === "ar" ? "التسعير" : "Pricing",
    limits: locale === "ar" ? "حدود الاستخدام" : "Usage Limits",
    features: locale === "ar" ? "الميزات" : "Features",
    timestamps: locale === "ar" ? "التواريخ" : "Timestamps",

    // Pricing fields
    monthlyPrice: locale === "ar" ? "السعر الشهري" : "Monthly Price",
    annualPrice: locale === "ar" ? "السعر السنوي" : "Annual Price",
    annualSavings: locale === "ar" ? "التوفير السنوي" : "Annual Savings",
    effectiveMonthly:
      locale === "ar" ? "الشهري الفعلي (سنوي)" : "Effective Monthly (Annual)",
    billingCycle: locale === "ar" ? "دورة الفوترة الافتراضية" : "Default Billing Cycle",

    // Limits fields
    maxClubs: locale === "ar" ? "الحد الأقصى للأندية" : "Max Clubs",
    maxLocationsPerClub:
      locale === "ar" ? "الفروع لكل نادي" : "Locations per Club",
    maxMembers: locale === "ar" ? "الحد الأقصى للأعضاء" : "Max Members",
    maxStaffUsers: locale === "ar" ? "الحد الأقصى للموظفين" : "Max Staff Users",

    // Features
    advancedReporting: locale === "ar" ? "تقارير متقدمة" : "Advanced Reporting",
    apiAccess: locale === "ar" ? "وصول API" : "API Access",
    prioritySupport: locale === "ar" ? "دعم أولوي" : "Priority Support",
    whiteLabeling: locale === "ar" ? "علامة بيضاء" : "White Labeling",
    customIntegrations: locale === "ar" ? "تكاملات مخصصة" : "Custom Integrations",

    // Timestamps
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created At",
    updatedAt: locale === "ar" ? "آخر تحديث" : "Last Updated",
    sortOrder: locale === "ar" ? "ترتيب العرض" : "Display Order",

    // Actions
    activateSuccess: locale === "ar" ? "تم تفعيل الخطة" : "Plan activated",
    deactivateSuccess:
      locale === "ar" ? "تم إلغاء تفعيل الخطة" : "Plan deactivated",
    deleteSuccess: locale === "ar" ? "تم حذف الخطة" : "Plan deleted",
    deleteConfirm:
      locale === "ar"
        ? "هل أنت متأكد من حذف هذه الخطة؟"
        : "Are you sure you want to delete this plan?",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };

  const formatCurrency = (amount: number, currency: string = "SAR") =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(
      locale === "ar" ? "ar-SA" : "en-SA",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );


  // Handlers
  const handleActivate = () => {
    activatePlan.mutate(planId, {
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

  const handleDeactivate = () => {
    deactivatePlan.mutate(planId, {
      onSuccess: () => {
        toast({ title: texts.deactivateSuccess });
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

  const handleDelete = () => {
    if (!confirm(texts.deleteConfirm)) return;

    deletePlan.mutate(planId, {
      onSuccess: () => {
        toast({ title: texts.deleteSuccess });
        router.push(`/${locale}/client-plans`);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorLoading : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  const canActivate = !plan.isActive;
  const canDeactivate = plan.isActive;
  const canDelete = !plan.isActive;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/client-plans`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                {getLocalizedText(plan.name, locale)}
              </h1>
              <PlanStatusBadge isActive={plan.isActive} />
            </div>
            {plan.description && (
              <p className="mt-1 text-muted-foreground">
                {getLocalizedText(plan.description, locale)}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/${locale}/client-plans/${planId}/edit`}>
                <Edit className="me-2 h-4 w-4" />
                {texts.edit}
              </Link>
            </Button>
            {canActivate && (
              <Button
                variant="outline"
                onClick={handleActivate}
                disabled={activatePlan.isPending}
              >
                <CheckCircle className="me-2 h-4 w-4 text-green-600" />
                {texts.activate}
              </Button>
            )}
            {canDeactivate && (
              <Button
                variant="outline"
                onClick={handleDeactivate}
                disabled={deactivatePlan.isPending}
                className="text-warning"
              >
                <XCircle className="me-2 h-4 w-4" />
                {texts.deactivate}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deletePlan.isPending}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {texts.delete}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
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
                <p className="text-sm text-muted-foreground">{texts.monthlyPrice}</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(plan.monthlyPrice.amount, plan.monthlyPrice.currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.annualPrice}</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(plan.annualPrice.amount, plan.annualPrice.currency)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground">{texts.annualSavings}</p>
                <p className="text-lg font-semibold text-green-700">
                  {formatCurrency(plan.annualSavingsAmount, plan.monthlyPrice.currency)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-muted-foreground">{texts.effectiveMonthly}</p>
                <p className="text-lg font-semibold text-blue-700">
                  {formatCurrency(
                    plan.effectiveMonthlyPriceAnnual.amount,
                    plan.effectiveMonthlyPriceAnnual.currency
                  )}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.billingCycle}</p>
                  <p className="font-medium">
                    {locale === "ar"
                      ? BILLING_CYCLE_LABELS[plan.billingCycle].ar
                      : BILLING_CYCLE_LABELS[plan.billingCycle].en}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>{texts.limits}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.maxClubs}</p>
                  <p className="text-xl font-semibold">{plan.maxClubs}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {texts.maxLocationsPerClub}
                  </p>
                  <p className="text-xl font-semibold">{plan.maxLocationsPerClub}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.maxMembers}</p>
                  <p className="text-xl font-semibold">
                    {plan.maxMembers.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.maxStaffUsers}</p>
                  <p className="text-xl font-semibold">{plan.maxStaffUsers}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Card (Full Width) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>{texts.features}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <FeatureBadge
                icon={BarChart3}
                label={texts.advancedReporting}
                enabled={plan.hasAdvancedReporting}
              />
              <FeatureBadge
                icon={Code}
                label={texts.apiAccess}
                enabled={plan.hasApiAccess}
              />
              <FeatureBadge
                icon={HeadphonesIcon}
                label={texts.prioritySupport}
                enabled={plan.hasPrioritySupport}
              />
              <FeatureBadge
                icon={Palette}
                label={texts.whiteLabeling}
                enabled={plan.hasWhiteLabeling}
              />
              <FeatureBadge
                icon={Plug}
                label={texts.customIntegrations}
                enabled={plan.hasCustomIntegrations}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timestamps Card (Full Width) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>{texts.timestamps}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.createdAt}</p>
                  <p className="font-medium">{formatDate(plan.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.updatedAt}</p>
                  <p className="font-medium">{formatDate(plan.updatedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.sortOrder}</p>
                  <p className="font-medium">{plan.sortOrder}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Feature badge component displaying enabled/disabled state.
 */
function FeatureBadge({
  icon: Icon,
  label,
  enabled,
}: {
  icon: React.ElementType;
  label: string;
  enabled: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border ${
        enabled
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-slate-50 border-slate-200 text-slate-500"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
      {enabled ? (
        <CheckCircle className="h-4 w-4 ms-auto" />
      ) : (
        <XCircle className="h-4 w-4 ms-auto" />
      )}
    </div>
  );
}
