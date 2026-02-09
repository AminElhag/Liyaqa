import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRightLeft } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useChangeSubscriptionPlan,
} from "@/hooks/use-client-subscriptions";
import { useClientPlans } from "@/hooks/use-client-plans";
import { useToast } from "@/stores/toast-store";
import type { ClientSubscription } from "@/types";

interface ChangePlanDialogProps {
  subscription: ClientSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePlanDialog({
  subscription,
  open,
  onOpenChange,
}: ChangePlanDialogProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const toast = useToast();
  const changePlan = useChangeSubscriptionPlan();

  // Fetch available plans
  const { data: plansData } = useClientPlans({ size: 100 });
  const plans = plansData?.content || [];

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [newPrice, setNewPrice] = useState("");
  const [contractMonths, setContractMonths] = useState("12");

  const texts = {
    title: locale === "ar" ? "تغيير الخطة" : "Change Plan",
    description:
      locale === "ar"
        ? "تغيير خطة هذا الاشتراك"
        : "Change the plan for this subscription",
    currentPlan: locale === "ar" ? "الخطة الحالية" : "Current Plan",
    newPlan: locale === "ar" ? "الخطة الجديدة" : "New Plan",
    selectPlan: locale === "ar" ? "اختر الخطة" : "Select a plan",
    newPrice: locale === "ar" ? "السعر الجديد" : "New Price",
    contractMonths: locale === "ar" ? "مدة العقد (أشهر)" : "Contract Duration (Months)",
    currency: locale === "ar" ? "ريال" : "SAR",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    change: locale === "ar" ? "تغيير" : "Change Plan",
    changing: locale === "ar" ? "جاري التغيير..." : "Changing...",
    successDesc:
      locale === "ar"
        ? "تم تغيير الخطة بنجاح"
        : "Plan changed successfully",
    noPlan: locale === "ar" ? "غير محدد" : "Not specified",
    perMonth: locale === "ar" ? "/شهر" : "/month",
  };

  // Handle plan selection and auto-update price
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setNewPrice(plan.monthlyPrice.amount.toString());
    }
  };

  const handleChangePlan = () => {
    if (!subscription || !selectedPlanId || !newPrice) return;

    changePlan.mutate(
      {
        id: subscription.id,
        data: {
          newPlanId: selectedPlanId,
          newAgreedPriceAmount: parseFloat(newPrice),
          newAgreedPriceCurrency: "SAR",
          newContractMonths: parseInt(contractMonths),
        },
      },
      {
        onSuccess: () => {
          toast.success(texts.successDesc);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  // Reset state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedPlanId("");
      setNewPrice("");
      setContractMonths("12");
    }
    onOpenChange(isOpen);
  };

  // Get current plan name
  const currentPlan = plans.find((p) => p.id === subscription?.clientPlanId);
  const currentPlanName = currentPlan
    ? locale === "ar"
      ? currentPlan.name.ar || currentPlan.name.en
      : currentPlan.name.en
    : texts.noPlan;

  // Get selected plan for price display
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Plan (read-only) */}
          <div className="space-y-2">
            <Label>{texts.currentPlan}</Label>
            <Input value={currentPlanName} disabled className="bg-muted" />
          </div>

          {/* New Plan Selector */}
          <div className="space-y-2">
            <Label htmlFor="newPlan">
              {texts.newPlan} <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedPlanId} onValueChange={handlePlanChange}>
              <SelectTrigger id="newPlan">
                <SelectValue placeholder={texts.selectPlan} />
              </SelectTrigger>
              <SelectContent>
                {plans
                  .filter((p) => p.id !== subscription?.clientPlanId && p.isActive)
                  .map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {locale === "ar"
                        ? plan.name.ar || plan.name.en
                        : plan.name.en}{" "}
                      ({plan.monthlyPrice.amount} {texts.currency}
                      {texts.perMonth})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Price */}
          <div className="space-y-2">
            <Label htmlFor="newPrice">
              {texts.newPrice} <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="newPrice"
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder={selectedPlan?.monthlyPrice.amount?.toString() || ""}
              />
              <span className="text-sm text-muted-foreground">
                {texts.currency}
              </span>
            </div>
          </div>

          {/* Contract Duration */}
          <div className="space-y-2">
            <Label htmlFor="contractMonths">{texts.contractMonths}</Label>
            <Select value={contractMonths} onValueChange={setContractMonths}>
              <SelectTrigger id="contractMonths">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {texts.cancel}
          </Button>
          <Button
            onClick={handleChangePlan}
            disabled={
              changePlan.isPending || !selectedPlanId || !newPrice
            }
          >
            {changePlan.isPending ? texts.changing : texts.change}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
