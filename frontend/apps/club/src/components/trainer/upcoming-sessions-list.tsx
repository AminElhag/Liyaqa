"use client";

import { useLocale } from "next-intl";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import type { UpcomingSessionResponse } from "@liyaqa/shared/types/trainer-portal";
import { cn } from "@liyaqa/shared/utils";

interface UpcomingSessionsListProps {
  sessions: UpcomingSessionResponse[];
  locale?: string; // Optional for backward compatibility
}

function groupSessionsByDate(sessions: UpcomingSessionResponse[]) {
  return sessions.reduce((groups, session) => {
    const date = session.sessionDate;
    if (!groups[date]) groups[date] = [];
    groups[date].push(session);
    return groups;
  }, {} as Record<string, UpcomingSessionResponse[]>);
}

function formatDate(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "PPP", { locale: locale === "ar" ? ar : enUS });
  } catch {
    return dateString;
  }
}

function getStatusVariant(
  status: string
): "success" | "warning" | "default" | "secondary" {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("confirmed") || statusLower.includes("scheduled")) {
    return "success";
  }
  if (statusLower.includes("pending")) {
    return "warning";
  }
  if (statusLower.includes("cancelled")) {
    return "secondary";
  }
  return "default";
}

export function UpcomingSessionsList({
  sessions,
  locale: _locale, // Using currentLocale from hook instead
}: UpcomingSessionsListProps) {
  const currentLocale = useLocale();
  const isRtl = currentLocale === "ar";

  const texts = {
    noSessions:
      currentLocale === "ar"
        ? "لا توجد جلسات قادمة"
        : "No upcoming sessions",
    ptSession: currentLocale === "ar" ? "تدريب شخصي" : "PT Session",
    classSession: currentLocale === "ar" ? "جلسة جماعية" : "Class Session",
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{texts.noSessions}</p>
      </div>
    );
  }

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="space-y-6">
      {Object.entries(groupedSessions).map(([date, daySessions]) => (
        <div key={date}>
          <h3
            className={cn(
              "font-semibold text-lg mb-3 text-muted-foreground",
              isRtl && "text-right"
            )}
          >
            {formatDate(date, currentLocale)}
          </h3>
          <div className="space-y-3">
            {daySessions.map((session) => (
              <Card key={session.sessionId} className="overflow-hidden">
                <CardContent className="p-4">
                  <div
                    className={cn(
                      "flex justify-between items-start gap-4",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <div className={cn("flex-1 space-y-2", isRtl && "text-right")}>
                      {/* Session Type Badge */}
                      <div>
                        <Badge variant={session.sessionType === "PT" ? "default" : "secondary"}>
                          {session.sessionType === "PT"
                            ? texts.ptSession
                            : texts.classSession}
                        </Badge>
                      </div>

                      {/* Session Title */}
                      <p className="font-medium text-base">
                        {session.clientName || session.className || "Untitled Session"}
                      </p>

                      {/* Time */}
                      <p className="text-sm text-muted-foreground">
                        {session.startTime} - {session.endTime}
                      </p>

                      {/* Location */}
                      {session.location && (
                        <div
                          className={cn(
                            "flex items-center gap-1 text-sm text-muted-foreground",
                            isRtl && "flex-row-reverse"
                          )}
                        >
                          <MapPin className="h-3 w-3" />
                          <span>{session.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div>
                      <Badge variant={getStatusVariant(session.status)}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
