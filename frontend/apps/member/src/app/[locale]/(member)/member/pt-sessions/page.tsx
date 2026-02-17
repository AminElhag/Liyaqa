"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Dumbbell, Plus, Calendar, Clock, User, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@liyaqa/shared/components/ui/alert-dialog";
import { useMemberUpcomingPTSessions, useCancelPTSession } from "@liyaqa/shared/queries/use-pt-sessions";
import type { PTSessionSummary, PTSessionStatus } from "@liyaqa/shared/types/pt-session";
import { useState } from "react";

const STATUS_LABELS: Record<PTSessionStatus, { en: string; ar: string }> = {
  REQUESTED: { en: "Requested", ar: "مطلوب" },
  CONFIRMED: { en: "Confirmed", ar: "مؤكد" },
  IN_PROGRESS: { en: "In Progress", ar: "جاري" },
  COMPLETED: { en: "Completed", ar: "مكتمل" },
  CANCELLED: { en: "Cancelled", ar: "ملغي" },
  NO_SHOW: { en: "No Show", ar: "لم يحضر" },
};

const STATUS_COLORS: Record<PTSessionStatus, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
};

export default function MemberPTSessionsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const [cancelSession, setCancelSession] = useState<PTSessionSummary | null>(null);

  const { data, isLoading, refetch } = useMemberUpcomingPTSessions();
  const cancelMutation = useCancelPTSession();

  const handleCancel = async () => {
    if (!cancelSession) return;

    try {
      await cancelMutation.mutateAsync({
        id: cancelSession.id,
        data: {},
      });
      toast.success(
        isArabic
          ? "تم إلغاء الجلسة بنجاح"
          : "Session cancelled successfully"
      );
      refetch();
    } catch {
      toast.error(
        isArabic
          ? "فشل في إلغاء الجلسة"
          : "Failed to cancel session"
      );
    } finally {
      setCancelSession(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "جلسات التدريب الشخصي" : "Personal Training"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة جلسات التدريب الشخصي الخاصة بك"
              : "Manage your personal training sessions"}
          </p>
        </div>
        <Link href={`/${locale}/member/pt-sessions/book`}>
          <Button>
            <Plus className="h-4 w-4 me-2" />
            {isArabic ? "حجز جلسة" : "Book Session"}
          </Button>
        </Link>
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            {isArabic ? "الجلسات القادمة" : "Upcoming Sessions"}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? "جلسات التدريب الشخصي المحجوزة"
              : "Your booked personal training sessions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data?.content && data.content.length > 0 ? (
            <div className="space-y-4">
              {data.content.map((session) => (
                <PTSessionCard
                  key={session.id}
                  session={session}
                  isArabic={isArabic}
                  dateLocale={dateLocale}
                  onCancel={() => setCancelSession(session)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isArabic
                  ? "لا توجد جلسات محجوزة"
                  : "No sessions booked"}
              </p>
              <Link href={`/${locale}/member/pt-sessions/book`}>
                <Button variant="outline" className="mt-4">
                  {isArabic ? "احجز جلستك الأولى" : "Book Your First Session"}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelSession} onOpenChange={() => setCancelSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabic ? "إلغاء الجلسة؟" : "Cancel Session?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? "هل أنت متأكد من إلغاء هذه الجلسة؟ قد لا تتمكن من استرداد المبلغ."
                : "Are you sure you want to cancel this session? You may not be able to get a refund."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? "رجوع" : "Back"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground"
            >
              {cancelMutation.isPending && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {isArabic ? "إلغاء الجلسة" : "Cancel Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PTSessionCard({
  session,
  isArabic,
  dateLocale,
  onCancel,
}: {
  session: PTSessionSummary;
  isArabic: boolean;
  dateLocale: typeof ar | typeof enUS;
  onCancel: () => void;
}) {
  const canCancel = session.status === "REQUESTED" || session.status === "CONFIRMED";

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge className={STATUS_COLORS[session.status]}>
            {isArabic
              ? STATUS_LABELS[session.status].ar
              : STATUS_LABELS[session.status].en}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(session.sessionDate), "PP", { locale: dateLocale })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {session.startTime.slice(0, 5)}
          </span>
        </div>
        {session.trainerName && (
          <div className="flex items-center gap-1 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{session.trainerName}</span>
          </div>
        )}
      </div>
      {canCancel && (
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}
