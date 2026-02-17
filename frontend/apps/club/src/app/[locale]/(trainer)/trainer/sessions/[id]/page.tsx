"use client";

import { use, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@liyaqa/shared/components/ui/alert-dialog";
import {
  usePTSession,
  useCompletePTSession,
  useCancelPTSession,
} from "@liyaqa/shared/queries/use-pt-sessions";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { cn, formatDate } from "@liyaqa/shared/utils";

const text = {
  sessionDetail: { en: "Session Detail", ar: "تفاصيل الجلسة" },
  back: { en: "Back to Sessions", ar: "العودة للجلسات" },
  memberInfo: { en: "Member Information", ar: "معلومات العضو" },
  sessionInfo: { en: "Session Information", ar: "معلومات الجلسة" },
  actions: { en: "Actions", ar: "الإجراءات" },
  complete: { en: "Complete Session", ar: "إتمام الجلسة" },
  cancel: { en: "Cancel Session", ar: "إلغاء الجلسة" },
  completing: { en: "Completing...", ar: "جاري الإتمام..." },
  cancelling: { en: "Cancelling...", ar: "جاري الإلغاء..." },
  confirmCancel: { en: "Cancel Session?", ar: "إلغاء الجلسة؟" },
  confirmCancelDesc: {
    en: "This action cannot be undone. The session will be marked as cancelled.",
    ar: "لا يمكن التراجع عن هذا الإجراء. سيتم تعليم الجلسة كملغاة.",
  },
  yes: { en: "Yes, Cancel", ar: "نعم، إلغاء" },
  no: { en: "No, Keep", ar: "لا، إبقاء" },
  trainerNotes: { en: "Session Notes", ar: "ملاحظات الجلسة" },
  notesPlaceholder: {
    en: "Add notes about the session (exercises, progress, etc.)...",
    ar: "أضف ملاحظات حول الجلسة (التمارين، التقدم، إلخ)...",
  },
  cancellationReason: { en: "Cancellation Reason", ar: "سبب الإلغاء" },
  reasonPlaceholder: { en: "Reason for cancellation (optional)...", ar: "سبب الإلغاء (اختياري)..." },
  date: { en: "Date", ar: "التاريخ" },
  time: { en: "Time", ar: "الوقت" },
  duration: { en: "Duration", ar: "المدة" },
  status: { en: "Status", ar: "الحالة" },
  location: { en: "Location", ar: "الموقع" },
  price: { en: "Price", ar: "السعر" },
  name: { en: "Name", ar: "الاسم" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  existingNotes: { en: "Existing Notes", ar: "ملاحظات سابقة" },
  minutes: { en: "minutes", ar: "دقيقة" },
  successComplete: { en: "Session completed successfully", ar: "تم إتمام الجلسة بنجاح" },
  successCancel: { en: "Session cancelled", ar: "تم إلغاء الجلسة" },
  errorComplete: { en: "Failed to complete session", ar: "فشل في إتمام الجلسة" },
  errorCancel: { en: "Failed to cancel session", ar: "فشل في إلغاء الجلسة" },
  loading: { en: "Loading...", ar: "جاري التحميل..." },
  notFound: { en: "Session not found", ar: "الجلسة غير موجودة" },
};

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

export default function TrainerSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = use(params);
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);

  const { data: session, isLoading, error } = usePTSession(id);
  const completeMutation = useCompletePTSession();
  const cancelMutation = useCancelPTSession();

  const [notes, setNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const canComplete =
    session &&
    ["CONFIRMED", "IN_PROGRESS", "REQUESTED"].includes(session.status);
  const canCancel =
    session &&
    ["CONFIRMED", "REQUESTED", "IN_PROGRESS"].includes(session.status);

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync({
        id,
        data: notes.trim() ? { trainerNotes: notes.trim() } : undefined,
      });
      toast({
        title: t("complete"),
        description: t("successComplete"),
      });
      router.push(`/${locale}/trainer/sessions`);
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: t("errorComplete"),
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({
        id,
        data: cancelReason.trim()
          ? { reason: cancelReason.trim() }
          : undefined,
      });
      toast({
        title: t("cancel"),
        description: t("successCancel"),
      });
      router.push(`/${locale}/trainer/sessions`);
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: t("errorCancel"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="py-8">
            <div className="space-y-3">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-56" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/trainer/sessions`}>
            <ArrowLeft className="h-4 w-4 me-2" />
            {t("back")}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("notFound")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabel = statusLabels[session.status];

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/trainer/sessions`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("sessionDetail")}
          </h1>
          <Badge variant={getStatusVariant(session.status)} className="mt-1">
            {statusLabel
              ? isAr
                ? statusLabel.ar
                : statusLabel.en
              : session.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Session info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {t("sessionInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{t("date")}</p>
                <p className="text-sm font-medium">
                  {formatDate(session.sessionDate, locale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("time")}</p>
                <p className="text-sm font-medium">
                  {session.startTime}
                  {session.endTime ? ` - ${session.endTime}` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("duration")}</p>
                <p className="text-sm font-medium">
                  {session.durationMinutes} {t("minutes")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("status")}</p>
                <Badge variant={getStatusVariant(session.status)}>
                  {statusLabel
                    ? isAr
                      ? statusLabel.ar
                      : statusLabel.en
                    : session.status}
                </Badge>
              </div>
            </div>
            {session.locationName && (
              <div>
                <p className="text-xs text-muted-foreground">{t("location")}</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {session.locationName}
                </p>
              </div>
            )}
            {session.price !== undefined && session.price !== null && (
              <div>
                <p className="text-xs text-muted-foreground">{t("price")}</p>
                <p className="text-sm font-medium">{session.price} SAR</p>
              </div>
            )}
            {session.trainerNotes && (
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("existingNotes")}
                </p>
                <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                  {session.trainerNotes}
                </p>
              </div>
            )}
            {session.cancellationReason && (
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("cancellationReason")}
                </p>
                <p className="text-sm mt-1 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-700 dark:text-red-300">
                  {session.cancellationReason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t("memberInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("name")}</p>
              <p className="text-sm font-medium">
                {session.memberName || "-"}
              </p>
            </div>
            {session.memberEmail && (
              <div>
                <p className="text-xs text-muted-foreground">{t("email")}</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {session.memberEmail}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {(canComplete || canCancel) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t("actions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Complete action */}
            {canComplete && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    {t("trainerNotes")}
                  </label>
                  <Textarea
                    placeholder={t("notesPlaceholder")}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleComplete}
                  disabled={completeMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {completeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      {t("completing")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 me-2" />
                      {t("complete")}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Cancel action */}
            {canCancel && (
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium">
                    {t("cancellationReason")}
                  </label>
                  <Textarea
                    placeholder={t("reasonPlaceholder")}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={cancelMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {cancelMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 me-2 animate-spin" />
                          {t("cancelling")}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 me-2" />
                          {t("cancel")}
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("confirmCancel")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("confirmCancelDesc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("no")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t("yes")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
