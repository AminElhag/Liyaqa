"use client";

import { useLocale } from "next-intl";
import { Calendar, Clock, User, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { PTSessionStatusBadge } from "@/components/admin/pt-session-status-badge";
import type { PTSessionSummary } from "@liyaqa/shared/types/pt-session";

interface MyPTSessionsProps {
  sessions: PTSessionSummary[];
  onCancel?: (session: PTSessionSummary) => void;
  canCancel?: boolean;
  emptyMessage?: string;
}

export function MyPTSessions({
  sessions,
  onCancel,
  canCancel = true,
  emptyMessage,
}: MyPTSessionsProps) {
  const locale = useLocale();

  const texts = {
    noSessions: emptyMessage || (locale === "ar" ? "لا توجد جلسات" : "No sessions"),
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    trainer: locale === "ar" ? "المدرب" : "Trainer",
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {texts.noSessions}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const sessionDate = new Date(session.sessionDate);
        const canCancelThis =
          canCancel &&
          (session.status === "REQUESTED" || session.status === "CONFIRMED");

        return (
          <Card key={session.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{session.trainerName || texts.trainer}</span>
                    <PTSessionStatusBadge status={session.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {sessionDate.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{session.startTime}</span>
                    </div>
                  </div>
                </div>
                {canCancelThis && onCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onCancel(session)}
                  >
                    <X className="h-4 w-4 me-1" />
                    {texts.cancel}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
