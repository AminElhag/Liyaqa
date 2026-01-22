"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  CreditCard,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Clock,
  Users,
  Infinity,
  Calendar,
  UserCheck,
  Dumbbell,
  Waves,
  Flame,
  Lock,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  usePlans,
  useActivatePlan,
  useDeactivatePlan,
} from "@/queries/use-plans";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getLocalizedText } from "@/lib/utils";
import type { MembershipPlan } from "@/types/member";

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

export default function PlansPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );

  const { data, isLoading, error } = usePlans({
    page,
    size: 20,
    active:
      activeFilter === "all"
        ? undefined
        : activeFilter === "active",
  });

  const activatePlan = useActivatePlan();
  const deactivatePlan = useDeactivatePlan();

  const handleActivate = async (id: string) => {
    try {
      await activatePlan.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التفعيل" : "Activated",
        description:
          locale === "ar" ? "تم تفعيل الباقة بنجاح" : "Plan activated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في تفعيل الباقة"
            : "Failed to activate plan",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivatePlan.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الإيقاف" : "Deactivated",
        description:
          locale === "ar" ? "تم إيقاف الباقة بنجاح" : "Plan deactivated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في إيقاف الباقة"
            : "Failed to deactivate plan",
        variant: "destructive",
      });
    }
  };

  // Helper to check if plan is currently active (considering isActive)
  const isPlanActive = (plan: MembershipPlan) => plan.isActive ?? plan.active;

  // Helper to format billing period
  const getBillingPeriodLabel = (period: string) => {
    const labels = billingPeriodLabels[period];
    return labels ? (locale === "ar" ? labels.ar : labels.en) : period;
  };

  // Helper to get plan features as icons
  const getPlanFeatureIcons = (plan: MembershipPlan) => {
    const features = [];
    if (plan.hasLockerAccess) {
      features.push({ icon: Lock, label: locale === "ar" ? "خزانة" : "Locker" });
    }
    if (plan.hasPoolAccess) {
      features.push({ icon: Waves, label: locale === "ar" ? "مسبح" : "Pool" });
    }
    if (plan.hasSaunaAccess) {
      features.push({ icon: Flame, label: locale === "ar" ? "ساونا" : "Sauna" });
    }
    return features;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "باقات العضوية" : "Membership Plans"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar"
              ? "إدارة باقات الاشتراك والأسعار"
              : "Manage subscription plans and pricing"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/plans/new`}>
            <Plus className="h-4 w-4 me-2" />
            {locale === "ar" ? "إضافة باقة" : "Add Plan"}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={activeFilter}
              onValueChange={(value) =>
                setActiveFilter(value as "all" | "active" | "inactive")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={locale === "ar" ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {locale === "ar" ? "جميع الحالات" : "All Statuses"}
                </SelectItem>
                <SelectItem value="active">
                  {locale === "ar" ? "نشط" : "Active"}
                </SelectItem>
                <SelectItem value="inactive">
                  {locale === "ar" ? "غير نشط" : "Inactive"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            {locale === "ar"
              ? "فشل في تحميل الباقات"
              : "Failed to load plans"}
          </CardContent>
        </Card>
      )}

      {/* Plans list */}
      {!isLoading && !error && (
        <>
          {data?.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-neutral-500">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                <p>
                  {locale === "ar" ? "لا توجد باقات" : "No plans found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.content.map((plan) => {
                const isActive = isPlanActive(plan);
                const features = getPlanFeatureIcons(plan);

                return (
                  <Card
                    key={plan.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {getLocalizedText(plan.name, locale)}
                          </CardTitle>
                          {plan.description && (
                            <CardDescription className="line-clamp-2">
                              {getLocalizedText(plan.description, locale)}
                            </CardDescription>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/${locale}/plans/${plan.id}`}>
                                <Eye className="h-4 w-4 me-2" />
                                {locale === "ar" ? "عرض" : "View"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/plans/${plan.id}/edit`}
                              >
                                <Pencil className="h-4 w-4 me-2" />
                                {locale === "ar" ? "تعديل" : "Edit"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {isActive ? (
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(plan.id)}
                                className="text-warning"
                              >
                                <PowerOff className="h-4 w-4 me-2" />
                                {locale === "ar" ? "إيقاف" : "Deactivate"}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleActivate(plan.id)}
                              >
                                <Power className="h-4 w-4 me-2" />
                                {locale === "ar" ? "تفعيل" : "Activate"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Status badge */}
                        <Badge variant={isActive ? "success" : "secondary"}>
                          {isActive
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

                        {/* Date restriction indicator */}
                        {plan.hasDateRestriction && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant={plan.isCurrentlyAvailable ? "default" : "secondary"}
                                  className="gap-1"
                                >
                                  <Calendar className="h-3 w-3" />
                                  {plan.isCurrentlyAvailable
                                    ? (locale === "ar" ? "متاح" : "Available")
                                    : (locale === "ar" ? "غير متاح" : "Unavailable")}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {plan.availableFrom && plan.availableUntil
                                  ? `${plan.availableFrom} - ${plan.availableUntil}`
                                  : plan.availableFrom
                                    ? (locale === "ar" ? `من ${plan.availableFrom}` : `From ${plan.availableFrom}`)
                                    : (locale === "ar" ? `حتى ${plan.availableUntil}` : `Until ${plan.availableUntil}`)}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Age restriction indicator */}
                        {plan.hasAgeRestriction && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="gap-1">
                                  <UserCheck className="h-3 w-3" />
                                  {plan.minimumAge && plan.maximumAge
                                    ? `${plan.minimumAge}-${plan.maximumAge}`
                                    : plan.minimumAge
                                      ? `${plan.minimumAge}+`
                                      : `≤${plan.maximumAge}`}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {locale === "ar" ? "تقييد العمر" : "Age Restriction"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Price display - use recurringTotal if available */}
                      <div className="text-2xl font-bold text-primary mb-1">
                        {plan.recurringTotal
                          ? formatCurrency(plan.recurringTotal.amount, plan.recurringTotal.currency, locale)
                          : formatCurrency(plan.price.amount, plan.price.currency, locale)}
                      </div>

                      {/* Show fee breakdown hint if there are multiple fees */}
                      {plan.administrationFee && plan.administrationFee.amount > 0 && (
                        <p className="text-xs text-neutral-500 mb-2">
                          {locale === "ar"
                            ? "يشمل رسوم العضوية والإدارة"
                            : "Includes membership & admin fees"}
                        </p>
                      )}

                      {/* Join fee indicator */}
                      {plan.joinFee && plan.joinFee.amount > 0 && (
                        <p className="text-xs text-primary/80 mb-2">
                          + {formatCurrency(plan.joinFee.grossAmount, plan.joinFee.currency, locale)} {locale === "ar" ? "رسوم انضمام" : "join fee"}
                        </p>
                      )}

                      <div className="text-sm text-neutral-500 space-y-1">
                        {/* Duration */}
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {plan.effectiveDurationDays
                            ? (locale === "ar"
                                ? `${plan.effectiveDurationDays} يوم`
                                : `${plan.effectiveDurationDays} days`)
                            : (locale === "ar"
                                ? `${plan.durationDays} يوم`
                                : `${plan.durationDays} days`)}
                        </p>

                        {/* Classes */}
                        {plan.hasUnlimitedClasses ? (
                          <p className="flex items-center gap-2">
                            <Infinity className="h-4 w-4" />
                            {locale === "ar"
                              ? "حصص غير محدودة"
                              : "Unlimited classes"}
                          </p>
                        ) : plan.maxClassesPerPeriod ? (
                          <p className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {locale === "ar"
                              ? `${plan.maxClassesPerPeriod} حصة`
                              : `${plan.maxClassesPerPeriod} classes`}
                          </p>
                        ) : plan.classLimit ? (
                          <p className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {locale === "ar"
                              ? `${plan.classLimit} حصة`
                              : `${plan.classLimit} classes`}
                          </p>
                        ) : null}

                        {/* Guest passes */}
                        {plan.hasGuestPasses && plan.guestPassesCount > 0 && (
                          <p className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            {locale === "ar"
                              ? `${plan.guestPassesCount} تذكرة ضيف`
                              : `${plan.guestPassesCount} guest passes`}
                          </p>
                        )}
                      </div>

                      {/* Feature icons */}
                      {features.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          {features.map(({ icon: Icon, label }) => (
                            <TooltipProvider key={label}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="p-1.5 bg-neutral-100 rounded">
                                    <Icon className="h-3.5 w-3.5 text-neutral-600" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>{label}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                {locale === "ar" ? "السابق" : "Previous"}
              </Button>
              <span className="flex items-center px-4 text-sm">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
              >
                {locale === "ar" ? "التالي" : "Next"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
