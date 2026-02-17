"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import {
  Users,
  Search,
  CalendarDays,
  CheckCircle2,
  UserCircle,
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
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import {
  useTrainerClients,
  useClientStats,
} from "@liyaqa/shared/queries/use-trainer-portal";
import { cn, formatDate } from "@liyaqa/shared/utils";
import type { TrainerClientStatus } from "@liyaqa/shared/types/trainer-portal";

const text = {
  title: { en: "Clients", ar: "العملاء" },
  subtitle: { en: "Your personal training clients", ar: "عملاء التدريب الشخصي" },
  searchPlaceholder: { en: "Search clients...", ar: "بحث في العملاء..." },
  noClients: { en: "No clients found", ar: "لا يوجد عملاء" },
  totalClients: { en: "Total Clients", ar: "إجمالي العملاء" },
  activeClients: { en: "Active", ar: "نشطون" },
  onHold: { en: "On Hold", ar: "معلقون" },
  newThisMonth: { en: "New This Month", ar: "جدد هذا الشهر" },
  sessionsCompleted: { en: "Sessions Completed", ar: "جلسات مكتملة" },
  lastSession: { en: "Last Session", ar: "آخر جلسة" },
  memberSince: { en: "Member since", ar: "عضو منذ" },
  previous: { en: "Previous", ar: "السابق" },
  next: { en: "Next", ar: "التالي" },
};

const statusConfig: Record<
  TrainerClientStatus,
  { en: string; ar: string; variant: "success" | "secondary" | "outline" | "default" }
> = {
  ACTIVE: { en: "Active", ar: "نشط", variant: "success" },
  ON_HOLD: { en: "On Hold", ar: "معلق", variant: "secondary" },
  COMPLETED: { en: "Completed", ar: "مكتمل", variant: "outline" },
  INACTIVE: { en: "Inactive", ar: "غير نشط", variant: "default" },
};

export default function TrainerClientsPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);

  const { user } = useAuthStore();
  const trainerId = user?.id;

  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useTrainerClients({
    trainerId,
    page,
    size: 15,
    sortBy: "startDate",
    sortDirection: "DESC",
  });

  const { data: stats, isLoading: statsLoading } = useClientStats(trainerId);

  const filteredClients = useMemo(() => {
    if (!data?.content) return [];
    if (!searchQuery.trim()) return data.content;
    const query = searchQuery.toLowerCase();
    return data.content.filter(
      (c) =>
        c.memberName?.toLowerCase().includes(query) ||
        c.memberEmail?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const statCards = [
    {
      label: t("totalClients"),
      value: stats?.totalClients ?? 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: t("activeClients"),
      value: stats?.activeClients ?? 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: t("onHold"),
      value: stats?.onHoldClients ?? 0,
      icon: CalendarDays,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: t("newThisMonth"),
      value: stats?.newThisMonth ?? 0,
      icon: UserCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", card.bgColor)}>
                    <Icon className={cn("h-5 w-5", card.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    {statsLoading ? (
                      <Skeleton className="h-6 w-10 mt-1" />
                    ) : (
                      <p className="text-xl font-bold text-foreground">
                        {card.value}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {isAr ? "فشل في تحميل العملاء" : "Failed to load clients"}
          </CardContent>
        </Card>
      )}

      {/* Clients list */}
      {!isLoading && !error && (
        <>
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>{t("noClients")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => {
                const status = statusConfig[client.status];
                const initials =
                  client.memberName
                    ?.split(" ")
                    .map((n) => n.charAt(0))
                    .join("")
                    .substring(0, 2)
                    .toUpperCase() || "?";

                return (
                  <Card
                    key={client.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {client.memberName || "-"}
                            </p>
                            <Badge variant={status.variant} className="text-xs shrink-0 ms-2">
                              {isAr ? status.ar : status.en}
                            </Badge>
                          </div>
                          {client.memberEmail && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {client.memberEmail}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>
                                {client.completedSessions}{" "}
                                {t("sessionsCompleted")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            <span>
                              {t("memberSince")}{" "}
                              {formatDate(client.startDate, locale)}
                            </span>
                          </div>
                        </div>
                      </div>
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
