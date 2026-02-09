import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateClientPlan, useActivateClientPlan } from "@/hooks/use-client-plans";
import { useToast } from "@/stores/toast-store";
import type { ClientPlanSummary } from "@/types";

// Simplified schema for quick plan creation
const quickPlanSchema = z.object({
  nameEn: z.string().min(1, "Plan name is required"),
  nameAr: z.string().optional(),
  monthlyPriceAmount: z.coerce.number().min(0, "Price must be 0 or greater"),
  monthlyPriceCurrency: z.string().default("SAR"),
  annualPriceAmount: z.coerce.number().min(0, "Price must be 0 or greater").optional(),
  annualPriceCurrency: z.string().default("SAR"),
});

type QuickPlanFormValues = z.infer<typeof quickPlanSchema>;

interface QuickCreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanCreated: (plan: ClientPlanSummary) => void;
}

export function QuickCreatePlanDialog({
  open,
  onOpenChange,
  onPlanCreated,
}: QuickCreatePlanDialogProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const toast = useToast();
  const createPlan = useCreateClientPlan();
  const activatePlan = useActivateClientPlan();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<QuickPlanFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(quickPlanSchema) as any,
    defaultValues: {
      nameEn: "",
      nameAr: "",
      monthlyPriceAmount: 0,
      monthlyPriceCurrency: "SAR",
      annualPriceAmount: 0,
      annualPriceCurrency: "SAR",
    },
  });

  const watchMonthlyCurrency = watch("monthlyPriceCurrency");
  const watchMonthlyPrice = watch("monthlyPriceAmount");
  const watchAnnualPrice = watch("annualPriceAmount");

  // Calculate annual savings
  const annualSavings =
    watchMonthlyPrice && watchAnnualPrice
      ? watchMonthlyPrice * 12 - watchAnnualPrice
      : 0;

  const texts = {
    dialogTitle: locale === "ar" ? "إنشاء خطة سريعة" : "Quick Create Plan",
    dialogDesc:
      locale === "ar"
        ? "إنشاء خطة أساسية بالتفاصيل الأساسية"
        : "Create a basic plan with essential details",
    planNameEn: locale === "ar" ? "اسم الخطة (إنجليزي)" : "Plan Name (English)",
    planNameAr: locale === "ar" ? "اسم الخطة (عربي)" : "Plan Name (Arabic)",
    monthlyPrice: locale === "ar" ? "السعر الشهري" : "Monthly Price",
    annualPrice: locale === "ar" ? "السعر السنوي (اختياري)" : "Annual Price (Optional)",
    currency: locale === "ar" ? "العملة" : "Currency",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    createPlan: locale === "ar" ? "إنشاء الخطة" : "Create Plan",
    creating: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
    successDesc:
      locale === "ar"
        ? "تم إنشاء الخطة واختيارها"
        : "Plan has been created and selected",
    errorDesc:
      locale === "ar"
        ? "حدث خطأ أثناء إنشاء الخطة"
        : "An error occurred while creating the plan",
    annualSavings: locale === "ar" ? "التوفير السنوي" : "Annual Savings",
  };

  const onSubmit = async (data: QuickPlanFormValues) => {
    try {
      // Create the plan with sensible defaults
      const createdPlan = await createPlan.mutateAsync({
        nameEn: data.nameEn,
        nameAr: data.nameAr || undefined,
        monthlyPriceAmount: data.monthlyPriceAmount,
        monthlyPriceCurrency: data.monthlyPriceCurrency,
        annualPriceAmount: data.annualPriceAmount || data.monthlyPriceAmount * 10, // Default: 10 months worth
        annualPriceCurrency: data.annualPriceCurrency || data.monthlyPriceCurrency,
        // Sensible defaults for other fields
        maxClubs: 1,
        maxLocationsPerClub: 3,
        maxMembers: 100,
        maxStaffUsers: 5,
        hasAdvancedReporting: false,
        hasApiAccess: false,
        hasPrioritySupport: false,
        hasWhiteLabeling: false,
        hasCustomIntegrations: false,
        sortOrder: 0,
      });

      // Auto-activate the plan
      const activatedPlan = await activatePlan.mutateAsync(createdPlan.id);

      // Create summary for callback
      const planSummary: ClientPlanSummary = {
        id: activatedPlan.id,
        name: activatedPlan.name,
        monthlyPrice: activatedPlan.monthlyPrice,
        annualPrice: activatedPlan.annualPrice,
        isActive: true,
      };

      toast.success(texts.successDesc);

      // Reset form and close dialog
      reset();
      onOpenChange(false);

      // Notify parent with created plan
      onPlanCreated(planSummary);
    } catch {
      toast.error(texts.errorDesc);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const isLoading = createPlan.isPending || activatePlan.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{texts.dialogTitle}</DialogTitle>
          <DialogDescription>{texts.dialogDesc}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Plan Name EN */}
          <div className="space-y-2">
            <Label htmlFor="nameEn">
              {texts.planNameEn} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nameEn"
              {...register("nameEn")}
              placeholder={locale === "ar" ? "مثال: خطة أساسية" : "e.g., Basic Plan"}
            />
            {errors.nameEn && (
              <p className="text-sm text-destructive">{errors.nameEn.message}</p>
            )}
          </div>

          {/* Plan Name AR */}
          <div className="space-y-2">
            <Label htmlFor="nameAr">{texts.planNameAr}</Label>
            <Input
              id="nameAr"
              {...register("nameAr")}
              dir="rtl"
              placeholder={locale === "ar" ? "مثال: الخطة الأساسية" : "e.g., الخطة الأساسية"}
            />
          </div>

          {/* Monthly Price */}
          <div className="space-y-2">
            <Label>
              {texts.monthlyPrice} <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register("monthlyPriceAmount")}
                className="flex-1"
                placeholder="0.00"
              />
              <Select
                value={watchMonthlyCurrency}
                onValueChange={(v) => {
                  setValue("monthlyPriceCurrency", v);
                  // Sync annual currency by default
                  setValue("annualPriceCurrency", v);
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.monthlyPriceAmount && (
              <p className="text-sm text-destructive">
                {errors.monthlyPriceAmount.message}
              </p>
            )}
          </div>

          {/* Annual Price */}
          <div className="space-y-2">
            <Label>{texts.annualPrice}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register("annualPriceAmount")}
                className="flex-1"
                placeholder="0.00"
              />
              <Select
                value={watch("annualPriceCurrency")}
                onValueChange={(v) => setValue("annualPriceCurrency", v)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Annual Savings Display */}
            {annualSavings > 0 && (
              <p className="text-sm text-green-600">
                {texts.annualSavings}: {annualSavings.toFixed(2)} {watchMonthlyCurrency}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {texts.cancel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? texts.creating : texts.createPlan}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
