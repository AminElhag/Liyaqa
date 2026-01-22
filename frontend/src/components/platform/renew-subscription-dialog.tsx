"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRenewSubscription } from "@/queries/platform/use-client-subscriptions";
import { useToast } from "@/hooks/use-toast";
import type { ClientSubscription } from "@/types/platform/client-subscription";

interface RenewSubscriptionDialogProps {
  subscription: ClientSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenewSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
}: RenewSubscriptionDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const renewSubscription = useRenewSubscription();

  // Calculate default new end date (1 year from current end date or today)
  const getDefaultEndDate = () => {
    const startDate = subscription?.endDate
      ? new Date(subscription.endDate)
      : new Date();
    const newDate = new Date(startDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    return newDate.toISOString().split("T")[0];
  };

  const [newEndDate, setNewEndDate] = useState(getDefaultEndDate());
  const [newPrice, setNewPrice] = useState(
    subscription?.agreedPrice.amount?.toString() || ""
  );

  const texts = {
    title: locale === "ar" ? "تجديد الاشتراك" : "Renew Subscription",
    description:
      locale === "ar"
        ? "تجديد هذا الاشتراك بتاريخ انتهاء جديد"
        : "Renew this subscription with a new end date",
    newEndDate: locale === "ar" ? "تاريخ الانتهاء الجديد" : "New End Date",
    newPrice:
      locale === "ar"
        ? "السعر الجديد (اختياري)"
        : "New Price (Optional)",
    currency: locale === "ar" ? "ريال" : "SAR",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    renew: locale === "ar" ? "تجديد" : "Renew",
    renewing: locale === "ar" ? "جاري التجديد..." : "Renewing...",
    successTitle: locale === "ar" ? "تم التجديد" : "Renewed",
    successDesc:
      locale === "ar"
        ? "تم تجديد الاشتراك بنجاح"
        : "Subscription renewed successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    currentEndDate:
      locale === "ar" ? "تاريخ الانتهاء الحالي" : "Current End Date",
  };

  const handleRenew = () => {
    if (!subscription || !newEndDate) return;

    renewSubscription.mutate(
      {
        id: subscription.id,
        data: {
          newEndDate,
          newAgreedPriceAmount: newPrice ? parseFloat(newPrice) : undefined,
          newAgreedPriceCurrency: newPrice ? "SAR" : undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.successDesc,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  // Reset state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setNewEndDate(getDefaultEndDate());
      setNewPrice(subscription?.agreedPrice.amount?.toString() || "");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current End Date (read-only) */}
          <div className="space-y-2">
            <Label>{texts.currentEndDate}</Label>
            <Input
              value={subscription?.endDate || ""}
              disabled
              className="bg-muted"
            />
          </div>

          {/* New End Date */}
          <div className="space-y-2">
            <Label htmlFor="newEndDate">
              {texts.newEndDate} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newEndDate"
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* New Price (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="newPrice">{texts.newPrice}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="newPrice"
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder={subscription?.agreedPrice.amount?.toString() || ""}
              />
              <span className="text-sm text-muted-foreground">
                {texts.currency}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {texts.cancel}
          </Button>
          <Button
            onClick={handleRenew}
            disabled={renewSubscription.isPending || !newEndDate}
          >
            {renewSubscription.isPending ? texts.renewing : texts.renew}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
