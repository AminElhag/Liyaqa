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
} from "@liyaqa/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Spinner } from "@liyaqa/shared/components/ui/spinner";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { ArrowUp, ArrowDown, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import {
  useAvailablePlans,
  usePlanChangePreview,
  useUpgradePlan,
  useDowngradePlan,
} from "@liyaqa/shared/queries/use-member-subscription";
import { UUID } from "@liyaqa/shared/types/api";
import { MembershipPlan } from "@liyaqa/shared/types/member";

interface PlanChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId: UUID;
}

export function PlanChangeDialog({
  open,
  onOpenChange,
  currentPlanId,
}: PlanChangeDialogProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [selectedPlanId, setSelectedPlanId] = useState<UUID | null>(null);
  const [step, setStep] = useState<"select" | "preview" | "confirm">("select");

  // Queries
  const { data: plans, isLoading: plansLoading } = useAvailablePlans();
  const { data: preview, isLoading: previewLoading } =
    usePlanChangePreview(selectedPlanId);

  // Mutations
  const upgradeMutation = useUpgradePlan();
  const downgradeMutation = useDowngradePlan();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedPlanId(null);
      setStep("select");
    }
  }, [open]);

  // Filter out current plan
  const availablePlans =
    plans?.filter((plan) => plan.id !== currentPlanId && plan.isActive) || [];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId as UUID);
    setStep("preview");
  };

  const handleConfirm = async () => {
    if (!selectedPlanId || !preview) return;

    try {
      if (preview.changeType === "UPGRADE") {
        await upgradeMutation.mutateAsync({ newPlanId: selectedPlanId });
      } else {
        await downgradeMutation.mutateAsync({ newPlanId: selectedPlanId });
      }

      toast.success(
        isArabic
          ? preview.changeType === "UPGRADE"
            ? "تم ترقية باقتك بنجاح"
            : "تم جدولة تغيير الباقة"
          : preview.changeType === "UPGRADE"
          ? "Your plan has been upgraded"
          : "Your plan change has been scheduled"
      );

      onOpenChange(false);
    } catch (error) {
      toast.error(
        isArabic ? "حدث خطأ أثناء تغيير الباقة" : "Failed to change plan"
      );
    }
  };

  const isLoading =
    upgradeMutation.isPending ||
    downgradeMutation.isPending ||
    previewLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isArabic ? "تغيير الباقة" : "Change Plan"}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? isArabic
                ? "اختر الباقة الجديدة"
                : "Select your new plan"
              : isArabic
              ? "راجع تفاصيل التغيير"
              : "Review the change details"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            {plansLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : availablePlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isArabic
                  ? "لا توجد باقات متاحة للتغيير"
                  : "No plans available to switch to"}
              </div>
            ) : (
              <div className="space-y-3">
                {availablePlans.map((plan) => (
                  <PlanOption
                    key={plan.id}
                    plan={plan}
                    isArabic={isArabic}
                    onSelect={() => handlePlanSelect(plan.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            {previewLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : preview ? (
              <>
                {/* Change Type Badge */}
                <div className="flex justify-center">
                  <Badge
                    variant={
                      preview.changeType === "UPGRADE" ? "default" : "secondary"
                    }
                    className="text-sm py-1 px-3"
                  >
                    {preview.changeType === "UPGRADE" ? (
                      <>
                        <ArrowUp className="h-4 w-4 mr-1" />
                        {isArabic ? "ترقية" : "Upgrade"}
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-4 w-4 mr-1" />
                        {isArabic ? "تخفيض" : "Downgrade"}
                      </>
                    )}
                  </Badge>
                </div>

                {/* Plan Names */}
                <div className="flex items-center justify-center gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "من" : "From"}
                    </p>
                    <p className="font-medium">{preview.currentPlanName}</p>
                  </div>
                  <div className="text-muted-foreground">→</div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "إلى" : "To"}
                    </p>
                    <p className="font-medium">{preview.newPlanName}</p>
                  </div>
                </div>

                <Separator />

                {/* Proration Details */}
                {preview.prorationMode === "PRORATE_IMMEDIATELY" && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {isArabic ? "رصيد الباقة الحالية" : "Current plan credit"}
                      </span>
                      <span className="text-green-600">
                        -{preview.credit} {preview.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {isArabic ? "رسوم الباقة الجديدة" : "New plan charge"}
                      </span>
                      <span>
                        +{preview.charge} {preview.currency}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>{isArabic ? "الإجمالي" : "Total"}</span>
                      <span
                        className={
                          preview.netAmount > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {preview.netAmount > 0 ? "+" : ""}
                        {preview.netAmount} {preview.currency}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {preview.summary}
                    </p>
                  </div>
                )}

                {preview.prorationMode === "END_OF_PERIOD" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">
                        {isArabic
                          ? "تغيير مجدول"
                          : "Scheduled Change"}
                      </p>
                      <p className="text-sm text-blue-600">
                        {isArabic
                          ? `سيتم تطبيق التغيير في ${new Date(
                              preview.effectiveDate
                            ).toLocaleDateString("ar-SA")}`
                          : `Will take effect on ${new Date(
                              preview.effectiveDate
                            ).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Warning for downgrades */}
                {preview.changeType === "DOWNGRADE" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-700">
                        {isArabic
                          ? "ستحتفظ بمزايا باقتك الحالية حتى نهاية الفترة"
                          : "You'll keep your current benefits until the end of your billing period"}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {step === "preview" && (
            <Button
              variant="outline"
              onClick={() => {
                setStep("select");
                setSelectedPlanId(null);
              }}
              disabled={isLoading}
            >
              {isArabic ? "رجوع" : "Back"}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          {step === "preview" && (
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading && <Spinner className="h-4 w-4 mr-2" />}
              {preview?.changeType === "UPGRADE"
                ? isArabic
                  ? "ترقية الآن"
                  : "Upgrade Now"
                : isArabic
                ? "جدولة التغيير"
                : "Schedule Change"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanOption({
  plan,
  isArabic,
  onSelect,
}: {
  plan: MembershipPlan;
  isArabic: boolean;
  onSelect: () => void;
}) {
  const planName = isArabic
    ? plan.name.ar || plan.name.en
    : plan.name.en;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors"
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">{planName}</p>
          {plan.description && (
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? plan.description.ar || plan.description.en
                : plan.description.en}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-bold">
            {plan.price.amount} {plan.price.currency}
          </p>
          <p className="text-xs text-muted-foreground">
            /{isArabic ? "شهر" : "month"}
          </p>
        </div>
      </div>
    </button>
  );
}
