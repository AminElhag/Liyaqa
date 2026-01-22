"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  XCircle,
  Play,
  CheckCircle,
  Calendar,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  useSessions,
  useCancelSession,
  useStartSession,
  useCompleteSession,
} from "@/queries";
import type { ClassSession, SessionStatus } from "@/types/scheduling";
import { formatDate, formatTime } from "@/lib/utils";

export default function SessionsPage() {
  const locale = useLocale();
  const router = useRouter();

  // Default to today
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Filter state
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(nextWeek);
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "ALL">(
    "ALL"
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch sessions
  const { data, isLoading, error } = useSessions({
    dateFrom,
    dateTo,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    size: pageSize,
  });

  // Mutations
  const cancelSession = useCancelSession();
  const startSession = useStartSession();
  const completeSession = useCompleteSession();

  const texts = {
    title: locale === "ar" ? "الجلسات" : "Sessions",
    description:
      locale === "ar" ? "إدارة جلسات الفصول" : "Manage class sessions",
    dateFrom: locale === "ar" ? "من تاريخ" : "From Date",
    dateTo: locale === "ar" ? "إلى تاريخ" : "To Date",
    status: locale === "ar" ? "الحالة" : "Status",
    all: locale === "ar" ? "الكل" : "All",
    scheduled: locale === "ar" ? "مجدولة" : "Scheduled",
    inProgress: locale === "ar" ? "قيد التنفيذ" : "In Progress",
    completed: locale === "ar" ? "مكتملة" : "Completed",
    cancelled: locale === "ar" ? "ملغاة" : "Cancelled",
    class: locale === "ar" ? "الفصل" : "Class",
    date: locale === "ar" ? "التاريخ" : "Date",
    time: locale === "ar" ? "الوقت" : "Time",
    bookings: locale === "ar" ? "الحجوزات" : "Bookings",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    start: locale === "ar" ? "بدء" : "Start",
    complete: locale === "ar" ? "إكمال" : "Complete",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    noSessions:
      locale === "ar" ? "لا توجد جلسات" : "No sessions found",
    error:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل الجلسات"
        : "Error loading sessions",
    of: locale === "ar" ? "من" : "of",
  };

  // Table columns
  const columns: ColumnDef<ClassSession>[] = useMemo(
    () => [
      {
        accessorKey: "className",
        header: texts.class,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              <LocalizedText text={row.original.className} />
            </p>
            {row.original.trainerName && (
              <p className="text-sm text-muted-foreground">
                <LocalizedText text={row.original.trainerName} />
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: texts.date,
        cell: ({ row }) => formatDate(row.original.date, locale),
      },
      {
        accessorKey: "startTime",
        header: texts.time,
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.startTime} - {row.original.endTime}
          </span>
        ),
      },
      {
        accessorKey: "bookings",
        header: texts.bookings,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {row.original.bookedCount}/{row.original.capacity}
            </span>
            {row.original.waitlistCount > 0 && (
              <Badge variant="warning" className="text-xs">
                +{row.original.waitlistCount}
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: texts.status,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} locale={locale} />
        ),
      },
      {
        id: "actions",
        header: texts.actions,
        cell: ({ row }) => {
          const session = row.original;
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
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/${locale}/sessions/${session.id}`)
                  }
                >
                  <Eye className="me-2 h-4 w-4" />
                  {texts.view}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {session.status === "SCHEDULED" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => startSession.mutate(session.id)}
                    >
                      <Play className="me-2 h-4 w-4" />
                      {texts.start}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        if (
                          confirm(
                            locale === "ar"
                              ? "هل أنت متأكد من إلغاء هذه الجلسة؟"
                              : "Are you sure you want to cancel this session?"
                          )
                        ) {
                          cancelSession.mutate(session.id);
                        }
                      }}
                    >
                      <XCircle className="me-2 h-4 w-4" />
                      {texts.cancel}
                    </DropdownMenuItem>
                  </>
                )}
                {session.status === "IN_PROGRESS" && (
                  <DropdownMenuItem
                    onClick={() => completeSession.mutate(session.id)}
                  >
                    <CheckCircle className="me-2 h-4 w-4" />
                    {texts.complete}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [locale, texts, router, cancelSession, startSession, completeSession]
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
                setStatusFilter(value as SessionStatus | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="SCHEDULED">{texts.scheduled}</SelectItem>
                <SelectItem value="IN_PROGRESS">{texts.inProgress}</SelectItem>
                <SelectItem value="COMPLETED">{texts.completed}</SelectItem>
                <SelectItem value="CANCELLED">{texts.cancelled}</SelectItem>
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
