"use client";

import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  X,
  Clock,
  Flag,
  User,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { PTSessionStatusBadge } from "@/components/admin/pt-session-status-badge";
import {
  usePTSession,
  useConfirmPTSession,
  useCancelPTSession,
  useCompletePTSession,
  useMarkPTSessionNoShow,
} from "@/queries/use-pt-sessions";
import type { UUID } from "@/types/api";

export default function PTSessionDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as UUID;

  const { data: session, isLoading, error } = usePTSession(id);
  const confirmSession = useConfirmPTSession();
  const cancelSession = useCancelPTSession();
  const completeSession = useCompletePTSession();
  const markNoShow = useMarkPTSessionNoShow();

  const texts = {
    back: locale === "ar" ? "العودة إلى الجلسات" : "Back to Sessions",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل الجلسة" : "Error loading session",
    notFound: locale === "ar" ? "الجلسة غير موجودة" : "Session not found",

    // Actions
    confirm: locale === "ar" ? "تأكيد" : "Confirm",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    complete: locale === "ar" ? "إكمال" : "Complete",
    noShow: locale === "ar" ? "لم يحضر" : "No Show",

    // Sections
    sessionDetails: locale === "ar" ? "تفاصيل الجلسة" : "Session Details",
    participants: locale === "ar" ? "المشاركون" : "Participants",
    scheduling: locale === "ar" ? "الجدولة" : "Scheduling",
    payment: locale === "ar" ? "الدفع" : "Payment",
    notes: locale === "ar" ? "ملاحظات" : "Notes",

    // Fields
    trainer: locale === "ar" ? "المدرب" : "Trainer",
    member: locale === "ar" ? "العضو" : "Member",
    date: locale === "ar" ? "التاريخ" : "Date",
    time: locale === "ar" ? "الوقت" : "Time",
    duration: locale === "ar" ? "المدة" : "Duration",
    location: locale === "ar" ? "الموقع" : "Location",
    price: locale === "ar" ? "السعر" : "Price",
    status: locale === "ar" ? "الحالة" : "Status",
    minutes: locale === "ar" ? "دقيقة" : "minutes",
    na: locale === "ar" ? "غير محدد" : "N/A",
    noNotes: locale === "ar" ? "لا توجد ملاحظات" : "No notes",

    // Cancellation
    cancelledBy: locale === "ar" ? "ملغي بواسطة" : "Cancelled By",
    cancellationReason: locale === "ar" ? "سبب الإلغاء" : "Cancellation Reason",

    // Toast
    confirmedSuccess: locale === "ar" ? "تم تأكيد الجلسة بنجاح" : "Session confirmed successfully",
    cancelledSuccess: locale === "ar" ? "تم إلغاء الجلسة بنجاح" : "Session cancelled successfully",
    completedSuccess: locale === "ar" ? "تم إكمال الجلسة بنجاح" : "Session completed successfully",
    noShowSuccess: locale === "ar" ? "تم تسجيل عدم الحضور" : "No-show recorded successfully",
    actionError: locale === "ar" ? "حدث خطأ أثناء تنفيذ العملية" : "Error performing action",
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">{error ? texts.error : texts.notFound}</p>
      </div>
    );
  }

  const canConfirm = session.status === "REQUESTED";
  const canCancel = session.status === "REQUESTED" || session.status === "CONFIRMED";
  const canComplete = session.status === "CONFIRMED" || session.status === "IN_PROGRESS";
  const canNoShow = session.status === "CONFIRMED";

  const handleConfirm = () => {
    confirmSession.mutate(id, {
      onSuccess: () => toast({ title: texts.confirmedSuccess }),
      onError: () => toast({ title: texts.actionError, variant: "destructive" }),
    });
  };

  const handleCancel = () => {
    cancelSession.mutate(
      { id, data: { reason: "Cancelled by admin" } },
      {
        onSuccess: () => toast({ title: texts.cancelledSuccess }),
        onError: () => toast({ title: texts.actionError, variant: "destructive" }),
      }
    );
  };

  const handleComplete = () => {
    completeSession.mutate(
      { id },
      {
        onSuccess: () => toast({ title: texts.completedSuccess }),
        onError: () => toast({ title: texts.actionError, variant: "destructive" }),
      }
    );
  };

  const handleNoShow = () => {
    markNoShow.mutate(id, {
      onSuccess: () => toast({ title: texts.noShowSuccess }),
      onError: () => toast({ title: texts.actionError, variant: "destructive" }),
    });
  };

  const sessionDate = new Date(session.sessionDate);
  const formattedDate = sessionDate.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/pt-sessions`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{texts.sessionDetails}</h1>
              <PTSessionStatusBadge status={session.status} />
            </div>
            <p className="text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canConfirm && (
            <Button onClick={handleConfirm} disabled={confirmSession.isPending}>
              <CheckCircle className="me-2 h-4 w-4" />
              {texts.confirm}
            </Button>
          )}
          {canComplete && (
            <Button variant="outline" onClick={handleComplete} disabled={completeSession.isPending}>
              <Clock className="me-2 h-4 w-4" />
              {texts.complete}
            </Button>
          )}
          {canNoShow && (
            <Button variant="outline" onClick={handleNoShow} disabled={markNoShow.isPending}>
              <Flag className="me-2 h-4 w-4" />
              {texts.noShow}
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={handleCancel} disabled={cancelSession.isPending}>
              <X className="me-2 h-4 w-4" />
              {texts.cancel}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.participants}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{texts.trainer}</p>
                <p className="font-medium">{session.trainerName || texts.na}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{texts.member}</p>
                <p className="font-medium">{session.memberName || texts.na}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.scheduling}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{texts.date}:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{texts.time}:</span>
              <span>
                {session.startTime} - {session.endTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{texts.duration}:</span>
              <span>
                {session.durationMinutes} {texts.minutes}
              </span>
            </div>
            {session.locationName && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{texts.location}:</span>
                <span>{session.locationName}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.payment}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{texts.price}:</span>
              <span className="font-medium">
                {session.price ? `${session.price} SAR` : texts.na}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.notes}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground">
                {session.notes || texts.noNotes}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Info (if cancelled) */}
        {session.status === "CANCELLED" && (
          <Card className="md:col-span-2 border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">{texts.cancel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {session.cancelledBy && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {texts.cancelledBy}:
                  </span>
                  <span>{session.cancelledBy}</span>
                </div>
              )}
              {session.cancellationReason && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {texts.cancellationReason}:
                  </span>
                  <span>{session.cancellationReason}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
