"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import type { DealSummary, LoseDealRequest } from "@liyaqa/shared/types/platform";
import { getLocalizedText } from "@liyaqa/shared/utils";

interface LoseDealDialogProps {
  deal: DealSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: LoseDealRequest) => void;
  isLoading?: boolean;
}

export function LoseDealDialog({
  deal,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: LoseDealDialogProps) {
  const locale = useLocale();
  const [reasonEn, setReasonEn] = useState("");
  const [reasonAr, setReasonAr] = useState("");

  const texts = {
    title: locale === "ar" ? "تسجيل خسارة الصفقة" : "Mark Deal as Lost",
    description:
      locale === "ar"
        ? "يرجى تقديم سبب خسارة هذه الصفقة"
        : "Please provide a reason for losing this deal",
    dealTitle: locale === "ar" ? "الصفقة" : "Deal",
    reasonEn: locale === "ar" ? "السبب (إنجليزي)" : "Reason (EN)",
    reasonAr: locale === "ar" ? "السبب (عربي)" : "Reason (AR)",
    reasonPlaceholderEn: locale === "ar" ? "أدخل السبب بالإنجليزية..." : "Enter reason in English...",
    reasonPlaceholderAr: locale === "ar" ? "أدخل السبب بالعربية..." : "Enter reason in Arabic...",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    confirm: locale === "ar" ? "تأكيد الخسارة" : "Confirm Loss",
    confirming: locale === "ar" ? "جاري التأكيد..." : "Confirming...",
    required: locale === "ar" ? "السبب مطلوب" : "Reason is required",
  };

  const handleSubmit = () => {
    if (!reasonEn.trim()) {
      return;
    }
    onConfirm({
      reasonEn: reasonEn.trim(),
      reasonAr: reasonAr.trim() || undefined,
    });
  };

  const handleClose = () => {
    setReasonEn("");
    setReasonAr("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{texts.title}</DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        {deal && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{texts.dealTitle}</p>
              <p className="font-medium">{getLocalizedText(deal.title, locale)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonEn">{texts.reasonEn} *</Label>
              <Textarea
                id="reasonEn"
                value={reasonEn}
                onChange={(e) => setReasonEn(e.target.value)}
                placeholder={texts.reasonPlaceholderEn}
                rows={3}
              />
              {!reasonEn.trim() && (
                <p className="text-sm text-muted-foreground">{texts.required}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonAr">{texts.reasonAr}</Label>
              <Textarea
                id="reasonAr"
                value={reasonAr}
                onChange={(e) => setReasonAr(e.target.value)}
                placeholder={texts.reasonPlaceholderAr}
                dir="rtl"
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {texts.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || !reasonEn.trim()}
          >
            {isLoading ? texts.confirming : texts.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
