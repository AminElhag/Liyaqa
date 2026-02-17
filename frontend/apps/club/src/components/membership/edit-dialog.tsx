"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Edit, Loader2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useUpdateSubscription } from "@liyaqa/shared/queries/use-subscriptions";
import type { UUID } from "@liyaqa/shared/types/api";
import type { Subscription } from "@liyaqa/shared/types/member";

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription;
  onSuccess?: () => void;
}

export function EditDialog({
  open,
  onOpenChange,
  subscription,
  onSuccess,
}: EditDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const updateMutation = useUpdateSubscription();

  const [autoRenew, setAutoRenew] = useState(subscription.autoRenew);
  const [notes, setNotes] = useState(subscription.notes ?? "");

  const texts = {
    title: locale === "ar" ? "تعديل العضوية" : "Edit Membership",
    description: locale === "ar"
      ? "تعديل إعدادات هذه العضوية"
      : "Modify settings for this membership",
    autoRenew: locale === "ar" ? "تجديد تلقائي" : "Auto-Renew",
    autoRenewDesc: locale === "ar"
      ? "تجديد الاشتراك تلقائياً عند انتهاء الفترة"
      : "Automatically renew the subscription when the period ends",
    notes: locale === "ar" ? "ملاحظات" : "Notes",
    notesPlaceholder: locale === "ar" ? "ملاحظات إضافية..." : "Additional notes...",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    save: locale === "ar" ? "حفظ التغييرات" : "Save Changes",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    successTitle: locale === "ar" ? "تم التحديث" : "Membership Updated",
    successDesc: locale === "ar" ? "تم تحديث العضوية بنجاح" : "The membership has been updated successfully",
    errorTitle: locale === "ar" ? "خطأ في التحديث" : "Update Error",
  };

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync({
        id: subscription.id,
        data: {
          autoRenew,
          notes: notes || undefined,
        },
      });

      toast({ title: texts.successTitle, description: texts.successDesc });
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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto-Renew Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-renew" className="font-medium">
                {texts.autoRenew}
              </Label>
              <p className="text-sm text-muted-foreground">{texts.autoRenewDesc}</p>
            </div>
            <Switch
              id="auto-renew"
              checked={autoRenew}
              onCheckedChange={setAutoRenew}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{texts.notes}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={texts.notesPlaceholder}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            {texts.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {texts.saving}
              </>
            ) : (
              texts.save
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
