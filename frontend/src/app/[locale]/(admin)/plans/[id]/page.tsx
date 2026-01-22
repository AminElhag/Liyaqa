"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  CreditCard,
  ChevronLeft,
  Pencil,
  Clock,
  Users,
  Infinity,
  DollarSign,
  Tag,
  Calendar,
  UserCheck,
  Gift,
  Lock,
  Waves,
  Flame,
  Snowflake,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { usePlan } from "@/queries/use-plans";
import { formatCurrency, getLocalizedText } from "@/lib/utils";

interface PlanDetailPageProps {
  params: Promise<{ id: string }>;
}

// Billing period labels
const billingPeriodLabels: Record<string, { en: string; ar: string }> = {
  DAILY: { en: "Daily", ar: "يومي" },
  WEEKLY: { en: "Weekly", ar: "أسبوعي" },
  BIWEEKLY: { en: "Bi-weekly", ar: "كل أسبوعين" },
  MONTHLY: { en: "Monthly", ar: "شهري" },
  QUARTERLY: { en: "Quarterly", ar: "ربع سنوي" },
  YEARLY: { en: "Yearly", ar: "سنوي" },
  ONE_TIME: { en: "One-time", ar: "مرة واحدة" },
};

export default function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { id } = use(params);
  const locale = useLocale();

  const { data: plan, isLoading, error } = usePlan(id);

  // Helper to format billing period
  const getBillingPeriodLabel = (period: string) => {
    const labels = billingPeriodLabels[period];
    return labels ? (locale === "ar" ? labels.ar : labels.en) : period;
  };

  // Helper to check if plan is currently active
  const isPlanActive = plan?.isActive ?? plan?.active;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/plans`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للباقات" : "Back to plans"}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <CreditCard className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>
              {locale === "ar"
                ? "لم يتم العثور على الباقة"
                : "Plan not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/plans`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للباقات" : "Back to plans"}
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
              <CreditCard className="h-6 w-6" />
              {getLocalizedText(plan.name, locale)}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Status badge */}
              <Badge variant={isPlanActive ? "success" : "secondary"}>
                {isPlanActive
                  ? locale === "ar"
                    ? "نشط"
                    : "Active"
                  : locale === "ar"
                    ? "غير نشط"
                    : "Inactive"}
              </Badge>

              {/* Billing period badge */}
              <Badge variant="outline">
                {getBillingPeriodLabel(plan.billingPeriod)}
              </Badge>

              {/* Date availability badge */}
              {plan.hasDateRestriction && (
                <Badge
                  variant={plan.isCurrentlyAvailable ? "default" : "secondary"}
                  className="gap-1"
                >
                  <Calendar className="h-3 w-3" />
                  {plan.isCurrentlyAvailable
                    ? (locale === "ar" ? "متاح حالياً" : "Currently Available")
                    : (locale === "ar" ? "غير متاح حالياً" : "Currently Unavailable")}
                </Badge>
              )}

              {/* Age restriction badge */}
              {plan.hasAgeRestriction && (
                <Badge variant="outline" className="gap-1">
                  <UserCheck className="h-3 w-3" />
                  {plan.minimumAge && plan.maximumAge
                    ? `${plan.minimumAge}-${plan.maximumAge} ${locale === "ar" ? "سنة" : "years"}`
                    : plan.minimumAge
                      ? `${plan.minimumAge}+ ${locale === "ar" ? "سنة" : "years"}`
                      : `≤${plan.maximumAge} ${locale === "ar" ? "سنة" : "years"}`}
                </Badge>
              )}
            </div>
          </div>
          <Button asChild>
            <Link href={`/${locale}/plans/${id}/edit`}>
              <Pencil className="h-4 w-4 me-2" />
              {locale === "ar" ? "تعديل" : "Edit"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Plan Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Fee Structure Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {locale === "ar" ? "هيكل الرسوم" : "Fee Structure"}
            </CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "تفاصيل جميع الرسوم مع الضريبة"
                : "All fees with tax breakdown"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Membership Fee */}
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {locale === "ar" ? "رسوم العضوية" : "Membership Fee"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {locale === "ar" ? "متكررة" : "Recurring"}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-semibold">
                    {formatCurrency(
                      plan.membershipFee?.grossAmount ?? plan.membershipFee?.amount ?? plan.price.amount,
                      plan.membershipFee?.currency ?? plan.price.currency,
                      locale
                    )}
                  </p>
                  {plan.membershipFee && (
                    <p className="text-xs text-neutral-500">
                      {formatCurrency(plan.membershipFee.amount, plan.membershipFee.currency, locale)}
                      {" + "}
                      {plan.membershipFee.taxRate}% {locale === "ar" ? "ضريبة" : "VAT"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Administration Fee */}
            {plan.administrationFee && plan.administrationFee.amount > 0 && (
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {locale === "ar" ? "رسوم الإدارة" : "Administration Fee"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {locale === "ar" ? "متكررة" : "Recurring"}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold">
                      {formatCurrency(
                        plan.administrationFee.grossAmount ?? plan.administrationFee.amount,
                        plan.administrationFee.currency,
                        locale
                      )}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatCurrency(plan.administrationFee.amount, plan.administrationFee.currency, locale)}
                      {" + "}
                      {plan.administrationFee.taxRate}% {locale === "ar" ? "ضريبة" : "VAT"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Join Fee */}
            {plan.joinFee && plan.joinFee.amount > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-blue-900">
                      {locale === "ar" ? "رسوم الانضمام" : "Join Fee"}
                    </p>
                    <p className="text-xs text-blue-600">
                      {locale === "ar" ? "مرة واحدة فقط" : "One-time only"}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold text-blue-900">
                      {formatCurrency(
                        plan.joinFee.grossAmount ?? plan.joinFee.amount,
                        plan.joinFee.currency,
                        locale
                      )}
                    </p>
                    <p className="text-xs text-blue-600">
                      {formatCurrency(plan.joinFee.amount, plan.joinFee.currency, locale)}
                      {" + "}
                      {plan.joinFee.taxRate}% {locale === "ar" ? "ضريبة" : "VAT"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              {/* Recurring Total */}
              <div className="flex justify-between">
                <span className="text-neutral-600">
                  {locale === "ar" ? "الإجمالي المتكرر" : "Recurring Total"}
                </span>
                <span className="font-bold text-lg">
                  {plan.recurringTotal
                    ? formatCurrency(plan.recurringTotal.amount, plan.recurringTotal.currency, locale)
                    : formatCurrency(plan.price.amount, plan.price.currency, locale)}
                </span>
              </div>

              {/* First Payment Total (with join fee) */}
              {plan.joinFee && plan.joinFee.amount > 0 && plan.totalWithJoinFee && (
                <div className="flex justify-between text-primary">
                  <span>
                    {locale === "ar" ? "الدفعة الأولى" : "First Payment"}
                  </span>
                  <span className="font-bold text-lg">
                    {formatCurrency(plan.totalWithJoinFee.amount, plan.totalWithJoinFee.currency, locale)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Duration & Classes Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {locale === "ar" ? "المدة والحصص" : "Duration & Classes"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Duration */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-100 rounded">
                <Clock className="h-5 w-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">
                  {locale === "ar" ? "مدة الاشتراك" : "Subscription Duration"}
                </p>
                <p className="font-medium">
                  {plan.effectiveDurationDays
                    ? (locale === "ar"
                        ? `${plan.effectiveDurationDays} يوم`
                        : `${plan.effectiveDurationDays} days`)
                    : plan.durationDays
                      ? (locale === "ar"
                          ? `${plan.durationDays} يوم`
                          : `${plan.durationDays} days`)
                      : (locale === "ar" ? "غير محدد" : "Not specified")}
                </p>
              </div>
            </div>

            {/* Classes */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-100 rounded">
                {plan.hasUnlimitedClasses ? (
                  <Infinity className="h-5 w-5 text-neutral-600" />
                ) : (
                  <Users className="h-5 w-5 text-neutral-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-neutral-500">
                  {locale === "ar" ? "الحصص" : "Classes"}
                </p>
                <p className="font-medium">
                  {plan.hasUnlimitedClasses
                    ? (locale === "ar" ? "غير محدود" : "Unlimited")
                    : plan.maxClassesPerPeriod
                      ? (locale === "ar"
                          ? `${plan.maxClassesPerPeriod} حصة`
                          : `${plan.maxClassesPerPeriod} classes`)
                      : plan.classLimit
                        ? (locale === "ar"
                            ? `${plan.classLimit} حصة`
                            : `${plan.classLimit} classes`)
                        : (locale === "ar" ? "غير محدود" : "Unlimited")}
                </p>
              </div>
            </div>

            {/* Billing Period */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-100 rounded">
                <Calendar className="h-5 w-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">
                  {locale === "ar" ? "دورة الفوترة" : "Billing Period"}
                </p>
                <p className="font-medium">
                  {getBillingPeriodLabel(plan.billingPeriod)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restrictions Card */}
        {(plan.hasDateRestriction || plan.hasAgeRestriction) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {locale === "ar" ? "القيود" : "Restrictions"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Restrictions */}
              {plan.hasDateRestriction && (
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-neutral-600" />
                    <span className="font-medium">
                      {locale === "ar" ? "تقييد التاريخ" : "Date Restriction"}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-600 space-y-1">
                    {plan.availableFrom && (
                      <p>
                        {locale === "ar" ? "من: " : "From: "}
                        <span className="font-medium">{plan.availableFrom}</span>
                      </p>
                    )}
                    {plan.availableUntil && (
                      <p>
                        {locale === "ar" ? "حتى: " : "Until: "}
                        <span className="font-medium">{plan.availableUntil}</span>
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    {plan.isCurrentlyAvailable ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-success">
                          {locale === "ar" ? "متاح حالياً" : "Currently available"}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">
                          {locale === "ar" ? "غير متاح حالياً" : "Currently unavailable"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Age Restrictions */}
              {plan.hasAgeRestriction && (
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="h-4 w-4 text-neutral-600" />
                    <span className="font-medium">
                      {locale === "ar" ? "تقييد العمر" : "Age Restriction"}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-600 space-y-1">
                    {plan.minimumAge && (
                      <p>
                        {locale === "ar" ? "الحد الأدنى: " : "Minimum: "}
                        <span className="font-medium">
                          {plan.minimumAge} {locale === "ar" ? "سنة" : "years"}
                        </span>
                      </p>
                    )}
                    {plan.maximumAge && (
                      <p>
                        {locale === "ar" ? "الحد الأقصى: " : "Maximum: "}
                        <span className="font-medium">
                          {plan.maximumAge} {locale === "ar" ? "سنة" : "years"}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              {locale === "ar" ? "المميزات" : "Features"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Guest Passes */}
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded ${plan.hasGuestPasses ? 'bg-success/10' : 'bg-neutral-100'}`}>
                  <Users className={`h-4 w-4 ${plan.hasGuestPasses ? 'text-success' : 'text-neutral-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {locale === "ar" ? "تذاكر ضيوف" : "Guest Passes"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {plan.hasGuestPasses
                      ? `${plan.guestPassesCount} ${locale === "ar" ? "تذكرة" : "passes"}`
                      : (locale === "ar" ? "غير متضمن" : "Not included")}
                  </p>
                </div>
              </div>

              {/* Locker Access */}
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded ${plan.hasLockerAccess ? 'bg-success/10' : 'bg-neutral-100'}`}>
                  <Lock className={`h-4 w-4 ${plan.hasLockerAccess ? 'text-success' : 'text-neutral-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {locale === "ar" ? "خزانة" : "Locker"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {plan.hasLockerAccess
                      ? (locale === "ar" ? "متضمن" : "Included")
                      : (locale === "ar" ? "غير متضمن" : "Not included")}
                  </p>
                </div>
              </div>

              {/* Pool Access */}
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded ${plan.hasPoolAccess ? 'bg-success/10' : 'bg-neutral-100'}`}>
                  <Waves className={`h-4 w-4 ${plan.hasPoolAccess ? 'text-success' : 'text-neutral-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {locale === "ar" ? "مسبح" : "Pool"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {plan.hasPoolAccess
                      ? (locale === "ar" ? "متضمن" : "Included")
                      : (locale === "ar" ? "غير متضمن" : "Not included")}
                  </p>
                </div>
              </div>

              {/* Sauna Access */}
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded ${plan.hasSaunaAccess ? 'bg-success/10' : 'bg-neutral-100'}`}>
                  <Flame className={`h-4 w-4 ${plan.hasSaunaAccess ? 'text-success' : 'text-neutral-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {locale === "ar" ? "ساونا" : "Sauna"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {plan.hasSaunaAccess
                      ? (locale === "ar" ? "متضمن" : "Included")
                      : (locale === "ar" ? "غير متضمن" : "Not included")}
                  </p>
                </div>
              </div>

              {/* Freeze Days */}
              <div className="flex items-center gap-2 col-span-2">
                <div className={`p-2 rounded ${plan.freezeDaysAllowed > 0 ? 'bg-success/10' : 'bg-neutral-100'}`}>
                  <Snowflake className={`h-4 w-4 ${plan.freezeDaysAllowed > 0 ? 'text-success' : 'text-neutral-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {locale === "ar" ? "أيام التجميد" : "Freeze Days"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {plan.freezeDaysAllowed > 0
                      ? `${plan.freezeDaysAllowed} ${locale === "ar" ? "يوم" : "days"}`
                      : (locale === "ar" ? "غير متاح" : "Not available")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {plan.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {locale === "ar" ? "الوصف" : "Description"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600">
              {getLocalizedText(plan.description, locale)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "معلومات إضافية" : "Additional Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">
              {locale === "ar" ? "معرف الباقة" : "Plan ID"}
            </span>
            <span className="font-mono text-xs">{plan.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">
              {locale === "ar" ? "معرف النادي" : "Club ID"}
            </span>
            <span className="font-mono text-xs">{plan.tenantId}</span>
          </div>
          {plan.sortOrder !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">
                {locale === "ar" ? "ترتيب العرض" : "Sort Order"}
              </span>
              <span>{plan.sortOrder}</span>
            </div>
          )}
          {plan.createdAt && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">
                {locale === "ar" ? "تاريخ الإنشاء" : "Created At"}
              </span>
              <span>{new Date(plan.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}</span>
            </div>
          )}
          {plan.updatedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">
                {locale === "ar" ? "آخر تحديث" : "Last Updated"}
              </span>
              <span>{new Date(plan.updatedAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
