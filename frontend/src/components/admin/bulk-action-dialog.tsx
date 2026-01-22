"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import type { BulkOperationResponse, BulkActionConfig } from "@/types/bulk";

interface BulkActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: BulkActionConfig;
  selectedCount: number;
  onConfirm: (options: {
    reason?: string;
    sendNotifications: boolean;
  }) => Promise<BulkOperationResponse>;
  locale?: string;
}

const texts = {
  en: {
    title: "Bulk Action",
    description: "You are about to perform this action on {count} items.",
    reason: "Reason (optional)",
    reasonPlaceholder: "Enter a reason for this action...",
    sendNotifications: "Send notifications to affected members",
    cancel: "Cancel",
    confirm: "Confirm",
    processing: "Processing...",
    completed: "Operation Completed",
    success: "Successful",
    failed: "Failed",
    skipped: "Skipped",
    processingTime: "Processing time",
    close: "Close",
    warning: "This action cannot be undone.",
  },
  ar: {
    title: "إجراء جماعي",
    description: "أنت على وشك تنفيذ هذا الإجراء على {count} عناصر.",
    reason: "السبب (اختياري)",
    reasonPlaceholder: "أدخل سبب هذا الإجراء...",
    sendNotifications: "إرسال إشعارات للأعضاء المتأثرين",
    cancel: "إلغاء",
    confirm: "تأكيد",
    processing: "جاري المعالجة...",
    completed: "اكتملت العملية",
    success: "ناجحة",
    failed: "فاشلة",
    skipped: "تم تخطيها",
    processingTime: "وقت المعالجة",
    close: "إغلاق",
    warning: "لا يمكن التراجع عن هذا الإجراء.",
  },
};

type DialogState = "confirm" | "processing" | "result";

export function BulkActionDialog({
  open,
  onOpenChange,
  config,
  selectedCount,
  onConfirm,
  locale = "en",
}: BulkActionDialogProps) {
  const t = texts[locale === "ar" ? "ar" : "en"];
  const [state, setState] = useState<DialogState>("confirm");
  const [reason, setReason] = useState("");
  const [sendNotifications, setSendNotifications] = useState(true);
  const [result, setResult] = useState<BulkOperationResponse | null>(null);

  const handleConfirm = async () => {
    setState("processing");
    try {
      const response = await onConfirm({
        reason: reason || undefined,
        sendNotifications,
      });
      setResult(response);
      setState("result");
    } catch {
      setState("confirm");
    }
  };

  const handleClose = () => {
    setState("confirm");
    setReason("");
    setSendNotifications(true);
    setResult(null);
    onOpenChange(false);
  };

  const actionLabel = locale === "ar" ? config.labelAr : config.labelEn;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {state === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {actionLabel}
              </DialogTitle>
              <DialogDescription>
                {t.description.replace("{count}", String(selectedCount))}
                {config.variant === "destructive" && (
                  <span className="block mt-2 text-destructive font-medium">
                    {t.warning}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {config.requiresReason && (
                <div className="space-y-2">
                  <Label>{t.reason}</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t.reasonPlaceholder}
                    rows={3}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id="notifications"
                  checked={sendNotifications}
                  onCheckedChange={(checked) =>
                    setSendNotifications(checked === true)
                  }
                />
                <Label htmlFor="notifications" className="cursor-pointer">
                  {t.sendNotifications}
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t.cancel}
              </Button>
              <Button
                variant={
                  config.variant === "destructive" ? "destructive" : "default"
                }
                onClick={handleConfirm}
              >
                {t.confirm}
              </Button>
            </DialogFooter>
          </>
        )}

        {state === "processing" && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-lg font-medium">{t.processing}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {actionLabel} - {selectedCount} items
            </p>
          </div>
        )}

        {state === "result" && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {t.completed}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-600">
                    {result.summary.successCount}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.success}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <p className="text-2xl font-bold text-red-600">
                    {result.summary.failedCount}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.failed}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {result.summary.skippedCount}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.skipped}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <Progress
                  value={
                    (result.summary.successCount /
                      result.summary.totalRequested) *
                    100
                  }
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t.processingTime}: {result.summary.processingTimeMs}ms
                </p>
              </div>

              {/* Failed items (if any) */}
              {result.summary.failedCount > 0 && (
                <div className="max-h-32 overflow-y-auto border rounded-lg p-2">
                  {result.results
                    .filter((r) => r.status === "FAILED")
                    .map((r) => (
                      <div
                        key={r.itemId}
                        className="flex items-start gap-2 text-sm py-1"
                      >
                        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          {locale === "ar" ? r.messageAr : r.message}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>{t.close}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
