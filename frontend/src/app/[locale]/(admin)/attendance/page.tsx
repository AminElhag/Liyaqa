"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import {
  UserCheck,
  UserX,
  Search,
  Calendar,
  Users,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { LocalizedText } from "@/components/ui/localized-text";
import { Loading } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  useAttendance,
  useCurrentlyCheckedIn,
  useCheckOut,
} from "@/queries";
import type { AttendanceRecord } from "@/types/attendance";
import { formatDate, formatTime } from "@/lib/utils";

export default function AttendancePage() {
  const locale = useLocale();

  // Filter state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch attendance records for the selected date
  const { data, isLoading, error, refetch } = useAttendance({
    date,
    page,
    size: pageSize,
  });

  // Fetch currently checked-in members
  const { data: checkedIn, isLoading: isLoadingCheckedIn } =
    useCurrentlyCheckedIn();

  // Mutations
  const checkOut = useCheckOut();

  const texts = {
    title: locale === "ar" ? "الحضور" : "Attendance",
    description:
      locale === "ar"
        ? "تتبع حضور الأعضاء وإدارة تسجيل الدخول/الخروج"
        : "Track member attendance and manage check-ins/outs",
    checkInMember: locale === "ar" ? "تسجيل دخول عضو" : "Check In Member",
    date: locale === "ar" ? "التاريخ" : "Date",
    search:
      locale === "ar" ? "البحث بالاسم..." : "Search by name...",
    member: locale === "ar" ? "العضو" : "Member",
    checkInTime: locale === "ar" ? "وقت الدخول" : "Check In",
    checkOutTime: locale === "ar" ? "وقت الخروج" : "Check Out",
    method: locale === "ar" ? "الطريقة" : "Method",
    status: locale === "ar" ? "الحالة" : "Status",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    checkOut: locale === "ar" ? "تسجيل خروج" : "Check Out",
    checkedIn: locale === "ar" ? "مسجل الدخول" : "Checked In",
    checkedOut: locale === "ar" ? "مسجل الخروج" : "Checked Out",
    currentlyCheckedIn:
      locale === "ar" ? "المتواجدون حاليا" : "Currently Checked In",
    todayStats: locale === "ar" ? "إحصائيات اليوم" : "Today's Stats",
    totalCheckIns: locale === "ar" ? "إجمالي الدخول" : "Total Check-ins",
    currentlyIn: locale === "ar" ? "متواجدون الآن" : "Currently In",
    noRecords:
      locale === "ar" ? "لا توجد سجلات حضور" : "No attendance records found",
    error:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل سجلات الحضور"
        : "Error loading attendance records",
    refresh: locale === "ar" ? "تحديث" : "Refresh",
    manual: locale === "ar" ? "يدوي" : "Manual",
    qrCode: locale === "ar" ? "رمز QR" : "QR Code",
    card: locale === "ar" ? "بطاقة" : "Card",
    biometric: locale === "ar" ? "بصمة" : "Biometric",
  };

  const methodLabels: Record<string, string> = {
    MANUAL: texts.manual,
    QR_CODE: texts.qrCode,
    CARD: texts.card,
    BIOMETRIC: texts.biometric,
  };

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!data?.content || !search) return data?.content || [];
    const searchLower = search.toLowerCase();
    return data.content.filter(
      (record) =>
        record.memberName.en?.toLowerCase().includes(searchLower) ||
        record.memberName.ar?.toLowerCase().includes(searchLower) ||
        record.memberEmail.toLowerCase().includes(searchLower)
    );
  }, [data?.content, search]);

  // Table columns
  const columns: ColumnDef<AttendanceRecord>[] = useMemo(
    () => [
      {
        accessorKey: "memberName",
        header: texts.member,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              <LocalizedText text={row.original.memberName} />
            </p>
            <p className="text-sm text-muted-foreground">
              {row.original.memberEmail}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "checkInTime",
        header: texts.checkInTime,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4 text-green-500" />
            {formatTime(row.original.checkInTime, locale)}
          </div>
        ),
      },
      {
        accessorKey: "checkOutTime",
        header: texts.checkOutTime,
        cell: ({ row }) =>
          row.original.checkOutTime ? (
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              {formatTime(row.original.checkOutTime, locale)}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "checkInMethod",
        header: texts.method,
        cell: ({ row }) => (
          <Badge variant="secondary">
            {methodLabels[row.original.checkInMethod] ||
              row.original.checkInMethod}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: texts.status,
        cell: ({ row }) =>
          row.original.checkOutTime ? (
            <Badge variant="secondary">{texts.checkedOut}</Badge>
          ) : (
            <Badge variant="success">{texts.checkedIn}</Badge>
          ),
      },
      {
        id: "actions",
        header: texts.actions,
        cell: ({ row }) => {
          const record = row.original;
          if (record.checkOutTime) return null;
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                checkOut.mutate({ memberId: record.memberId })
              }
              disabled={checkOut.isPending}
            >
              <UserX className="me-2 h-4 w-4" />
              {texts.checkOut}
            </Button>
          );
        },
      },
    ],
    [locale, texts, methodLabels, checkOut]
  );

  // Calculate stats
  const totalCheckIns = data?.totalElements || 0;
  const currentlyInCount = checkedIn?.length || 0;

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
        <Button asChild>
          <Link href={`/${locale}/attendance/check-in`}>
            <UserCheck className="me-2 h-4 w-4" />
            {texts.checkInMember}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {texts.totalCheckIns}
            </CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              {formatDate(date, locale)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {texts.currentlyIn}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingCheckedIn ? "-" : currentlyInCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {texts.currentlyCheckedIn}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {texts.currentlyCheckedIn}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingCheckedIn ? (
              <Loading />
            ) : checkedIn && checkedIn.length > 0 ? (
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {checkedIn.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <LocalizedText text={record.memberName} />
                    <span className="text-muted-foreground">
                      {formatTime(record.checkInTime, locale)}
                    </span>
                  </div>
                ))}
                {checkedIn.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{checkedIn.length - 5} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {texts.noRecords}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={texts.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(0);
                }}
                className="w-full sm:w-[180px]"
              />
            </div>
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
              data={filteredData}
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
