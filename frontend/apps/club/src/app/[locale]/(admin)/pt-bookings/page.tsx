"use client";

import { useState, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  Clock,
  Search,
  Users,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Home,
  Building2,
  Dumbbell,
} from "lucide-react";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@liyaqa/shared/components/ui/tabs";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import {
  usePTSessions,
  useCompletePTSession,
  useCancelPTSession,
} from "@liyaqa/shared/queries/use-pt-sessions";
import { useTrainers } from "@liyaqa/shared/queries/use-trainers";
import type { PTSessionSummary, PTSessionStatus } from "@liyaqa/shared/types/pt-session";
import { cn, formatDate, getLocalizedText } from "@liyaqa/shared/utils";

// ---------------------------------------------------------------------------
// Bilingual texts
// ---------------------------------------------------------------------------

const texts = {
  en: {
    title: "PT Bookings",
    subtitle: "Manage all personal training session bookings",
    // Filters
    dateFrom: "From",
    dateTo: "To",
    searchPlaceholder: "Search member or trainer...",
    allTrainers: "All Trainers",
    // Status tabs
    all: "All",
    requested: "Requested",
    confirmed: "Confirmed",
    inProgress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    noShow: "No Show",
    // Table columns
    member: "Member",
    trainer: "Trainer",
    date: "Date",
    time: "Time",
    status: "Status",
    actions: "Actions",
    // Actions
    viewDetails: "View Details",
    complete: "Complete Session",
    cancel: "Cancel Session",
    // Confirmation
    cancelConfirm: "Are you sure you want to cancel this PT session?",
    completeConfirm: "Mark this session as completed?",
    // Empty / error
    noBookings: "No PT bookings found",
    noBookingsDesc: "There are no PT bookings matching your current filters.",
    errorTitle: "Failed to load PT bookings",
    errorDesc: "Something went wrong while loading booking data. Please try again.",
    retry: "Retry",
    // Summary stats
    totalBookings: "Total Bookings",
    confirmedCount: "Confirmed",
    completedCount: "Completed",
    cancelledCount: "Cancelled",
    // Mobile
    session: "Session",
  },
  ar: {
    title: "حجوزات التدريب الشخصي",
    subtitle: "إدارة جميع حجوزات جلسات التدريب الشخصي",
    // Filters
    dateFrom: "من",
    dateTo: "إلى",
    searchPlaceholder: "البحث عن عضو أو مدرب...",
    allTrainers: "جميع المدربين",
    // Status tabs
    all: "الكل",
    requested: "مطلوب",
    confirmed: "مؤكد",
    inProgress: "جاري",
    completed: "مكتمل",
    cancelled: "ملغي",
    noShow: "لم يحضر",
    // Table columns
    member: "العضو",
    trainer: "المدرب",
    date: "التاريخ",
    time: "الوقت",
    status: "الحالة",
    actions: "الإجراءات",
    // Actions
    viewDetails: "عرض التفاصيل",
    complete: "إنهاء الجلسة",
    cancel: "إلغاء الجلسة",
    // Confirmation
    cancelConfirm: "هل أنت متأكد من إلغاء جلسة التدريب الشخصي هذه؟",
    completeConfirm: "هل تريد تحديد هذه الجلسة كمكتملة؟",
    // Empty / error
    noBookings: "لا توجد حجوزات تدريب شخصي",
    noBookingsDesc: "لا توجد حجوزات تدريب شخصي تطابق الفلاتر الحالية.",
    errorTitle: "فشل تحميل حجوزات التدريب الشخصي",
    errorDesc: "حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.",
    retry: "إعادة المحاولة",
    // Summary stats
    totalBookings: "إجمالي الحجوزات",
    confirmedCount: "مؤكد",
    completedCount: "مكتمل",
    cancelledCount: "ملغي",
    // Mobile
    session: "الجلسة",
  },
};

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

type StatusTab = PTSessionStatus | "ALL";

const STATUS_TABS: StatusTab[] = [
  "ALL",
  "REQUESTED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

function getStatusTabLabel(tab: StatusTab, t: (typeof texts)["en"]): string {
  switch (tab) {
    case "ALL": return t.all;
    case "REQUESTED": return t.requested;
    case "CONFIRMED": return t.confirmed;
    case "IN_PROGRESS": return t.inProgress;
    case "COMPLETED": return t.completed;
    case "CANCELLED": return t.cancelled;
    case "NO_SHOW": return t.noShow;
    default: return tab;
  }
}

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
  variant: "default" | "blue" | "green" | "red";
  isLoading: boolean;
}) {
  const colorClasses = {
    default: "bg-muted/50 text-muted-foreground",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
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

function BookingsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
          <Skeleton className="h-4 w-[100px] hidden sm:block" />
          <Skeleton className="h-4 w-[90px] hidden md:block" />
          <Skeleton className="h-6 w-[80px] rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile booking card
// ---------------------------------------------------------------------------

function PTBookingCard({
  booking,
  locale,
  t,
  onComplete: handleComplete,
  onCancel: handleCancel,
}: {
  booking: PTSessionSummary;
  locale: string;
  t: (typeof texts)["en"];
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{booking.memberName || "-"}</p>
          <p className="text-sm text-muted-foreground truncate">
            {booking.trainerName || "-"}
          </p>
        </div>
        <StatusBadge status={booking.status} locale={locale} />
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{formatDate(booking.sessionDate, locale)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="font-mono">{booking.startTime?.slice(0, 5)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t">
        <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" asChild>
          <Link href={`/${locale}/pt-sessions/${booking.id}`}>
            <Eye className="me-1 h-3.5 w-3.5" />
            {t.viewDetails}
          </Link>
        </Button>
        {(booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") && (
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => {
              if (confirm(t.completeConfirm)) {
                handleComplete(booking.id);
              }
            }}
          >
            <CheckCircle className="me-1 h-3.5 w-3.5" />
            {t.complete}
          </Button>
        )}
        {(booking.status === "REQUESTED" || booking.status === "CONFIRMED") && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm(t.cancelConfirm)) {
                handleCancel(booking.id);
              }
            }}
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function PTBookingsPage() {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];

  // Default date range
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Filter state
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(nextWeek);
  const [statusFilter, setStatusFilter] = useState<StatusTab>("ALL");
  const [trainerFilter, setTrainerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch bookings
  const {
    data,
    isLoading,
    error,
    refetch,
  } = usePTSessions(
    {
      startDate: dateFrom,
      endDate: dateTo,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      trainerId: trainerFilter !== "all" ? trainerFilter : undefined,
      page,
      size: pageSize,
    },
    {
      staleTime: 2 * 60 * 1000,
    }
  );

  // Fetch trainers for filter
  const { data: trainersData } = useTrainers({ size: 100 });
  const trainers = trainersData?.content ?? [];

  // Mutations
  const completePTSession = useCompletePTSession();
  const cancelPTSession = useCancelPTSession();

  // Handlers
  const handleComplete = useCallback(
    (id: string) => completePTSession.mutate({ id }),
    [completePTSession]
  );

  const handleCancel = useCallback(
    (id: string) => cancelPTSession.mutate({ id }),
    [cancelPTSession]
  );

  // Client-side search filter
  const bookings = useMemo(() => {
    const items = data?.content || [];
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (b) =>
        b.memberName?.toLowerCase().includes(q) ||
        b.trainerName?.toLowerCase().includes(q)
    );
  }, [data?.content, searchQuery]);

  // Status counts
  const statusCounts = useMemo(() => {
    const all = data?.content || [];
    return {
      ALL: data?.totalElements || 0,
      REQUESTED: all.filter((b) => b.status === "REQUESTED").length,
      CONFIRMED: all.filter((b) => b.status === "CONFIRMED").length,
      IN_PROGRESS: all.filter((b) => b.status === "IN_PROGRESS").length,
      COMPLETED: all.filter((b) => b.status === "COMPLETED").length,
      CANCELLED: all.filter((b) => b.status === "CANCELLED").length,
      NO_SHOW: all.filter((b) => b.status === "NO_SHOW").length,
    };
  }, [data]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const all = data?.content || [];
    return {
      total: data?.totalElements || 0,
      confirmed: all.filter((b) => b.status === "CONFIRMED").length,
      completed: all.filter((b) => b.status === "COMPLETED").length,
      cancelled: all.filter((b) => b.status === "CANCELLED").length,
    };
  }, [data]);

  // Table columns
  const columns: ColumnDef<PTSessionSummary>[] = useMemo(
    () => [
      {
        accessorKey: "memberName",
        header: t.member,
        cell: ({ row }) => (
          <p className="font-medium">{row.original.memberName || "-"}</p>
        ),
      },
      {
        accessorKey: "trainerName",
        header: t.trainer,
        cell: ({ row }) => (
          <p className="text-sm">{row.original.trainerName || "-"}</p>
        ),
      },
      {
        accessorKey: "sessionDate",
        header: t.date,
        cell: ({ row }) => (
          <p>{formatDate(row.original.sessionDate, locale)}</p>
        ),
      },
      {
        accessorKey: "startTime",
        header: t.time,
        cell: ({ row }) => (
          <p className="font-mono text-sm">
            {row.original.startTime?.slice(0, 5)}
          </p>
        ),
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
        cell: ({ row }) => {
          const booking = row.original;
          return (
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
                  <Link href={`/${locale}/pt-sessions/${booking.id}`}>
                    <Eye className="me-2 h-4 w-4" />
                    {t.viewDetails}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (confirm(t.completeConfirm)) {
                        handleComplete(booking.id);
                      }
                    }}
                    disabled={completePTSession.isPending}
                  >
                    <CheckCircle className="me-2 h-4 w-4" />
                    {t.complete}
                  </DropdownMenuItem>
                )}
                {(booking.status === "REQUESTED" || booking.status === "CONFIRMED") && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      if (confirm(t.cancelConfirm)) {
                        handleCancel(booking.id);
                      }
                    }}
                    disabled={cancelPTSession.isPending}
                  >
                    <XCircle className="me-2 h-4 w-4" />
                    {t.cancel}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      locale,
      t,
      handleComplete,
      handleCancel,
      completePTSession.isPending,
      cancelPTSession.isPending,
    ]
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
            <h3 className="text-lg font-semibold text-destructive">{t.errorTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">{t.errorDesc}</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
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
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Dumbbell}
          label={t.totalBookings}
          value={summaryStats.total}
          variant="default"
          isLoading={isLoading}
        />
        <StatCard
          icon={Clock}
          label={t.confirmedCount}
          value={summaryStats.confirmed}
          variant="blue"
          isLoading={isLoading}
        />
        <StatCard
          icon={CheckCircle}
          label={t.completedCount}
          value={summaryStats.completed}
          variant="green"
          isLoading={isLoading}
        />
        <StatCard
          icon={XCircle}
          label={t.cancelledCount}
          value={summaryStats.cancelled}
          variant="red"
          isLoading={isLoading}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Date range */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(0);
                  }}
                  className="w-full sm:w-[150px]"
                  aria-label={t.dateFrom}
                />
                <span className="text-sm text-muted-foreground shrink-0">
                  {t.dateTo.toLowerCase()}
                </span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(0);
                  }}
                  className="w-full sm:w-[150px]"
                  aria-label={t.dateTo}
                />
              </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Status tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(value) => {
          setStatusFilter(value as StatusTab);
          setPage(0);
        }}
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="gap-1.5 data-[state=active]:bg-background"
            >
              {getStatusTabLabel(tab, t)}
              {!isLoading && (
                <Badge
                  variant={statusFilter === tab ? "default" : "secondary"}
                  className="ms-1 h-5 min-w-[20px] px-1.5 text-[10px]"
                >
                  {statusCounts[tab] ?? 0}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="pt-6">
          {isLoading ? (
            <BookingsTableSkeleton />
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Dumbbell className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{t.noBookings}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {t.noBookingsDesc}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={bookings}
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
                <div className="space-y-2">
                  <Skeleton className="h-3 w-[120px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Dumbbell className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium">{t.noBookings}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.noBookingsDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {bookings.map((booking) => (
              <PTBookingCard
                key={booking.id}
                booking={booking}
                locale={locale}
                t={t}
                onComplete={handleComplete}
                onCancel={handleCancel}
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
