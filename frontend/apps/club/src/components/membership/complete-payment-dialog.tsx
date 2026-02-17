"use client";

import { useLocale } from "next-intl";
import { CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useCreateInvoiceFromSubscription } from "@liyaqa/shared/queries";
import type { UUID } from "@liyaqa/shared/types/api";
import type { Subscription } from "@liyaqa/shared/types/member";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { formatDate } from "@liyaqa/shared/utils";

interface CompletePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription;
  onSuccess?: () => void;
}

export function CompletePaymentDialog({
  open,
  onOpenChange,
  subscription,
  onSuccess,
}: CompletePaymentDialogProps) {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createInvoice = useCreateInvoiceFromSubscription();

  const texts = {
    title: locale === "ar" ? "إكمال الدفع" : "Complete Payment",
    description: locale === "ar"
      ? "إنشاء فاتورة لهذا الاشتراك لإكمال عملية الدفع"
      : "Create an invoice for this subscription to complete the payment",
    plan: locale === "ar" ? "الخطة" : "Plan",
    period: locale === "ar" ? "الفترة" : "Period",
    amount: locale === "ar" ? "المبلغ" : "Amount",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    confirm: locale === "ar" ? "إنشاء فاتورة" : "Create Invoice",
    confirming: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
    successTitle: locale === "ar" ? "تم إنشاء الفاتورة" : "Invoice Created",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };

  const handleSubmit = async () => {
    try {
      const invoice = await createInvoice.mutateAsync(subscription.id);

      toast({
        title: texts.successTitle,
        description: locale === "ar"
          ? `تم إنشاء الفاتورة رقم ${invoice.invoiceNumber}`
          : `Invoice ${invoice.invoiceNumber} created successfully`,
      });

      onOpenChange(false);
      onSuccess?.();
      router.push(`/${locale}/invoices/${invoice.id}`);
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{texts.plan}</span>
            <span className="font-medium">
              {subscription.planName ? (
                <LocalizedText text={subscription.planName} />
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{texts.period}</span>
            <span className="font-medium">
              {formatDate(subscription.startDate, locale)} — {formatDate(subscription.endDate, locale)}
            </span>
          </div>
          {subscription.paidAmount && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{texts.amount}</span>
              <span className="font-semibold text-primary">
                {subscription.paidAmount.amount} {subscription.paidAmount.currency}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createInvoice.isPending}
          >
            {texts.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={createInvoice.isPending}>
            {createInvoice.isPending ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {texts.confirming}
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 me-2" />
                {texts.confirm}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
