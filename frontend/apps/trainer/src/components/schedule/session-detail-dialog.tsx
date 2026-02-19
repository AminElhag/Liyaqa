"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Clock,
  User,
  CalendarIcon,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@liyaqa/shared/components/ui/dialog";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  usePTSession,
  useCompletePTSession,
  useMarkPTSessionNoShow,
  useCancelPTSession,
  useConfirmPTSession,
} from "@liyaqa/shared/queries/use-pt-sessions";
import { cn } from "@liyaqa/shared/utils";
import type { PTSessionStatus } from "@liyaqa/shared/types/pt-session";

const text = {
  title: { en: "Session Details", ar: "تفاصيل الجلسة" },
  client: { en: "Client", ar: "العميل" },
  date: { en: "Date", ar: "التاريخ" },
  time: { en: "Time", ar: "الوقت" },
  duration: { en: "Duration", ar: "المدة" },
  status: { en: "Status", ar: "الحالة" },
  notes: { en: "Notes", ar: "ملاحظات" },
  trainerNotes: { en: "Trainer Notes", ar: "ملاحظات المدرب" },
  trainerNotesPlaceholder: { en: "Add session notes...", ar: "أضف ملاحظات الجلسة..." },
  confirm: { en: "Confirm", ar: "تأكيد" },
  complete: { en: "Complete", ar: "إكمال" },
  noShow: { en: "No Show", ar: "لم يحضر" },
  cancel: { en: "Cancel Session", ar: "إلغاء الجلسة" },
  cancelReason: { en: "Cancellation reason (optional)", ar: "سبب الإلغاء (اختياري)" },
  cancelReasonPlaceholder: { en: "Why are you cancelling?", ar: "لماذا تقوم بالإلغاء؟" },
  confirmNoShow: { en: "Mark this session as no-show?", ar: "هل تريد تسجيل عدم حضور؟" },
  confirmCancel: { en: "Are you sure you want to cancel this session?", ar: "هل أنت متأكد من إلغاء هذه الجلسة؟" },
  yes: { en: "Yes", ar: "نعم" },
  back: { en: "Back", ar: "رجوع" },
  close: { en: "Close", ar: "إغلاق" },
  min: { en: "min", ar: "دقيقة" },
  success: { en: "Session updated", ar: "تم تحديث الجلسة" },
  error: { en: "Failed to update session", ar: "فشل في تحديث الجلسة" },
  REQUESTED: { en: "Requested", ar: "مطلوبة" },
  CONFIRMED: { en: "Confirmed", ar: "مؤكدة" },
  IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ" },
  COMPLETED: { en: "Completed", ar: "مكتملة" },
  CANCELLED: { en: "Cancelled", ar: "ملغاة" },
  NO_SHOW: { en: "No Show", ar: "لم يحضر" },
};

function getStatusBadgeVariant(status: PTSessionStatus) {
  switch (status) {
    case "CONFIRMED":
      return "default" as const;
    case "COMPLETED":
      return "secondary" as const;
    case "CANCELLED":
    case "NO_SHOW":
      return "destructive" as const;
    case "REQUESTED":
    case "IN_PROGRESS":
    default:
      return "outline" as const;
  }
}

interface SessionDetailDialogProps {
  sessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ActionView = "detail" | "complete" | "noshow" | "cancel";

export function SessionDetailDialog({
  sessionId,
  open,
  onOpenChange,
}: SessionDetailDialogProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);
  const { toast } = useToast();

  const [view, setView] = useState<ActionView>("detail");
  const [trainerNotes, setTrainerNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const { data: session, isLoading } = usePTSession(sessionId ?? undefined, {
    enabled: open && !!sessionId,
  });

  const completeMutation = useCompletePTSession();
  const noShowMutation = useMarkPTSessionNoShow();
  const cancelMutation = useCancelPTSession();
  const confirmMutation = useConfirmPTSession();

  const isAnyLoading =
    completeMutation.isPending ||
    noShowMutation.isPending ||
    cancelMutation.isPending ||
    confirmMutation.isPending;

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setView("detail");
      setTrainerNotes("");
      setCancelReason("");
    }
    onOpenChange(newOpen);
  }

  async function handleConfirm() {
    if (!sessionId) return;
    try {
      await confirmMutation.mutateAsync(sessionId);
      toast({ title: t("success") });
      handleOpenChange(false);
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
  }

  async function handleComplete() {
    if (!sessionId) return;
    try {
      await completeMutation.mutateAsync({
        id: sessionId,
        data: trainerNotes ? { trainerNotes } : undefined,
      });
      toast({ title: t("success") });
      handleOpenChange(false);
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
  }

  async function handleNoShow() {
    if (!sessionId) return;
    try {
      await noShowMutation.mutateAsync(sessionId);
      toast({ title: t("success") });
      handleOpenChange(false);
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
  }

  async function handleCancel() {
    if (!sessionId) return;
    try {
      await cancelMutation.mutateAsync({
        id: sessionId,
        data: cancelReason ? { reason: cancelReason } : undefined,
      });
      toast({ title: t("success") });
      handleOpenChange(false);
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
  }

  const isFinalState =
    session?.status === "COMPLETED" ||
    session?.status === "CANCELLED" ||
    session?.status === "NO_SHOW";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("title")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : !session ? (
          <p className="py-4 text-sm text-muted-foreground">
            {isAr ? "الجلسة غير موجودة" : "Session not found"}
          </p>
        ) : view === "detail" ? (
          <div className="space-y-4 py-4">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(session.status)}>
                {t(session.status as keyof typeof text)}
              </Badge>
            </div>

            {/* Session info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">
                  {session.memberName || session.memberEmail || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{session.sessionDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5)}
                  <span className="ms-2 text-muted-foreground">
                    ({session.durationMinutes} {t("min")})
                  </span>
                </span>
              </div>
              {session.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{session.notes}</span>
                </div>
              )}
              {session.trainerNotes && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <span className="font-medium">{t("trainerNotes")}:</span>{" "}
                  {session.trainerNotes}
                </div>
              )}
              {session.cancellationReason && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {session.cancellationReason}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {!isFinalState && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {session.status === "REQUESTED" && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleConfirm}
                      disabled={isAnyLoading}
                    >
                      {confirmMutation.isPending ? (
                        <Loader2 className="me-1 h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="me-1 h-3 w-3" />
                      )}
                      {t("confirm")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setView("cancel")}
                      disabled={isAnyLoading}
                    >
                      <XCircle className="me-1 h-3 w-3" />
                      {t("cancel")}
                    </Button>
                  </>
                )}
                {(session.status === "CONFIRMED" || session.status === "IN_PROGRESS") && (
                  <Button
                    size="sm"
                    onClick={() => setView("complete")}
                    disabled={isAnyLoading}
                  >
                    <CheckCircle2 className="me-1 h-3 w-3" />
                    {t("complete")}
                  </Button>
                )}
                {session.status === "CONFIRMED" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setView("noshow")}
                      disabled={isAnyLoading}
                    >
                      <AlertTriangle className="me-1 h-3 w-3" />
                      {t("noShow")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setView("cancel")}
                      disabled={isAnyLoading}
                    >
                      <XCircle className="me-1 h-3 w-3" />
                      {t("cancel")}
                    </Button>
                  </>
                )}
              </div>
            )}

            {isFinalState && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOpenChange(false)}
                >
                  {t("close")}
                </Button>
              </div>
            )}
          </div>
        ) : view === "complete" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("trainerNotes")}</Label>
              <Textarea
                placeholder={t("trainerNotesPlaceholder")}
                value={trainerNotes}
                onChange={(e) => setTrainerNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setView("detail")}
                disabled={isAnyLoading}
              >
                {t("back")}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isAnyLoading}
                className="flex-1"
              >
                {completeMutation.isPending ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="me-2 h-4 w-4" />
                )}
                {t("complete")}
              </Button>
            </div>
          </div>
        ) : view === "noshow" ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{t("confirmNoShow")}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setView("detail")}
                disabled={isAnyLoading}
              >
                {t("back")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleNoShow}
                disabled={isAnyLoading}
                className="flex-1"
              >
                {noShowMutation.isPending ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="me-2 h-4 w-4" />
                )}
                {t("noShow")}
              </Button>
            </div>
          </div>
        ) : view === "cancel" ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{t("confirmCancel")}</p>
            <div className="space-y-2">
              <Label>{t("cancelReason")}</Label>
              <Textarea
                placeholder={t("cancelReasonPlaceholder")}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setView("detail")}
                disabled={isAnyLoading}
              >
                {t("back")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isAnyLoading}
                className="flex-1"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="me-2 h-4 w-4" />
                )}
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
