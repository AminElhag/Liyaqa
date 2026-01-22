"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  UserCheck,
  XCircle,
  Calendar,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { LocalizedText } from "@/components/ui/localized-text";
import { Loading } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  useBookings,
  useCancelBooking,
  useCheckInBooking,
  useMarkNoShow,
} from "@/queries";
import type { Booking, BookingStatus } from "@/types/scheduling";
import { formatDate, formatTime } from "@/lib/utils";

export default function BookingsPage() {
  const locale = useLocale();

  // Default to this week
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Filter state
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(nextWeek);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">(
    "ALL"
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch bookings
  const { data, isLoading, error } = useBookings({
    dateFrom,
    dateTo,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    size: pageSize,
  });

  // Mutations
  const cancelBooking = useCancelBooking();
  const checkInBooking = useCheckInBooking();
  const markNoShow = useMarkNoShow();

  const texts = {
    title: locale === "ar" ? "الحجوزات" : "Bookings",
    description:
      locale === "ar" ? "إدارة حجوزات الفصول" : "Manage class bookings",
    dateFrom: locale === "ar" ? "من تاريخ" : "From Date",
    dateTo: locale === "ar" ? "إلى تاريخ" : "To Date",
    status: locale === "ar" ? "الحالة" : "Status",
    all: locale === "ar" ? "الكل" : "All",
    confirmed: locale === "ar" ? "مؤكد" : "Confirmed",
    waitlisted: locale === "ar" ? "قائمة الانتظار" : "Waitlisted",
    cancelled: locale === "ar" ? "ملغي" : "Cancelled",
    checkedIn: locale === "ar" ? "حضر" : "Checked In",
    noShow: locale === "ar" ? "لم يحضر" : "No Show",
    member: locale === "ar" ? "العضو" : "Member",
    class: locale === "ar" ? "الفصل" : "Class",
    sessionDate: locale === "ar" ? "تاريخ الجلسة" : "Session Date",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    checkIn: locale === "ar" ? "تسجيل الحضور" : "Check In",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    markNoShow: locale === "ar" ? "تحديد لم يحضر" : "Mark No Show",
    viewSession: locale === "ar" ? "عرض الجلسة" : "View Session",
    viewMember: locale === "ar" ? "عرض العضو" : "View Member",
    noBookings:
      locale === "ar" ? "لا توجد حجوزات" : "No bookings found",
    error:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل الحجوزات"
        : "Error loading bookings",
  };

  // Table columns
  const columns: ColumnDef<Booking>[] = useMemo(
    () => [
      {
        accessorKey: "memberName",
        header: texts.member,
        cell: ({ row }) => (
          <Link
            href={`/${locale}/members/${row.original.memberId}`}
            className="hover:underline"
          >
            <p className="font-medium">
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
        header: texts.class,
        cell: ({ row }) => (
          <LocalizedText text={row.original.className} />
        ),
      },
      {
        accessorKey: "sessionDate",
        header: texts.sessionDate,
        cell: ({ row }) => (
          <Link
            href={`/${locale}/sessions/${row.original.sessionId}`}
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
        header: texts.status,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <StatusBadge status={row.original.status} locale={locale} />
            {row.original.waitlistPosition && (
              <Badge variant="warning" className="text-xs">
                #{row.original.waitlistPosition}
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: texts.actions,
        cell: ({ row }) => {
          const booking = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
                <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/sessions/${booking.sessionId}`}>
                    <Calendar className="me-2 h-4 w-4" />
                    {texts.viewSession}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/members/${booking.memberId}`}>
                    <Search className="me-2 h-4 w-4" />
                    {texts.viewMember}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {booking.status === "CONFIRMED" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => checkInBooking.mutate(booking.id)}
                    >
                      <UserCheck className="me-2 h-4 w-4" />
                      {texts.checkIn}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        if (
                          confirm(
                            locale === "ar"
                              ? "هل أنت متأكد من إلغاء هذا الحجز؟"
                              : "Are you sure you want to cancel this booking?"
                          )
                        ) {
                          cancelBooking.mutate(booking.id);
                        }
                      }}
                    >
                      <XCircle className="me-2 h-4 w-4" />
                      {texts.cancel}
                    </DropdownMenuItem>
                  </>
                )}
                {(booking.status === "CONFIRMED" ||
                  booking.status === "CHECKED_IN") && (
                  <DropdownMenuItem
                    onClick={() => markNoShow.mutate(booking.id)}
                  >
                    {texts.markNoShow}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [locale, texts, cancelBooking, checkInBooking, markNoShow]
  );

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {texts.error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                className="w-full sm:w-[160px]"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                className="w-full sm:w-[160px]"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as BookingStatus | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="CONFIRMED">{texts.confirmed}</SelectItem>
                <SelectItem value="WAITLISTED">{texts.waitlisted}</SelectItem>
                <SelectItem value="CHECKED_IN">{texts.checkedIn}</SelectItem>
                <SelectItem value="CANCELLED">{texts.cancelled}</SelectItem>
                <SelectItem value="NO_SHOW">{texts.noShow}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loading />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data?.content || []}
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
    </div>
  );
}
