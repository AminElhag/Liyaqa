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
  Archive,
  RotateCcw,
  Rocket,
  Clock,
  Users,
  Infinity,
  Calendar,
  UserCheck,
  Dumbbell,
  Waves,
  Flame,
  Lock,
  RefreshCw,
  Package,
  Ticket,
  LayoutGrid,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@liyaqa/shared/components/ui/tooltip";
import {
  usePlans,
  useArchivePlan,
  useReactivatePlan,
  usePublishPlan,
  usePlanStats,
} from "@liyaqa/shared/queries/use-plans";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { formatCurrency, getLocalizedText } from "@liyaqa/shared/utils";
import type { MembershipPlan, MembershipPlanType, MembershipPlanStatus } from "@liyaqa/shared/types/member";

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

const PLAN_TYPE_CONFIG: Record<MembershipPlanType, { en: string; ar: string; icon: typeof RefreshCw; color: string }> = {
  RECURRING: { en: "Recurring", ar: "متكرر", icon: RefreshCw, color: "text-blue-600" },
  CLASS_PACK: { en: "Class Pack", ar: "باقة حصص", icon: Package, color: "text-purple-600" },
  DAY_PASS: { en: "Day Pass", ar: "تذكرة يومية", icon: Ticket, color: "text-amber-600" },
  TRIAL: { en: "Trial", ar: "تجربة", icon: Clock, color: "text-emerald-600" },
};

const STATUS_CONFIG: Record<MembershipPlanStatus, { en: string; ar: string; variant: "success" | "secondary" | "outline" }> = {
  ACTIVE: { en: "Active", ar: "نشط", variant: "success" },
  DRAFT: { en: "Draft", ar: "مسودة", variant: "secondary" },
  ARCHIVED: { en: "Archived", ar: "مؤرشف", variant: "outline" },
};

export default function PlansPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | MembershipPlanStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | MembershipPlanType>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = usePlans({
    page,
    size: 20,
    status: statusFilter === "all" ? undefined : statusFilter,
    planType: typeFilter === "all" ? undefined : typeFilter,
    search: search || undefined,
  });

  const { data: stats, isLoading: statsLoading } = usePlanStats();

  const archivePlan = useArchivePlan();
  const reactivatePlan = useReactivatePlan();
  const publishPlan = usePublishPlan();

  const handleArchive = async (id: string) => {
    try {
      await archivePlan.mutateAsync(id);
      toast({
        title: isAr ? "تم الأرشفة" : "Archived",
        description: isAr ? "تم أرشفة الباقة بنجاح" : "Plan archived successfully",
      });
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل في أرشفة الباقة" : "Failed to archive plan",
        variant: "destructive",
      });
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await reactivatePlan.mutateAsync(id);
      toast({
        title: isAr ? "تم التفعيل" : "Reactivated",
        description: isAr ? "تم إعادة تفعيل الباقة" : "Plan reactivated successfully",
      });
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل في إعادة التفعيل" : "Failed to reactivate plan",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishPlan.mutateAsync(id);
      toast({
        title: isAr ? "تم النشر" : "Published",
        description: isAr ? "تم تفعيل الباقة" : "Plan is now active",
      });
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل في نشر الباقة" : "Failed to publish plan",
        variant: "destructive",
      });
    }
  };

  const getPlanStatus = (plan: MembershipPlan): MembershipPlanStatus => {
    if (plan.status) return plan.status;
    return (plan.isActive ?? plan.active) ? "ACTIVE" : "ARCHIVED";
  };

  const getBillingPeriodLabel = (period: string) => {
    const labels = billingPeriodLabels[period];
    return labels ? (isAr ? labels.ar : labels.en) : period;
  };

  const getPlanFeatureIcons = (plan: MembershipPlan) => {
    const features = [];
    if (plan.hasLockerAccess) features.push({ icon: Lock, label: isAr ? "خزانة" : "Locker" });
    if (plan.hasPoolAccess) features.push({ icon: Waves, label: isAr ? "مسبح" : "Pool" });
    if (plan.hasSaunaAccess) features.push({ icon: Flame, label: isAr ? "ساونا" : "Sauna" });
    return features;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAr ? "باقات العضوية" : "Membership Plans"}
          </h1>
          <p className="text-muted-foreground">
            {isAr ? "إدارة باقات الاشتراك والأسعار" : "Manage subscription plans and pricing"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/plans/new`}>
            <Plus className="h-4 w-4 me-2" />
            {isAr ? "إنشاء باقة" : "Create Plan"}
          </Link>
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <LayoutGrid className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الباقات" : "Total Plans"}</p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-8 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-foreground">{stats?.totalPlans ?? 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Rocket className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "باقات نشطة" : "Active Plans"}</p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-8 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-foreground">{stats?.activePlans ?? 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Pencil className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "مسودات" : "Drafts"}</p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-8 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-foreground">{stats?.draftPlans ?? 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Archive className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "مؤرشفة" : "Archived"}</p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-8 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-foreground">{stats?.archivedPlans ?? 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث بالاسم..." : "Search by name..."}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="ps-9"
              />
            </div>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as "all" | MembershipPlanStatus);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={isAr ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isAr ? "جميع الحالات" : "All Statuses"}
                </SelectItem>
                <SelectItem value="ACTIVE">
                  {isAr ? "نشط" : "Active"}
                </SelectItem>
                <SelectItem value="DRAFT">
                  {isAr ? "مسودة" : "Draft"}
                </SelectItem>
                <SelectItem value="ARCHIVED">
                  {isAr ? "مؤرشف" : "Archived"}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Type filter */}
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as "all" | MembershipPlanType);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={isAr ? "النوع" : "Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isAr ? "جميع الأنواع" : "All Types"}
                </SelectItem>
                <SelectItem value="RECURRING">
                  {isAr ? "متكرر" : "Recurring"}
                </SelectItem>
                <SelectItem value="CLASS_PACK">
                  {isAr ? "باقة حصص" : "Class Pack"}
                </SelectItem>
                <SelectItem value="DAY_PASS">
                  {isAr ? "تذكرة يومية" : "Day Pass"}
                </SelectItem>
                <SelectItem value="TRIAL">
                  {isAr ? "تجربة" : "Trial"}
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
          <CardContent className="py-8 text-center text-muted-foreground">
            {isAr ? "فشل في تحميل الباقات" : "Failed to load plans"}
          </CardContent>
        </Card>
      )}

      {/* Plans list */}
      {!isLoading && !error && (
        <>
          {data?.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p>{isAr ? "لا توجد باقات" : "No plans found"}</p>
                {(statusFilter !== "all" || typeFilter !== "all" || search) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setStatusFilter("all");
                      setTypeFilter("all");
                      setSearch("");
                      setPage(0);
                    }}
                  >
                    {isAr ? "مسح الفلاتر" : "Clear filters"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.content.map((plan) => {
                const status = getPlanStatus(plan);
                const statusConfig = STATUS_CONFIG[status];
                const planType = plan.planType || "RECURRING";
                const typeConfig = PLAN_TYPE_CONFIG[planType];
                const TypeIcon = typeConfig.icon;
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
                                {isAr ? "عرض" : "View"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/${locale}/plans/${plan.id}/edit`}>
                                <Pencil className="h-4 w-4 me-2" />
                                {isAr ? "تعديل" : "Edit"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {status === "DRAFT" && (
                              <DropdownMenuItem onClick={() => handlePublish(plan.id)}>
                                <Rocket className="h-4 w-4 me-2" />
                                {isAr ? "نشر وتفعيل" : "Publish"}
                              </DropdownMenuItem>
                            )}
                            {status === "ACTIVE" && (
                              <DropdownMenuItem
                                onClick={() => handleArchive(plan.id)}
                                className="text-warning"
                              >
                                <Archive className="h-4 w-4 me-2" />
                                {isAr ? "أرشفة" : "Archive"}
                              </DropdownMenuItem>
                            )}
                            {status === "ARCHIVED" && (
                              <DropdownMenuItem onClick={() => handleReactivate(plan.id)}>
                                <RotateCcw className="h-4 w-4 me-2" />
                                {isAr ? "إعادة تفعيل" : "Reactivate"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Status badge */}
                        <Badge variant={statusConfig.variant}>
                          {isAr ? statusConfig.ar : statusConfig.en}
                        </Badge>

                        {/* Plan type badge */}
                        <Badge variant="outline" className="gap-1">
                          <TypeIcon className={`h-3 w-3 ${typeConfig.color}`} />
                          {isAr ? typeConfig.ar : typeConfig.en}
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
                                    ? (isAr ? "متاح" : "Available")
                                    : (isAr ? "غير متاح" : "Unavailable")}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {plan.availableFrom && plan.availableUntil
                                  ? `${plan.availableFrom} - ${plan.availableUntil}`
                                  : plan.availableFrom
                                    ? (isAr ? `من ${plan.availableFrom}` : `From ${plan.availableFrom}`)
                                    : (isAr ? `حتى ${plan.availableUntil}` : `Until ${plan.availableUntil}`)}
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
                                {isAr ? "تقييد العمر" : "Age Restriction"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Price display */}
                      <div className="text-2xl font-bold text-primary mb-1">
                        {plan.recurringTotal
                          ? formatCurrency(plan.recurringTotal.amount, plan.recurringTotal.currency, locale)
                          : formatCurrency(plan.price.amount, plan.price.currency, locale)}
                      </div>

                      {/* Fee breakdown hint */}
                      {plan.administrationFee && plan.administrationFee.amount > 0 && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {isAr ? "يشمل رسوم العضوية والإدارة" : "Includes membership & admin fees"}
                        </p>
                      )}

                      {/* Join fee indicator */}
                      {plan.joinFee && plan.joinFee.amount > 0 && (
                        <p className="text-xs text-primary/80 mb-2">
                          + {formatCurrency(plan.joinFee.grossAmount, plan.joinFee.currency, locale)} {isAr ? "رسوم انضمام" : "join fee"}
                        </p>
                      )}

                      <div className="text-sm text-muted-foreground space-y-1">
                        {/* Type-specific info */}
                        {planType === "CLASS_PACK" && plan.sessionCount && (
                          <p className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {isAr ? `${plan.sessionCount} حصة` : `${plan.sessionCount} sessions`}
                            {plan.expiryDays && (
                              <span className="text-muted-foreground/70">
                                &middot; {isAr ? `${plan.expiryDays} يوم` : `${plan.expiryDays} days`}
                              </span>
                            )}
                          </p>
                        )}

                        {/* Duration */}
                        {planType !== "CLASS_PACK" && planType !== "DAY_PASS" && (
                          <p className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {plan.effectiveDurationDays
                              ? (isAr ? `${plan.effectiveDurationDays} يوم` : `${plan.effectiveDurationDays} days`)
                              : plan.durationDays
                                ? (isAr ? `${plan.durationDays} يوم` : `${plan.durationDays} days`)
                                : (isAr ? "غير محدد" : "Ongoing")}
                          </p>
                        )}

                        {/* Classes */}
                        {plan.hasUnlimitedClasses ? (
                          <p className="flex items-center gap-2">
                            <Infinity className="h-4 w-4" />
                            {isAr ? "حصص غير محدودة" : "Unlimited classes"}
                          </p>
                        ) : plan.maxClassesPerPeriod ? (
                          <p className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {isAr ? `${plan.maxClassesPerPeriod} حصة` : `${plan.maxClassesPerPeriod} classes`}
                          </p>
                        ) : plan.classLimit ? (
                          <p className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {isAr ? `${plan.classLimit} حصة` : `${plan.classLimit} classes`}
                          </p>
                        ) : null}

                        {/* Guest passes */}
                        {plan.hasGuestPasses && plan.guestPassesCount > 0 && (
                          <p className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            {isAr ? `${plan.guestPassesCount} تذكرة ضيف` : `${plan.guestPassesCount} guest passes`}
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
                                  <div className="p-1.5 bg-muted rounded">
                                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
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
                {isAr ? "السابق" : "Previous"}
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
                {isAr ? "التالي" : "Next"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
