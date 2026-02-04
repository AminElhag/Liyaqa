"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@liyaqa/shared/components/ui/button";
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
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { useMarkLeadLost } from "@liyaqa/shared/queries/use-leads";
import type { Lead } from "@liyaqa/shared/types/lead";

interface LeadLostDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type LossReasonCategory =
  | "PRICE"
  | "LOCATION"
  | "COMPETITION"
  | "NOT_READY"
  | "NO_RESPONSE"
  | "OTHER";

const LOSS_REASON_LABELS: Record<LossReasonCategory, { en: string; ar: string }> = {
  PRICE: { en: "Price too high", ar: "السعر مرتفع" },
  LOCATION: { en: "Location not convenient", ar: "الموقع غير مناسب" },
  COMPETITION: { en: "Chose competitor", ar: "اختار منافس" },
  NOT_READY: { en: "Not ready to commit", ar: "غير مستعد للالتزام" },
  NO_RESPONSE: { en: "No response", ar: "لا يوجد رد" },
  OTHER: { en: "Other reason", ar: "سبب آخر" },
};

export function LeadLostDialog({
  lead,
  open,
  onOpenChange,
  onSuccess,
}: LeadLostDialogProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [reasonCategory, setReasonCategory] = useState<LossReasonCategory | "">("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const markLostMutation = useMarkLeadLost();

  const handleReset = () => {
    setReasonCategory("");
    setAdditionalNotes("");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!lead || !reasonCategory) return;

    const reasonLabel = isArabic
      ? LOSS_REASON_LABELS[reasonCategory].ar
      : LOSS_REASON_LABELS[reasonCategory].en;

    const fullReason = additionalNotes
      ? `${reasonLabel}: ${additionalNotes}`
      : reasonLabel;

    try {
      await markLostMutation.mutateAsync({
        id: lead.id,
        reason: fullReason,
      });

      toast.success(
        isArabic
          ? "تم تحديث حالة العميل المحتمل إلى مفقود"
          : "Lead marked as lost"
      );

      handleClose();
      onSuccess?.();
    } catch {
      toast.error(
        isArabic
          ? "فشل في تحديث الحالة"
          : "Failed to update status"
      );
    }
  };

  const isProcessing = markLostMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isArabic ? "تحديد كمفقود" : "Mark as Lost"}
          </DialogTitle>
          <DialogDescription>
            {isArabic
              ? `لماذا فقدت ${lead?.name}؟`
              : `Why was ${lead?.name} lost?`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Category */}
          <div className="space-y-2">
            <Label>{isArabic ? "السبب الرئيسي" : "Primary Reason"}</Label>
            <Select
              value={reasonCategory}
              onValueChange={(value) => setReasonCategory(value as LossReasonCategory)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isArabic ? "اختر السبب" : "Select a reason"}
                />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LOSS_REASON_LABELS) as LossReasonCategory[]).map(
                  (key) => (
                    <SelectItem key={key} value={key}>
                      {isArabic
                        ? LOSS_REASON_LABELS[key].ar
                        : LOSS_REASON_LABELS[key].en}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label>{isArabic ? "ملاحظات إضافية" : "Additional Notes"}</Label>
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder={
                isArabic
                  ? "أضف أي تفاصيل إضافية..."
                  : "Add any additional details..."
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reasonCategory || isProcessing}
            variant="destructive"
          >
            {isProcessing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isArabic ? "تحديد كمفقود" : "Mark as Lost"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
