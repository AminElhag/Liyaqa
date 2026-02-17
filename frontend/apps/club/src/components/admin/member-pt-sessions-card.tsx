"use client";

import { useState } from "react";
import { UserCheck, ChevronLeft, ChevronRight, Home, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useMemberPTSessions } from "@liyaqa/shared/queries/use-pt-sessions";
import { formatDate } from "@liyaqa/shared/utils";
import type { UUID } from "@liyaqa/shared/types/api";

interface MemberPTSessionsCardProps {
  memberId: UUID;
  locale: string;
}

const texts = {
  en: {
    title: "PT Sessions",
    noSessions: "No personal training sessions yet",
    noSessionsDesc: "PT session history will appear here",
    page: "Page",
    of: "of",
    oneOnOne: "1:1",
    semiPrivate: "Semi-Private",
    club: "Club",
    home: "Home",
  },
  ar: {
    title: "جلسات التدريب الشخصي",
    noSessions: "لا توجد جلسات تدريب شخصي بعد",
    noSessionsDesc: "سيظهر سجل جلسات التدريب الشخصي هنا",
    page: "صفحة",
    of: "من",
    oneOnOne: "فردي",
    semiPrivate: "شبه خاص",
    club: "في النادي",
    home: "منزلي",
  },
};

export function MemberPTSessionsCard({ memberId, locale }: MemberPTSessionsCardProps) {
  const t = texts[locale as "en" | "ar"] || texts.en;
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data, isLoading } = useMemberPTSessions(memberId, {
    page,
    size: pageSize,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loading />
        </CardContent>
      </Card>
    );
  }

  const sessions = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCheck className="h-5 w-5" />
          {t.title}
          {totalElements > 0 && (
            <Badge variant="secondary" className="ms-1 font-normal">
              {totalElements}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>{t.noSessions}</p>
            <p className="text-sm mt-1">{t.noSessionsDesc}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-medium truncate">
                    {session.trainerName || (locale === "ar" ? "مدرب" : "Trainer")}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span>{formatDate(session.sessionDate || session.createdAt, locale)}</span>
                    {session.startTime && <span>{session.startTime}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ms-4">
                  {session.ptSessionType && (
                    <Badge variant="outline">
                      {session.ptSessionType === "ONE_ON_ONE" ? t.oneOnOne : t.semiPrivate}
                    </Badge>
                  )}
                  {session.ptLocationType && (
                    <Badge variant="secondary" className="gap-1">
                      {session.ptLocationType === "HOME" ? (
                        <Home className="h-3 w-3" />
                      ) : (
                        <Building2 className="h-3 w-3" />
                      )}
                      {session.ptLocationType === "HOME" ? t.home : t.club}
                    </Badge>
                  )}
                  <StatusBadge status={session.status} locale={locale} />
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {t.page} {page + 1} {t.of} {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
