"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Gift,
  Snowflake,
  Percent,
  ArrowDown,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

import {
  useCancellationPreview,
  useRequestCancellation,
  useAcceptRetentionOffer,
} from "@/queries/use-member-subscription";
import { CancellationReasonCategory, RetentionOffer } from "@/types/contract";
import { UUID } from "@/types/api";

interface CancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: UUID;
}

const REASON_OPTIONS: { value: CancellationReasonCategory; labelEn: string; labelAr: string }[] = [
  { value: "FINANCIAL", labelEn: "Financial reasons", labelAr: "أسباب مالية" },
  { value: "RELOCATION", labelEn: "Moving/Relocating", labelAr: "الانتقال" },
  { value: "HEALTH", labelEn: "Health issues", labelAr: "مشاكل صحية" },
  { value: "DISSATISFACTION", labelEn: "Not satisfied with service", labelAr: "غير راضٍ عن الخدمة" },
  { value: "USAGE", labelEn: "Not using it enough", labelAr: "لا أستخدمه بشكل كافٍ" },
  { value: "COMPETITION", labelEn: "Switching to another gym", labelAr: "الانتقال لنادٍ آخر" },
  { value: "PERSONAL", labelEn: "Personal reasons", labelAr: "أسباب شخصية" },
  { value: "OTHER", labelEn: "Other", labelAr: "أخرى" },
];

export function CancellationDialog({
  open,
  onOpenChange,
  subscriptionId,
}: CancellationDialogProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [step, setStep] = useState<"preview" | "reason" | "offers" | "confirm" | "success">("preview");
  const [reason, setReason] = useState<CancellationReasonCategory | null>(null);
  const [reasonDetail, setReasonDetail] = useState("");
  const [acceptedOffer, setAcceptedOffer] = useState<RetentionOffer | null>(null);

  // Queries
  const { data: preview, isLoading: previewLoading } = useCancellationPreview(open);

  // Mutations
  const cancelMutation = useRequestCancellation();
  const acceptOfferMutation = useAcceptRetentionOffer();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("preview");
      setReason(null);
      setReasonDetail("");
      setAcceptedOffer(null);
    }
  }, [open]);

  const handleContinueToReason = () => {
    setStep("reason");
  };

  const handleContinueToOffers = () => {
    if (!reason) return;
    setStep("offers");
  };

  const handleAcceptOffer = async (offer: RetentionOffer) => {
    try {
      await acceptOfferMutation.mutateAsync(offer.id);
      setAcceptedOffer(offer);
      setStep("success");
    } catch (error) {
      toast.error(
        isArabic ? "حدث خطأ أثناء قبول العرض" : "Failed to accept offer"
      );
    }
  };

  const handleConfirmCancellation = async () => {
    if (!reason) return;

    try {
      await cancelMutation.mutateAsync({
        reasonCategory: reason,
        reasonDetail: reasonDetail || undefined,
      });

      toast.success(
        preview?.isWithinCoolingOff
          ? isArabic
            ? "تم إلغاء اشتراكك وستحصل على استرداد كامل"
            : "Your subscription has been cancelled with full refund"
          : isArabic
          ? "تم تقديم طلب الإلغاء"
          : "Your cancellation request has been submitted"
      );

      onOpenChange(false);
    } catch (error) {
      toast.error(
        isArabic ? "حدث خطأ أثناء الإلغاء" : "Failed to cancel subscription"
      );
    }
  };

  const isLoading = cancelMutation.isPending || acceptOfferMutation.isPending;

  const getOfferIcon = (type: string) => {
    switch (type) {
      case "FREE_FREEZE":
        return <Snowflake className="h-5 w-5" />;
      case "DISCOUNT":
        return <Percent className="h-5 w-5" />;
      case "DOWNGRADE":
        return <ArrowDown className="h-5 w-5" />;
      default:
        return <Gift className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "success"
              ? isArabic
                ? "شكراً لك!"
                : "Thank You!"
              : isArabic
              ? "إلغاء الاشتراك"
              : "Cancel Subscription"}
          </DialogTitle>
          <DialogDescription>
            {step === "preview" &&
              (isArabic
                ? "راجع تفاصيل الإلغاء"
                : "Review cancellation details")}
            {step === "reason" &&
              (isArabic
                ? "أخبرنا لماذا تريد الإلغاء"
                : "Tell us why you want to cancel")}
            {step === "offers" &&
              (isArabic
                ? "قبل أن تذهب، فكر في هذه العروض"
                : "Before you go, consider these offers")}
            {step === "confirm" &&
              (isArabic ? "تأكيد الإلغاء" : "Confirm cancellation")}
          </DialogDescription>
        </DialogHeader>

        {/* PREVIEW STEP */}
        {step === "preview" && (
          <div className="space-y-4">
            {previewLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : preview ? (
              <>
                {/* Cooling-off notice */}
                {preview.isWithinCoolingOff && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-medium text-blue-800">
                      {isArabic
                        ? "أنت ضمن فترة التراجع"
                        : "You're within the cooling-off period"}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      {isArabic
                        ? `يمكنك الإلغاء مع استرداد كامل. ${preview.coolingOffDaysRemaining} أيام متبقية`
                        : `You can cancel with a full refund. ${preview.coolingOffDaysRemaining} days remaining`}
                    </p>
                  </div>
                )}

                {/* Commitment warning */}
                {preview.isWithinCommitment && !preview.isWithinCoolingOff && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">
                          {isArabic
                            ? "أنت ضمن فترة الالتزام"
                            : "You're within your commitment period"}
                        </p>
                        <p className="text-sm text-yellow-600 mt-1">
                          {isArabic
                            ? `رسوم الإنهاء المبكر: ${preview.earlyTerminationFee} ${preview.earlyTerminationFeeCurrency}`
                            : `Early termination fee: ${preview.earlyTerminationFeeCurrency} ${preview.earlyTerminationFee}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancellation details */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {isArabic ? "فترة الإشعار" : "Notice period"}
                    </span>
                    <span className="font-medium">
                      {preview.noticePeriodDays} {isArabic ? "يوم" : "days"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {isArabic ? "تاريخ السريان" : "Effective date"}
                    </span>
                    <span className="font-medium">
                      {new Date(preview.effectiveDate).toLocaleDateString(
                        isArabic ? "ar-SA" : undefined
                      )}
                    </span>
                  </div>
                  {preview.earlyTerminationFee > 0 && !preview.isWithinCoolingOff && (
                    <div className="flex justify-between text-red-600">
                      <span>
                        {isArabic ? "رسوم الإنهاء المبكر" : "Early termination fee"}
                      </span>
                      <span className="font-medium">
                        {preview.earlyTerminationFee} {preview.earlyTerminationFeeCurrency}
                      </span>
                    </div>
                  )}
                  {preview.refundAmount && (
                    <div className="flex justify-between text-green-600">
                      <span>{isArabic ? "مبلغ الاسترداد" : "Refund amount"}</span>
                      <span className="font-medium">
                        {preview.refundAmount} {preview.earlyTerminationFeeCurrency}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* REASON STEP */}
        {step === "reason" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {isArabic ? "سبب الإلغاء" : "Reason for cancellation"}
              </Label>
              <Select
                value={reason || undefined}
                onValueChange={(value) =>
                  setReason(value as CancellationReasonCategory)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isArabic ? "اختر السبب" : "Select a reason"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {isArabic ? option.labelAr : option.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {isArabic ? "تفاصيل إضافية (اختياري)" : "Additional details (optional)"}
              </Label>
              <Textarea
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                placeholder={
                  isArabic
                    ? "أخبرنا المزيد عن سبب إلغائك..."
                    : "Tell us more about why you're cancelling..."
                }
                rows={3}
              />
            </div>
          </div>
        )}

        {/* OFFERS STEP */}
        {step === "offers" && preview && (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              {isArabic
                ? "نحن نقدر عضويتك. هل يمكننا تقديم شيء لتبقى معنا؟"
                : "We value your membership. Can we offer something to keep you?"}
            </p>

            <div className="space-y-3">
              {preview.retentionOffers.map((offer) => (
                <button
                  key={offer.id}
                  onClick={() => handleAcceptOffer(offer)}
                  disabled={isLoading}
                  className="w-full text-left p-4 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      {getOfferIcon(offer.offerType)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {isArabic ? offer.titleAr || offer.titleEn : offer.titleEn}
                      </p>
                      {offer.descriptionEn && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {isArabic
                            ? offer.descriptionAr || offer.descriptionEn
                            : offer.descriptionEn}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Separator />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setStep("confirm")}
              disabled={isLoading}
            >
              {isArabic ? "لا شكراً، متابعة الإلغاء" : "No thanks, continue cancelling"}
            </Button>
          </div>
        )}

        {/* CONFIRM STEP */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="font-medium text-red-800">
                {isArabic
                  ? "هل أنت متأكد أنك تريد إلغاء اشتراكك؟"
                  : "Are you sure you want to cancel your subscription?"}
              </p>
              <p className="text-sm text-red-600 mt-1">
                {isArabic
                  ? "لا يمكن التراجع عن هذا الإجراء"
                  : "This action cannot be undone"}
              </p>
            </div>

            {preview && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {isArabic
                      ? `ستنتهي عضويتك في ${new Date(
                          preview.effectiveDate
                        ).toLocaleDateString("ar-SA")}`
                      : `Your membership will end on ${new Date(
                          preview.effectiveDate
                        ).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUCCESS STEP */}
        {step === "success" && acceptedOffer && (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div>
              <p className="font-medium text-lg">
                {isArabic
                  ? "تم قبول عرضك!"
                  : "Your offer has been accepted!"}
              </p>
              <p className="text-muted-foreground mt-2">
                {isArabic
                  ? "تم إلغاء طلب الإلغاء وتطبيق العرض على حسابك"
                  : "Your cancellation has been withdrawn and the offer applied to your account"}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button variant="destructive" onClick={handleContinueToReason}>
                {isArabic ? "متابعة" : "Continue"}
              </Button>
            </>
          )}

          {step === "reason" && (
            <>
              <Button variant="outline" onClick={() => setStep("preview")}>
                {isArabic ? "رجوع" : "Back"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleContinueToOffers}
                disabled={!reason}
              >
                {isArabic ? "متابعة" : "Continue"}
              </Button>
            </>
          )}

          {step === "confirm" && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("offers")}
                disabled={isLoading}
              >
                {isArabic ? "رجوع" : "Back"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancellation}
                disabled={isLoading}
              >
                {isLoading && <Spinner className="h-4 w-4 mr-2" />}
                {isArabic ? "تأكيد الإلغاء" : "Confirm Cancellation"}
              </Button>
            </>
          )}

          {step === "success" && (
            <Button onClick={() => onOpenChange(false)}>
              {isArabic ? "إغلاق" : "Close"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
