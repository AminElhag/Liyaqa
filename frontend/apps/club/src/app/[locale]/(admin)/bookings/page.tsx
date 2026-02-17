"use client";

import { useState, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  UserCheck,
  XCircle,
  Calendar,
  Search,
  Plus,
  Clock,
  Users,
  AlertTriangle,
  Eye,
  MapPin,
  CreditCard,
  Filter,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Badge } from "@liyaqa/shared/components/ui/badge";
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
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  useBookings,
  useCancelBooking,
  useCheckInBooking,
  useMarkNoShow,
} from "@liyaqa/shared/queries";
import type { Booking, BookingStatus } from "@liyaqa/shared/types/scheduling";
import { cn, formatDate } from "@liyaqa/shared/utils";

// ---------------------------------------------------------------------------
// Bilingual texts
// ---------------------------------------------------------------------------

const texts = {
  en: {
    title: "Bookings",
    subtitle: "Manage all GX class bookings across your facility",
    newBooking: "New Booking",
    dateFrom: "From",
    dateTo: "To",
    searchPlaceholder: "Search member or class...",
    classFilter: "All Classes",
    // Status tabs
    all: "All",
    confirmed: "Confirmed",
    waitlisted: "Waitlisted",
    checkedIn: "Checked In",
    noShow: "No Show",
    cancelled: "Cancelled",
    // Table columns
    member: "Member",
    class: "Class",
    sessionDateTime: "Session Date / Time",
    status: "Status",
    spot: "Spot",
    paymentSource: "Payment",
    actions: "Actions",
    // Payment sources
    membershipIncluded: "Membership",
    classPack: "Class Pack",
    payPerEntry: "Pay-per-entry",
    complimentary: "Complimentary",
    unknown: "N/A",
    // Actions
    checkIn: "Check In",
    cancel: "Cancel Booking",
    markNoShow: "Mark No Show",
    viewDetails: "View Details",
    viewSession: "View Session",
    viewMember: "View Member",
    // Confirmation
    cancelConfirm: "Are you sure you want to cancel this booking?",
    noShowConfirm: "Mark this booking as no-show?",
    // Empty / error
    noBookings: "No bookings found",
    noBookingsDesc: "There are no bookings matching your current filters.",
    errorTitle: "Failed to load bookings",
    errorDesc: "Something went wrong while loading booking data. Please try again.",
    retry: "Retry",
    // Summary stats
    totalBookings: "Total Bookings",
    confirmedCount: "Confirmed",
    checkedInCount: "Checked In",
    noShowCount: "No Shows",
    // Waitlist
    waitlistPosition: "Position",
    // Spot
    noSpot: "Open",
    // Mobile card labels
    session: "Session",
    payment: "Payment",
  },
  ar: {
    title: "الحجوزات",
    subtitle: "إدارة جميع حجوزات فصول التمارين الجماعية في منشأتك",
    newBooking: "حجز جديد",
    dateFrom: "من",
    dateTo: "إلى",
    searchPlaceholder: "ابحث عن عضو أو فصل...",
    classFilter: "جميع الفصول",
    // Status tabs
    all: "الكل",
    confirmed: "مؤكد",
    waitlisted: "قائمة الانتظار",
    checkedIn: "حاضر",
    noShow: "لم يحضر",
    cancelled: "ملغي",
    // Table columns
    member: "العضو",
    class: "الفصل",
    sessionDateTime: "تاريخ ووقت الجلسة",
    status: "الحالة",
    spot: "المقعد",
    paymentSource: "الدفع",
    actions: "الإجراءات",
    // Payment sources
    membershipIncluded: "ضمن العضوية",
    classPack: "باقة حصص",
    payPerEntry: "الدفع لكل حصة",
    complimentary: "مجاني",
    unknown: "غير محدد",
    // Actions
    checkIn: "تسجيل الحضور",
    cancel: "إلغاء الحجز",
    markNoShow: "تحديد لم يحضر",
    viewDetails: "عرض التفاصيل",
    viewSession: "عرض الجلسة",
    viewMember: "عرض العضو",
    // Confirmation
    cancelConfirm: "هل أنت متأكد من إلغاء هذا الحجز؟",
    noShowConfirm: "هل تريد تحديد هذا الحجز كـ لم يحضر؟",
    // Empty / error
    noBookings: "لا توجد حجوزات",
    noBookingsDesc: "لا توجد حجوزات تطابق الفلاتر الحالية.",
    errorTitle: "فشل تحميل الحجوزات",
    errorDesc: "حدث خطأ أثناء تحميل بيانات الحجوزات. يرجى المحاولة مرة أخرى.",
    retry: "إعادة المحاولة",
    // Summary stats
    totalBookings: "إجمالي الحجوزات",
    confirmedCount: "مؤكد",
    checkedInCount: "حاضر",
    noShowCount: "لم يحضر",
    // Waitlist
    waitlistPosition: "الترتيب",
    // Spot
    noSpot: "مفتوح",
    // Mobile card labels
    session: "الجلسة",
    payment: "الدفع",
  },
};

// ---------------------------------------------------------------------------
// Status tab configuration
// ---------------------------------------------------------------------------

type StatusTab = BookingStatus | "ALL";

const STATUS_TABS: StatusTab[] = [
  "ALL",
  "CONFIRMED",
  "WAITLISTED",
  "CHECKED_IN",
  "NO_SHOW",
  "CANCELLED",
];

function getStatusBadgeVariant(
  status: BookingStatus
): "info" | "warning" | "success" | "danger" | "secondary" {
  switch (status) {
    case "CONFIRMED":
      return "info";
    case "WAITLISTED":
      return "warning";
    case "CHECKED_IN":
      return "success";
    case "NO_SHOW":
      return "danger";
    case "CANCELLED":
      return "secondary";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: BookingStatus, t: (typeof texts)["en"]): string {
  switch (status) {
    case "CONFIRMED":
      return t.confirmed;
    case "WAITLISTED":
      return t.waitlisted;
    case "CHECKED_IN":
      return t.checkedIn;
    case "NO_SHOW":
      return t.noShow;
    case "CANCELLED":
      return t.cancelled;
    default:
      return status;
  }
}

function getPaymentLabel(
  source: string | undefined,
  t: (typeof texts)["en"]
): string {
  switch (source) {
    case "MEMBERSHIP_INCLUDED":
      return t.membershipIncluded;
    case "CLASS_PACK":
      return t.classPack;
    case "PAY_PER_ENTRY":
      return t.payPerEntry;
    case "COMPLIMENTARY":
      return t.complimentary;
    default:
      return t.unknown;
  }
}

function getPaymentIcon(source: string | undefined) {
  switch (source) {
    case "MEMBERSHIP_INCLUDED":
      return Users;
    case "CLASS_PACK":
      return CreditCard;
    case "PAY_PER_ENTRY":
      return CreditCard;
    case "COMPLIMENTARY":
      return Users;
    default:
      return CreditCard;
  }
}

// ---------------------------------------------------------------------------
// Summary stat card
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
    green:
      "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
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
// Skeleton loader for the table
// ---------------------------------------------------------------------------

function BookingsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
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

function BookingCard({
  booking,
  locale,
  t,
  onCheckIn,
  onCancel,
  onMarkNoShow,
}: {
  booking: Booking;
  locale: string;
  t: (typeof texts)["en"];
  onCheckIn: (id: string) => void;
  onCancel: (id: string) => void;
  onMarkNoShow: (id: string) => void;
}) {
  const PaymentIcon = getPaymentIcon(booking.paymentSource);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Top row: member + status */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/${locale}/members/${booking.memberId}`}
          className="min-w-0 flex-1"
        >
          <p className="font-medium truncate hover:underline">
            <LocalizedText text={booking.memberName} />
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {booking.memberEmail}
          </p>
        </Link>
        <Badge variant={getStatusBadgeVariant(booking.status)}>
          {getStatusLabel(booking.status, t)}
          {booking.status === "WAITLISTED" && booking.waitlistPosition && (
            <span className="ms-1">#{booking.waitlistPosition}</span>
          )}
        </Badge>
      </div>

      {/* Class & session info */}
      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="font-medium">
            <LocalizedText text={booking.className} />
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>
            {formatDate(booking.sessionDate, locale)}{" "}
            <span className="font-mono">{booking.sessionTime}</span>
          </span>
        </div>
        {booking.spotLabel && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{booking.spotLabel}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <PaymentIcon className="h-3.5 w-3.5 shrink-0" />
          <span>{getPaymentLabel(booking.paymentSource, t)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t">
        <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" asChild>
          <Link href={`/${locale}/bookings/${booking.id}`}>
            <Eye className="me-1 h-3.5 w-3.5" />
            {t.viewDetails}
          </Link>
        </Button>
        {booking.status === "CONFIRMED" && (
          <>
            <Button
              variant="default"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onCheckIn(booking.id)}
            >
              <UserCheck className="me-1 h-3.5 w-3.5" />
              {t.checkIn}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm(t.cancelConfirm)) {
                  onCancel(booking.id);
                }
              }}
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        {booking.status === "WAITLISTED" && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm(t.cancelConfirm)) {
                onCancel(booking.id);
              }
            }}
          >
            <XCircle className="me-1 h-3.5 w-3.5" />
            {t.cancel}
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function BookingsPage() {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];

  // Default date range: today through next 7 days
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Filter state
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(nextWeek);
  const [statusFilter, setStatusFilter] = useState<StatusTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch bookings
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useBookings(
    {
      dateFrom,
      dateTo,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      page,
      size: pageSize,
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for lists
    }
  );

  // Mutations
  const cancelBooking = useCancelBooking();
  const checkInBooking = useCheckInBooking();
  const markNoShow = useMarkNoShow();

  // Handlers
  const handleCheckIn = useCallback(
    (id: string) => checkInBooking.mutate(id),
    [checkInBooking]
  );

  const handleCancel = useCallback(
    (id: string) => cancelBooking.mutate(id),
    [cancelBooking]
  );

  const handleMarkNoShow = useCallback(
    (id: string) => {
      if (confirm(t.noShowConfirm)) {
        markNoShow.mutate(id);
      }
    },
    [markNoShow, t.noShowConfirm]
  );

  // Filtered data (client-side search within the current page)
  const bookings = useMemo(() => {
    const items = data?.content || [];
    if (!searchQuery.trim()) return items;

    const q = searchQuery.toLowerCase();
    return items.filter(
      (b) =>
        b.memberEmail?.toLowerCase().includes(q) ||
        b.memberName?.en?.toLowerCase().includes(q) ||
        b.memberName?.ar?.toLowerCase().includes(q) ||
        b.className?.en?.toLowerCase().includes(q) ||
        b.className?.ar?.toLowerCase().includes(q)
    );
  }, [data?.content, searchQuery]);

  // Status counts (from current page data for tab badges)
  const statusCounts = useMemo(() => {
    const all = data?.content || [];
    return {
      ALL: data?.totalElements || 0,
      CONFIRMED: all.filter((b) => b.status === "CONFIRMED").length,
      WAITLISTED: all.filter((b) => b.status === "WAITLISTED").length,
      CHECKED_IN: all.filter((b) => b.status === "CHECKED_IN").length,
      NO_SHOW: all.filter((b) => b.status === "NO_SHOW").length,
      CANCELLED: all.filter((b) => b.status === "CANCELLED").length,
    };
  }, [data]);

  // Summary stats (from total elements + page data)
  const summaryStats = useMemo(() => {
    const all = data?.content || [];
    return {
      total: data?.totalElements || 0,
      confirmed: all.filter((b) => b.status === "CONFIRMED").length,
      checkedIn: all.filter((b) => b.status === "CHECKED_IN").length,
      noShow: all.filter((b) => b.status === "NO_SHOW").length,
    };
  }, [data]);

  // Get tab label
  const getTabLabel = (tab: StatusTab): string => {
    switch (tab) {
      case "ALL":
        return t.all;
      case "CONFIRMED":
        return t.confirmed;
      case "WAITLISTED":
        return t.waitlisted;
      case "CHECKED_IN":
        return t.checkedIn;
      case "NO_SHOW":
        return t.noShow;
      case "CANCELLED":
        return t.cancelled;
      default:
        return tab;
    }
  };

  // Table columns (desktop)
  const columns: ColumnDef<Booking>[] = useMemo(
    () => [
      {
        accessorKey: "memberName",
        header: t.member,
        cell: ({ row }) => (
          <Link
            href={`/${locale}/members/${row.original.memberId}`}
            className="group"
          >
            <p className="font-medium group-hover:underline">
              <LocalizedText text={row.original.memberName} />
            </p>
            <p className="text-sm text-muted-foreground">
              {row.original.memberEmail}
            </p>
          </Link>
        ),
      },
      {
        accessorKey: "className",
        header: t.class,
        cell: ({ row }) => (
          <span className="font-medium">
            <LocalizedText text={row.original.className} />
          </span>
        ),
      },
      {
        accessorKey: "sessionDate",
        header: t.sessionDateTime,
        cell: ({ row }) => (
          <Link
            href={`/${locale}/bookings/${row.original.id}`}
            className="hover:underline"
          >
            <p>{formatDate(row.original.sessionDate, locale)}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {row.original.sessionTime}
            </p>
          </Link>
        ),
      },
      {
        accessorKey: "status",
        header: t.status,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(row.original.status)}>
              {getStatusLabel(row.original.status, t)}
            </Badge>
            {row.original.status === "WAITLISTED" &&
              row.original.waitlistPosition && (
                <Badge variant="warning" className="text-xs">
                  #{row.original.waitlistPosition}
                </Badge>
              )}
          </div>
        ),
      },
      {
        accessorKey: "spotLabel",
        header: t.spot,
        cell: ({ row }) =>
          row.original.spotLabel ? (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-mono">{row.original.spotLabel}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t.noSpot}</span>
          ),
      },
      {
        accessorKey: "paymentSource",
        header: t.paymentSource,
        cell: ({ row }) => {
          const PayIcon = getPaymentIcon(row.original.paymentSource);
          return (
            <div className="flex items-center gap-1.5">
              <PayIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">
                {getPaymentLabel(row.original.paymentSource, t)}
              </span>
            </div>
          );
        },
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
                  <Link href={`/${locale}/bookings/${booking.id}`}>
                    <Eye className="me-2 h-4 w-4" />
                    {t.viewDetails}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/members/${booking.memberId}`}>
                    <Search className="me-2 h-4 w-4" />
                    {t.viewMember}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {booking.status === "CONFIRMED" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleCheckIn(booking.id)}
                      disabled={checkInBooking.isPending}
                    >
                      <UserCheck className="me-2 h-4 w-4" />
                      {t.checkIn}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        if (confirm(t.cancelConfirm)) {
                          handleCancel(booking.id);
                        }
                      }}
                      disabled={cancelBooking.isPending}
                    >
                      <XCircle className="me-2 h-4 w-4" />
                      {t.cancel}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleMarkNoShow(booking.id)}
                      disabled={markNoShow.isPending}
                    >
                      <AlertTriangle className="me-2 h-4 w-4" />
                      {t.markNoShow}
                    </DropdownMenuItem>
                  </>
                )}
                {booking.status === "WAITLISTED" && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      if (confirm(t.cancelConfirm)) {
                        handleCancel(booking.id);
                      }
                    }}
                    disabled={cancelBooking.isPending}
                  >
                    <XCircle className="me-2 h-4 w-4" />
                    {t.cancel}
                  </DropdownMenuItem>
                )}
                {booking.status === "CHECKED_IN" && (
                  <DropdownMenuItem
                    onClick={() => handleMarkNoShow(booking.id)}
                    disabled={markNoShow.isPending}
                  >
                    <AlertTriangle className="me-2 h-4 w-4" />
                    {t.markNoShow}
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
      handleCheckIn,
      handleCancel,
      handleMarkNoShow,
      checkInBooking.isPending,
      cancelBooking.isPending,
      markNoShow.isPending,
    ]
  );

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/bookings/new`}>
            <Plus className="me-2 h-4 w-4" />
            {t.newBooking}
          </Link>
        </Button>
      </div>

      {/* ---- Summary stats ---- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
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
          icon={UserCheck}
          label={t.checkedInCount}
          value={summaryStats.checkedIn}
          variant="green"
          isLoading={isLoading}
        />
        <StatCard
          icon={AlertTriangle}
          label={t.noShowCount}
          value={summaryStats.noShow}
          variant="red"
          isLoading={isLoading}
        />
      </div>

      {/* ---- Filters: date range + search ---- */}
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

      {/* ---- Status tabs ---- */}
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
              {getTabLabel(tab)}
              {!isLoading && (
                <Badge
                  variant={
                    statusFilter === tab ? "default" : "secondary"
                  }
                  className="ms-1 h-5 min-w-[20px] px-1.5 text-[10px]"
                >
                  {statusCounts[tab] ?? 0}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ---- Desktop table ---- */}
      <Card className="hidden md:block">
        <CardContent className="pt-6">
          {isLoading ? (
            <BookingsTableSkeleton />
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
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

      {/* ---- Mobile cards ---- */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-3 w-[180px]" />
                  </div>
                  <Skeleton className="h-6 w-[70px] rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-[120px]" />
                  <Skeleton className="h-3 w-[160px]" />
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-medium">{t.noBookings}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t.noBookingsDesc}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                locale={locale}
                t={t}
                onCheckIn={handleCheckIn}
                onCancel={handleCancel}
                onMarkNoShow={handleMarkNoShow}
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
