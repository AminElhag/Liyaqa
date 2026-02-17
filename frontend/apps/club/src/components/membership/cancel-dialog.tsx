"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@liyaqa/shared/components/ui/radio-group";
import { Alert, AlertDescription } from "@liyaqa/shared/components/ui/alert";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useCancelSubscriptionWithReason } from "@liyaqa/shared/queries/use-subscriptions";
import type { UUID } from "@liyaqa/shared/types/api";
import type { CancelReasonCategory } from "@liyaqa/shared/types/member";

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: UUID;
  memberId: UUID;
  onSuccess?: () => void;
}

const reasonCategories: CancelReasonCategory[] = [
  "FINANCIAL",
  "RELOCATION",
  "HEALTH",
  "DISSATISFACTION",
  "USAGE",
  "OTHER",
];

export function CancelDialog({
  open,
  onOpenChange,
  subscriptionId,
  memberId,
  onSuccess,
}: CancelDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const cancelMutation = useCancelSubscriptionWithReason();

  const [reasonCategory, setReasonCategory] = useState<CancelReasonCategory | "">("");
  const [reason, setReason] = useState("");
  const [timing, setTiming] = useState<"end-of-period" | "immediate">("end-of-period");

  const texts = {
    title: locale === "ar" ? "إلغاء العضوية" : "Cancel Membership",
    description: locale === "ar"
      ? "هل أنت متأكد من إلغاء هذه العضوية؟ هذا الإجراء لا يمكن التراجع عنه."
      : "Are you sure you want to cancel this membership? This action cannot be undone.",
    reasonCategory: locale === "ar" ? "سبب الإلغاء" : "Cancellation Reason",
    selectReason: locale === "ar" ? "اختر السبب" : "Select reason",
    details: locale === "ar" ? "تفاصيل إضافية" : "Additional Details",
    detailsPlaceholder: locale === "ar" ? "أدخل تفاصيل إضافية..." : "Enter additional details...",
    timing: locale === "ar" ? "توقيت الإلغاء" : "Cancellation Timing",
    endOfPeriod: locale === "ar" ? "نهاية الفترة الحالية" : "End of current period",
    endOfPeriodDesc: locale === "ar" ? "يستمر حتى نهاية فترة الاشتراك" : "Continues until end of billing period",
    immediate: locale === "ar" ? "فوري" : "Immediate",
    immediateDesc: locale === "ar" ? "ينتهي الاشتراك فوراً" : "Subscription ends immediately",
    terminationFeeWarning: locale === "ar"
      ? "قد يتم تطبيق رسوم إنهاء مبكر عند الإلغاء الفوري"
      : "Early termination fees may apply for immediate cancellation",
    cancel: locale === "ar" ? "تراجع" : "Go Back",
    confirm: locale === "ar" ? "تأكيد الإلغاء" : "Confirm Cancellation",
    confirming: locale === "ar" ? "جاري الإلغاء..." : "Cancelling...",
    successTitle: locale === "ar" ? "تم إلغاء العضوية" : "Membership Cancelled",
    successDesc: locale === "ar" ? "تم إلغاء العضوية بنجاح" : "The membership has been cancelled successfully",
    errorTitle: locale === "ar" ? "خطأ في الإلغاء" : "Cancellation Error",
    categories: {
      FINANCIAL: locale === "ar" ? "أسباب مالية" : "Financial",
      RELOCATION: locale === "ar" ? "انتقال" : "Relocation",
      HEALTH: locale === "ar" ? "أسباب صحية" : "Health",
      DISSATISFACTION: locale === "ar" ? "عدم رضا" : "Dissatisfaction",
      USAGE: locale === "ar" ? "قلة الاستخدام" : "Low Usage",
      OTHER: locale === "ar" ? "أخرى" : "Other",
    },
  };

  const handleSubmit = async () => {
    try {
      await cancelMutation.mutateAsync({
        id: subscriptionId,
        data: {
          reasonCategory: reasonCategory || undefined,
          reason: reason || undefined,
          immediate: timing === "immediate",
        },
      });

      toast({ title: texts.successTitle, description: texts.successDesc });
      setReasonCategory("");
      setReason("");
      setTiming("end-of-period");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reason Category */}
          <div className="space-y-2">
            <Label>{texts.reasonCategory}</Label>
            <Select
              value={reasonCategory}
              onValueChange={(val) => setReasonCategory(val as CancelReasonCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.selectReason} />
              </SelectTrigger>
              <SelectContent>
                {reasonCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {texts.categories[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason Detail */}
          <div className="space-y-2">
            <Label>{texts.details}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={texts.detailsPlaceholder}
              rows={3}
            />
          </div>

          {/* Timing */}
          <div className="space-y-2">
            <Label>{texts.timing}</Label>
            <RadioGroup
              value={timing}
              onValueChange={(val) => setTiming(val as "end-of-period" | "immediate")}
              className="space-y-2"
            >
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <RadioGroupItem value="end-of-period" id="end-of-period" className="mt-0.5" />
                <label htmlFor="end-of-period" className="flex-1 cursor-pointer">
                  <p className="font-medium text-sm">{texts.endOfPeriod}</p>
                  <p className="text-xs text-muted-foreground">{texts.endOfPeriodDesc}</p>
                </label>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <RadioGroupItem value="immediate" id="immediate" className="mt-0.5" />
                <label htmlFor="immediate" className="flex-1 cursor-pointer">
                  <p className="font-medium text-sm">{texts.immediate}</p>
                  <p className="text-xs text-muted-foreground">{texts.immediateDesc}</p>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Termination fee warning for immediate */}
          {timing === "immediate" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{texts.terminationFeeWarning}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelMutation.isPending}
          >
            {texts.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {texts.confirming}
              </>
            ) : (
              texts.confirm
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
