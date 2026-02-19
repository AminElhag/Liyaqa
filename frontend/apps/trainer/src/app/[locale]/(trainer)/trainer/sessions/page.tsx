"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ListFilter,
  Clock,
  MapPin,
  Search,
  User,
  CalendarDays,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { usePTSessions } from "@liyaqa/shared/queries/use-pt-sessions";
import { cn, formatDate } from "@liyaqa/shared/utils";
import type { PTSessionStatus } from "@liyaqa/shared/types/pt-session";

const text = {
  title: { en: "Sessions", ar: "الجلسات" },
  subtitle: { en: "All your training sessions", ar: "جميع جلسات التدريب" },
  all: { en: "All", ar: "الكل" },
  upcoming: { en: "Upcoming", ar: "القادمة" },
  completed: { en: "Completed", ar: "المكتملة" },
  cancelled: { en: "Cancelled", ar: "الملغاة" },
  noSessions: { en: "No sessions found", ar: "لا توجد جلسات" },
  searchPlaceholder: { en: "Search by member name...", ar: "بحث باسم العضو..." },
  previous: { en: "Previous", ar: "السابق" },
  next: { en: "Next", ar: "التالي" },
  filterStatus: { en: "Status", ar: "الحالة" },
  requested: { en: "Requested", ar: "مطلوبة" },
  confirmed: { en: "Confirmed", ar: "مؤكدة" },
  inProgress: { en: "In Progress", ar: "جارية" },
  noShow: { en: "No Show", ar: "لم يحضر" },
};

type FilterStatus = "all" | PTSessionStatus;

const statusLabels: Record<string, { en: string; ar: string }> = {
  REQUESTED: { en: "Requested", ar: "مطلوبة" },
  CONFIRMED: { en: "Confirmed", ar: "مؤكدة" },
  IN_PROGRESS: { en: "In Progress", ar: "جارية" },
  COMPLETED: { en: "Completed", ar: "مكتملة" },
  CANCELLED: { en: "Cancelled", ar: "ملغاة" },
  NO_SHOW: { en: "No Show", ar: "لم يحضر" },
};

function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" | "success" {
  switch (status) {
    case "CONFIRMED":
    case "REQUESTED":
      return "default";
    case "IN_PROGRESS":
      return "secondary";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "destructive";
    case "NO_SHOW":
      return "outline";
    default:
      return "outline";
  }
}

export default function TrainerSessionsPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = usePTSessions({
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    size: 15,
    sortBy: "sessionDate",
    sortDirection: "DESC",
  });

  const filteredSessions = useMemo(() => {
    if (!data?.content) return [];
    if (!searchQuery.trim()) return data.content;
    const query = searchQuery.toLowerCase();
    return data.content.filter((s) =>
      s.memberName?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as FilterStatus);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-44">
                <ListFilter className="h-4 w-4 me-2" />
                <SelectValue placeholder={t("filterStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="REQUESTED">{t("requested")}</SelectItem>
                <SelectItem value="CONFIRMED">{t("confirmed")}</SelectItem>
                <SelectItem value="IN_PROGRESS">{t("inProgress")}</SelectItem>
                <SelectItem value="COMPLETED">{t("completed")}</SelectItem>
                <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
                <SelectItem value="NO_SHOW">{t("noShow")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="py-4">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48 mt-1" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {isAr ? "فشل في تحميل الجلسات" : "Failed to load sessions"}
          </CardContent>
        </Card>
      )}

      {/* Session list */}
      {!isLoading && !error && (
        <>
          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>{t("noSessions")}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredSessions.map((session) => {
                    const statusLabel = statusLabels[session.status];
                    return (
                      <Link
                        key={session.id}
                        href={`/${locale}/trainer/sessions/${session.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {session.memberName || "-"}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(session.sessionDate, locale)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.startTime}
                            </span>
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(session.status)}>
                          {statusLabel
                            ? isAr
                              ? statusLabel.ar
                              : statusLabel.en
                            : session.status}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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
                {t("previous")}
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
                {t("next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
