"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Plus,
  Search,
  Users,
  User,
  Home,
  Building2,
  MoreHorizontal,
  Eye,
  Pencil,
  Dumbbell,
  DollarSign,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import {
  usePTClasses,
  usePTDashboardStats,
} from "@liyaqa/shared/queries/use-pt-sessions";
import { useTrainers } from "@liyaqa/shared/queries/use-trainers";
import type { GymClass, PTSessionType, PTLocationType } from "@liyaqa/shared/types/scheduling";
import { cn, getLocalizedText, formatCurrency } from "@liyaqa/shared/utils";

// ---------------------------------------------------------------------------
// Bilingual texts
// ---------------------------------------------------------------------------

const texts = {
  en: {
    title: "PT Classes",
    subtitle: "Manage personal training class templates",
    createPTClass: "Create PT Class",
    searchPlaceholder: "Search by name...",
    allTrainers: "All Trainers",
    allSessionTypes: "All Session Types",
    oneOnOne: "1:1",
    semiPrivate: "Semi-Private",
    // Table columns
    name: "Name",
    trainer: "Trainer",
    sessionType: "Session Type",
    locationType: "Location",
    pricing: "Pricing",
    status: "Status",
    duration: "Duration",
    capacity: "Capacity",
    actions: "Actions",
    // Location types
    club: "Club",
    home: "Home",
    // Actions
    viewDetails: "View Details",
    edit: "Edit",
    // Empty / error
    noPTClasses: "No PT classes found",
    noPTClassesDesc: "Create your first personal training class template to get started.",
    errorTitle: "Failed to load PT classes",
    errorDesc: "Something went wrong while loading PT class data. Please try again.",
    retry: "Retry",
    // Stats
    totalClasses: "Total PT Classes",
    activeClasses: "Active Classes",
    totalSessions: "Total Sessions",
    upcomingSessions: "Upcoming Sessions",
    // Misc
    min: "min",
    notAssigned: "Not assigned",
    payPerEntry: "Pay Per Entry",
    included: "Included",
    classPack: "Class Pack",
    hybrid: "Hybrid",
    travelFee: "Travel Fee",
  },
  ar: {
    title: "فصول التدريب الشخصي",
    subtitle: "إدارة قوالب فصول التدريب الشخصي",
    createPTClass: "إنشاء فصل تدريب شخصي",
    searchPlaceholder: "البحث بالاسم...",
    allTrainers: "جميع المدربين",
    allSessionTypes: "جميع أنواع الجلسات",
    oneOnOne: "1:1",
    semiPrivate: "شبه خاص",
    // Table columns
    name: "الاسم",
    trainer: "المدرب",
    sessionType: "نوع الجلسة",
    locationType: "الموقع",
    pricing: "التسعير",
    status: "الحالة",
    duration: "المدة",
    capacity: "السعة",
    actions: "الإجراءات",
    // Location types
    club: "النادي",
    home: "المنزل",
    // Actions
    viewDetails: "عرض التفاصيل",
    edit: "تعديل",
    // Empty / error
    noPTClasses: "لا توجد فصول تدريب شخصي",
    noPTClassesDesc: "أنشئ أول قالب فصل تدريب شخصي للبدء.",
    errorTitle: "فشل تحميل فصول التدريب الشخصي",
    errorDesc: "حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.",
    retry: "إعادة المحاولة",
    // Stats
    totalClasses: "إجمالي الفصول",
    activeClasses: "الفصول النشطة",
    totalSessions: "إجمالي الجلسات",
    upcomingSessions: "الجلسات القادمة",
    // Misc
    min: "دقيقة",
    notAssigned: "غير محدد",
    payPerEntry: "الدفع لكل جلسة",
    included: "مشمول",
    classPack: "باقة حصص",
    hybrid: "مختلط",
    travelFee: "رسوم التنقل",
  },
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  variant,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  variant: "default" | "blue" | "green" | "amber";
  isLoading: boolean;
}) {
  const colorClasses = {
    default: "bg-muted/50 text-muted-foreground",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          colorClasses[variant]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        {isLoading ? (
          <Skeleton className="h-6 w-12 mt-0.5" />
        ) : (
          <p className="text-xl font-bold tabular-nums">{value}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table skeleton
// ---------------------------------------------------------------------------

function PTClassesTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[160px]" />
            <Skeleton className="h-3 w-[120px]" />
          </div>
          <Skeleton className="h-4 w-[100px] hidden sm:block" />
          <Skeleton className="h-6 w-[80px] rounded-full hidden md:block" />
          <Skeleton className="h-4 w-[80px] hidden md:block" />
          <Skeleton className="h-6 w-[70px] rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSessionTypeLabel(
  type: PTSessionType | undefined,
  t: (typeof texts)["en"]
): string {
  switch (type) {
    case "ONE_ON_ONE":
      return t.oneOnOne;
    case "SEMI_PRIVATE":
      return t.semiPrivate;
    default:
      return "-";
  }
}

function getLocationTypeLabel(
  type: PTLocationType | undefined,
  t: (typeof texts)["en"]
): string {
  switch (type) {
    case "CLUB":
      return t.club;
    case "HOME":
      return t.home;
    default:
      return "-";
  }
}

function getPricingLabel(
  model: string | undefined,
  t: (typeof texts)["en"]
): string {
  switch (model) {
    case "PAY_PER_ENTRY":
      return t.payPerEntry;
    case "INCLUDED_IN_MEMBERSHIP":
      return t.included;
    case "CLASS_PACK_ONLY":
      return t.classPack;
    case "HYBRID":
      return t.hybrid;
    default:
      return "-";
  }
}

// ---------------------------------------------------------------------------
// Mobile card
// ---------------------------------------------------------------------------

function PTClassCard({
  ptClass,
  locale,
  t,
}: {
  ptClass: GymClass;
  locale: string;
  t: (typeof texts)["en"];
}) {
  return (
    <Link href={`/${locale}/pt-classes/${ptClass.id}`}>
      <div className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">
              {getLocalizedText(ptClass.name, locale)}
            </p>
            {ptClass.trainerName && (
              <p className="text-sm text-muted-foreground truncate">
                <LocalizedText text={ptClass.trainerName} />
              </p>
            )}
          </div>
          <StatusBadge status={ptClass.status} locale={locale} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            {ptClass.ptSessionType === "ONE_ON_ONE" ? (
              <User className="h-3 w-3" />
            ) : (
              <Users className="h-3 w-3" />
            )}
            {getSessionTypeLabel(ptClass.ptSessionType, t)}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            {ptClass.ptLocationType === "HOME" ? (
              <Home className="h-3 w-3" />
            ) : (
              <Building2 className="h-3 w-3" />
            )}
            {getLocationTypeLabel(ptClass.ptLocationType, t)}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {ptClass.durationMinutes} {t.min}
          </Badge>
        </div>

        {ptClass.dropInPrice && (
          <div className="flex items-center gap-1.5 text-sm">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">
              {formatCurrency(
                ptClass.dropInPrice.amount,
                ptClass.dropInPrice.currency,
                locale
              )}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function PTClassesPage() {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [trainerFilter, setTrainerFilter] = useState<string>("all");
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch PT classes
  const {
    data,
    isLoading,
    error,
    refetch,
  } = usePTClasses(
    {
      trainerId: trainerFilter !== "all" ? trainerFilter : undefined,
      page,
      size: pageSize,
    },
    {
      staleTime: 2 * 60 * 1000,
    }
  );

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = usePTDashboardStats();

  // Fetch trainers for filter
  const { data: trainersData } = useTrainers({ size: 100 });
  const trainers = trainersData?.content ?? [];

  // Client-side filtering for search and session type
  const ptClasses = useMemo(() => {
    let items = data?.content || [];

    // Session type filter
    if (sessionTypeFilter !== "all") {
      items = items.filter(
        (c) => c.ptSessionType === sessionTypeFilter
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (c) =>
          c.name?.en?.toLowerCase().includes(q) ||
          c.name?.ar?.toLowerCase().includes(q) ||
          c.trainerName?.en?.toLowerCase().includes(q) ||
          c.trainerName?.ar?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [data?.content, searchQuery, sessionTypeFilter]);

  // Table columns
  const columns: ColumnDef<GymClass>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t.name,
        cell: ({ row }) => (
          <Link
            href={`/${locale}/pt-classes/${row.original.id}`}
            className="group"
          >
            <p className="font-medium group-hover:underline">
              {getLocalizedText(row.original.name, locale)}
            </p>
            {row.original.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {getLocalizedText(row.original.description, locale)}
              </p>
            )}
          </Link>
        ),
      },
      {
        accessorKey: "trainerName",
        header: t.trainer,
        cell: ({ row }) =>
          row.original.trainerName ? (
            <LocalizedText text={row.original.trainerName} />
          ) : (
            <span className="text-muted-foreground">{t.notAssigned}</span>
          ),
      },
      {
        accessorKey: "ptSessionType",
        header: t.sessionType,
        cell: ({ row }) => (
          <Badge variant="outline" className="gap-1">
            {row.original.ptSessionType === "ONE_ON_ONE" ? (
              <User className="h-3 w-3" />
            ) : (
              <Users className="h-3 w-3" />
            )}
            {getSessionTypeLabel(row.original.ptSessionType, t)}
          </Badge>
        ),
      },
      {
        accessorKey: "ptLocationType",
        header: t.locationType,
        cell: ({ row }) => (
          <Badge variant="outline" className="gap-1">
            {row.original.ptLocationType === "HOME" ? (
              <Home className="h-3 w-3" />
            ) : (
              <Building2 className="h-3 w-3" />
            )}
            {getLocationTypeLabel(row.original.ptLocationType, t)}
          </Badge>
        ),
      },
      {
        accessorKey: "dropInPrice",
        header: t.pricing,
        cell: ({ row }) => {
          const price = row.original.dropInPrice;
          if (!price) return <span className="text-muted-foreground">-</span>;
          return (
            <div>
              <p className="font-medium">
                {formatCurrency(price.amount, price.currency, locale)}
              </p>
              <p className="text-xs text-muted-foreground">
                {getPricingLabel(row.original.pricingModel, t)}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: t.status,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} locale={locale} />
        ),
      },
      {
        id: "actions",
        header: t.actions,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t.actions}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/pt-classes/${row.original.id}`}>
                  <Eye className="me-2 h-4 w-4" />
                  {t.viewDetails}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/pt-classes/${row.original.id}/edit`}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t.edit}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [locale, t]
  );

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-destructive">
              {t.errorTitle}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {t.errorDesc}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
            >
              {t.retry}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/pt-classes/new`}>
            <Plus className="me-2 h-4 w-4" />
            {t.createPTClass}
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Dumbbell}
          label={t.totalClasses}
          value={stats?.totalPTClasses ?? 0}
          variant="default"
          isLoading={statsLoading}
        />
        <StatCard
          icon={Dumbbell}
          label={t.activeClasses}
          value={stats?.activePTClasses ?? 0}
          variant="green"
          isLoading={statsLoading}
        />
        <StatCard
          icon={Clock}
          label={t.totalSessions}
          value={stats?.totalPTSessions ?? 0}
          variant="blue"
          isLoading={statsLoading}
        />
        <StatCard
          icon={Clock}
          label={t.upcomingSessions}
          value={stats?.upcomingPTSessions ?? 0}
          variant="amber"
          isLoading={statsLoading}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>

            {/* Trainer filter */}
            <Select
              value={trainerFilter}
              onValueChange={(v) => {
                setTrainerFilter(v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t.allTrainers} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTrainers}</SelectItem>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    {trainer.displayName
                      ? getLocalizedText(trainer.displayName, locale)
                      : trainer.userName || trainer.userEmail || trainer.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Session type filter */}
            <Select
              value={sessionTypeFilter}
              onValueChange={(v) => {
                setSessionTypeFilter(v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t.allSessionTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allSessionTypes}</SelectItem>
                <SelectItem value="ONE_ON_ONE">{t.oneOnOne}</SelectItem>
                <SelectItem value="SEMI_PRIVATE">{t.semiPrivate}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="pt-6">
          {isLoading ? (
            <PTClassesTableSkeleton />
          ) : ptClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Dumbbell className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{t.noPTClasses}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {t.noPTClassesDesc}
              </p>
              <Button asChild className="mt-4">
                <Link href={`/${locale}/pt-classes/new`}>
                  <Plus className="me-2 h-4 w-4" />
                  {t.createPTClass}
                </Link>
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={ptClasses}
              manualPagination
              pageCount={data?.totalPages || 1}
              pageIndex={page}
              pageSize={pageSize}
              totalRows={data?.totalElements}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                  <Skeleton className="h-6 w-[70px] rounded-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-[60px] rounded-full" />
                  <Skeleton className="h-6 w-[60px] rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : ptClasses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Dumbbell className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium">{t.noPTClasses}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t.noPTClassesDesc}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {ptClasses.map((ptClass) => (
              <PTClassCard
                key={ptClass.id}
                ptClass={ptClass}
                locale={locale}
                t={t}
              />
            ))}
            {/* Mobile pagination */}
            {(data?.totalPages || 1) > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(Math.max(0, page - 1))}
                >
                  {locale === "ar" ? "السابق" : "Previous"}
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {page + 1} / {data?.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= (data?.totalPages || 1) - 1}
                  onClick={() => setPage(page + 1)}
                >
                  {locale === "ar" ? "التالي" : "Next"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
