"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { RefreshCcw, Loader2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useRenewSubscription } from "@liyaqa/shared/queries/use-subscriptions";
import type { UUID } from "@liyaqa/shared/types/api";

interface RenewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: UUID;
  onSuccess?: () => void;
}

export function RenewDialog({
  open,
  onOpenChange,
  subscriptionId,
  onSuccess,
}: RenewDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const renewMutation = useRenewSubscription();

  const [newEndDate, setNewEndDate] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const texts = {
    title: locale === "ar" ? "تجديد العضوية" : "Renew Membership",
    description: locale === "ar"
      ? "تجديد هذه العضوية لفترة جديدة"
      : "Renew this membership for a new period",
    newEndDate: locale === "ar" ? "تاريخ الانتهاء الجديد" : "New End Date",
    newEndDateHint: locale === "ar" ? "اختياري — سيحسب تلقائياً إذا ترك فارغاً" : "Optional — auto-calculated if left blank",
    paidAmount: locale === "ar" ? "المبلغ المدفوع" : "Paid Amount",
    paidAmountHint: locale === "ar" ? "اختياري — بالريال السعودي" : "Optional — in SAR",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    confirm: locale === "ar" ? "تجديد" : "Renew",
    confirming: locale === "ar" ? "جاري التجديد..." : "Renewing...",
    successTitle: locale === "ar" ? "تم التجديد" : "Membership Renewed",
    successDesc: locale === "ar" ? "تم تجديد العضوية بنجاح" : "The membership has been renewed successfully",
    errorTitle: locale === "ar" ? "خطأ في التجديد" : "Renewal Error",
  };

  const handleSubmit = async () => {
    try {
      const data = {
        newEndDate: newEndDate || undefined,
        paidAmount: paidAmount ? Number(paidAmount) : undefined,
        paidCurrency: paidAmount ? "SAR" : undefined,
      };

      await renewMutation.mutateAsync({ id: subscriptionId, data });

      toast({ title: texts.successTitle, description: texts.successDesc });
      setNewEndDate("");
      setPaidAmount("");
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-primary" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* New End Date */}
          <div className="space-y-2">
            <Label htmlFor="newEndDate">{texts.newEndDate}</Label>
            <Input
              id="newEndDate"
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{texts.newEndDateHint}</p>
          </div>

          {/* Paid Amount */}
          <div className="space-y-2">
            <Label htmlFor="paidAmount">{texts.paidAmount}</Label>
            <Input
              id="paidAmount"
              type="number"
              min={0}
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">{texts.paidAmountHint}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={renewMutation.isPending}
          >
            {texts.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={renewMutation.isPending}>
            {renewMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {texts.confirming}
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4 me-2" />
                {texts.confirm}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
