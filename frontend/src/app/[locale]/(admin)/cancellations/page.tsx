"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  UserMinus,
  Clock,
  AlertTriangle,
  DollarSign,
  UserCheck,
  FastForward,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loading, Spinner } from "@/components/ui/spinner";
import {
  usePendingCancellations,
  useWaiveTerminationFee,
  useSaveMember,
  useExpediteCancellation,
} from "@/queries/use-admin-contracts";
import { PendingCancellation, CancellationReasonCategory } from "@/types/contract";
import { toast } from "sonner";

type ActionType = "waive" | "save" | "expedite" | null;

export default function CancellationsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  // State
  const [page, setPage] = useState(0);
  const [selectedCancellation, setSelectedCancellation] = useState<PendingCancellation | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [reason, setReason] = useState("");

  // Queries
  const { data: cancellationsPage, isLoading } = usePendingCancellations(page, 10);

  // Mutations
  const waiveMutation = useWaiveTerminationFee();
  const saveMutation = useSaveMember();
  const expediteMutation = useExpediteCancellation();

  const handleAction = async () => {
    if (!selectedCancellation || !actionType) return;

    try {
      if (actionType === "waive") {
        await waiveMutation.mutateAsync({ id: selectedCancellation.id, reason });
        toast.success(isArabic ? "تم التنازل عن الرسوم" : "Fee waived successfully");
      } else if (actionType === "save") {
        await saveMutation.mutateAsync({ id: selectedCancellation.id, reason });
        toast.success(isArabic ? "تم الاحتفاظ بالعضو" : "Member saved successfully");
      } else if (actionType === "expedite") {
        await expediteMutation.mutateAsync({ id: selectedCancellation.id, reason });
        toast.success(isArabic ? "تم تسريع الإلغاء" : "Cancellation expedited");
      }
      closeDialog();
    } catch {
      toast.error(isArabic ? "حدث خطأ" : "An error occurred");
    }
  };

  const closeDialog = () => {
    setSelectedCancellation(null);
    setActionType(null);
    setReason("");
  };

  const openAction = (cancellation: PendingCancellation, action: ActionType) => {
    setSelectedCancellation(cancellation);
    setActionType(action);
  };

  const getReasonLabel = (category: CancellationReasonCategory) => {
    const labels: Record<CancellationReasonCategory, { en: string; ar: string }> = {
      FINANCIAL: { en: "Financial", ar: "مالي" },
      RELOCATION: { en: "Relocation", ar: "انتقال" },
      HEALTH: { en: "Health", ar: "صحي" },
      DISSATISFACTION: { en: "Dissatisfaction", ar: "عدم رضا" },
      USAGE: { en: "Low Usage", ar: "استخدام منخفض" },
      COMPETITION: { en: "Competition", ar: "منافسة" },
      PERSONAL: { en: "Personal", ar: "شخصي" },
      OTHER: { en: "Other", ar: "أخرى" },
    };
    return isArabic ? labels[category].ar : labels[category].en;
  };

  const texts = {
    title: isArabic ? "طلبات الإلغاء" : "Pending Cancellations",
    description: isArabic ? "إدارة طلبات إلغاء الاشتراكات" : "Manage subscription cancellation requests",
    member: isArabic ? "العضو" : "Member",
    plan: isArabic ? "الباقة" : "Plan",
    reason: isArabic ? "السبب" : "Reason",
    requestedAt: isArabic ? "تاريخ الطلب" : "Requested",
    effectiveDate: isArabic ? "تاريخ السريان" : "Effective Date",
    daysRemaining: isArabic ? "الأيام المتبقية" : "Days Left",
    terminationFee: isArabic ? "رسوم الإنهاء" : "Termination Fee",
    actions: isArabic ? "الإجراءات" : "Actions",
    waiveFee: isArabic ? "التنازل عن الرسوم" : "Waive Fee",
    saveMember: isArabic ? "الاحتفاظ بالعضو" : "Save Member",
    expedite: isArabic ? "تسريع الإلغاء" : "Expedite",
    noCancellations: isArabic ? "لا توجد طلبات إلغاء" : "No pending cancellations",
    feeWaived: isArabic ? "تم التنازل" : "Waived",
    enterReason: isArabic ? "أدخل سبب الإجراء..." : "Enter reason for action...",
    confirm: isArabic ? "تأكيد" : "Confirm",
    cancel: isArabic ? "إلغاء" : "Cancel",
    waiveFeeTitle: isArabic ? "التنازل عن رسوم الإنهاء" : "Waive Termination Fee",
    waiveFeeDesc: isArabic
      ? "سيتم إزالة رسوم الإنهاء المبكر من حساب العضو"
      : "The early termination fee will be removed from the member's account",
    saveMemberTitle: isArabic ? "الاحتفاظ بالعضو" : "Save Member",
    saveMemberDesc: isArabic
      ? "سيتم إلغاء طلب الإلغاء والاحتفاظ باشتراك العضو"
      : "The cancellation request will be cancelled and the member's subscription will be retained",
    expediteTitle: isArabic ? "تسريع الإلغاء" : "Expedite Cancellation",
    expediteDesc: isArabic
      ? "سيتم إنهاء الاشتراك فوراً بدلاً من انتظار نهاية فترة الإشعار"
      : "The subscription will be terminated immediately instead of waiting for the notice period",
    previous: isArabic ? "السابق" : "Previous",
    next: isArabic ? "التالي" : "Next",
  };

  const isActionLoading = waiveMutation.isPending || saveMutation.isPending || expediteMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-primary" />
            <CardTitle>{texts.title}</CardTitle>
          </div>
          <CardDescription>{texts.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {cancellationsPage?.content.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserMinus className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{texts.noCancellations}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{texts.member}</TableHead>
                    <TableHead>{texts.plan}</TableHead>
                    <TableHead>{texts.reason}</TableHead>
                    <TableHead>{texts.requestedAt}</TableHead>
                    <TableHead>{texts.effectiveDate}</TableHead>
                    <TableHead>{texts.daysRemaining}</TableHead>
                    <TableHead>{texts.terminationFee}</TableHead>
                    <TableHead className="text-right">{texts.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancellationsPage?.content.map((cancellation: PendingCancellation) => (
                    <TableRow key={cancellation.id}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/${locale}/members/${cancellation.memberId}`}
                            className="font-medium hover:underline"
                          >
                            {cancellation.memberName}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {cancellation.memberEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{cancellation.planName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getReasonLabel(cancellation.reasonCategory)}
                        </Badge>
                        {cancellation.reasonDetail && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
                            {cancellation.reasonDetail}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(cancellation.requestedAt).toLocaleDateString(
                          isArabic ? "ar-SA" : undefined
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(cancellation.effectiveDate).toLocaleDateString(
                          isArabic ? "ar-SA" : undefined
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={cancellation.daysRemaining <= 7 ? "destructive" : "secondary"}
                          className="gap-1"
                        >
                          <Clock className="h-3 w-3" />
                          {cancellation.daysRemaining} {isArabic ? "يوم" : "days"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cancellation.feeWaived ? (
                          <Badge variant="outline" className="text-green-600">
                            {texts.feeWaived}
                          </Badge>
                        ) : cancellation.earlyTerminationFee > 0 ? (
                          <span className="font-medium text-destructive">
                            {cancellation.earlyTerminationFee}{" "}
                            {cancellation.earlyTerminationFeeCurrency}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!cancellation.feeWaived && cancellation.earlyTerminationFee > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAction(cancellation, "waive")}
                              title={texts.waiveFee}
                            >
                              <DollarSign className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAction(cancellation, "save")}
                            title={texts.saveMember}
                          >
                            <UserCheck className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAction(cancellation, "expedite")}
                            title={texts.expedite}
                          >
                            <FastForward className="h-4 w-4 text-orange-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {cancellationsPage && cancellationsPage.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? `${cancellationsPage.totalElements} طلب`
                  : `${cancellationsPage.totalElements} requests`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  {texts.previous}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= cancellationsPage.totalPages - 1}
                >
                  {texts.next}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionType !== null} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "waive" && texts.waiveFeeTitle}
              {actionType === "save" && texts.saveMemberTitle}
              {actionType === "expedite" && texts.expediteTitle}
            </DialogTitle>
            <DialogDescription>
              {actionType === "waive" && texts.waiveFeeDesc}
              {actionType === "save" && texts.saveMemberDesc}
              {actionType === "expedite" && texts.expediteDesc}
            </DialogDescription>
          </DialogHeader>

          {selectedCancellation && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-medium">{selectedCancellation.memberName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCancellation.planName}
                </p>
                {actionType === "waive" && (
                  <p className="text-sm text-destructive mt-2">
                    {isArabic ? "رسوم الإنهاء:" : "Termination Fee:"}{" "}
                    {selectedCancellation.earlyTerminationFee}{" "}
                    {selectedCancellation.earlyTerminationFeeCurrency}
                  </p>
                )}
              </div>

              <Textarea
                placeholder={texts.enterReason}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isActionLoading}>
              {texts.cancel}
            </Button>
            <Button
              onClick={handleAction}
              disabled={!reason.trim() || isActionLoading}
              variant={actionType === "expedite" ? "destructive" : "default"}
            >
              {isActionLoading && <Spinner className="h-4 w-4 me-2" />}
              {texts.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
