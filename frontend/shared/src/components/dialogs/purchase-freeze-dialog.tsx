"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ShoppingCart, Loader2, Check, Package } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { useToast } from "../hooks/use-toast";
import {
  useActiveFreezePackages,
  usePurchaseFreezeDays,
  useSubscriptionFreezeBalance,
} from "../queries/use-freeze-packages";
import type { UUID } from "../../types/api";
import type { FreezePackage } from "../../types/freeze";

interface PurchaseFreezeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: UUID;
  memberId: UUID;
  onSuccess?: () => void;
}

export function PurchaseFreezeDialog({
  open,
  onOpenChange,
  subscriptionId,
  memberId,
  onSuccess,
}: PurchaseFreezeDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<FreezePackage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: packages = [], isLoading: packagesLoading } = useActiveFreezePackages();
  const { data: balance } = useSubscriptionFreezeBalance(subscriptionId);
  const purchaseFreezeDays = usePurchaseFreezeDays();

  const texts = {
    title: locale === "ar" ? "شراء أيام تجميد" : "Purchase Freeze Days",
    description:
      locale === "ar"
        ? "اختر حزمة تجميد لإضافة أيام إلى رصيد التجميد"
        : "Select a freeze package to add days to the freeze balance",
    currentBalance: locale === "ar" ? "الرصيد الحالي" : "Current Balance",
    days: locale === "ar" ? "يوم" : "days",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    purchase: locale === "ar" ? "شراء" : "Purchase",
    purchasing: locale === "ar" ? "جاري الشراء..." : "Purchasing...",
    successTitle: locale === "ar" ? "تم الشراء بنجاح" : "Purchase Successful",
    successDescription:
      locale === "ar"
        ? "تم إضافة أيام التجميد إلى الرصيد"
        : "Freeze days have been added to the balance",
    errorTitle: locale === "ar" ? "خطأ في الشراء" : "Purchase Error",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading packages...",
    noPackages:
      locale === "ar"
        ? "لا توجد حزم تجميد متاحة"
        : "No freeze packages available",
    extendsContract:
      locale === "ar" ? "يمدد العقد" : "Extends contract",
    requiresDoc:
      locale === "ar" ? "يتطلب مستندات" : "Requires documentation",
    selectPackage:
      locale === "ar" ? "اختر حزمة للمتابعة" : "Select a package to continue",
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsSubmitting(true);
    try {
      await purchaseFreezeDays.mutateAsync({
        subscriptionId,
        memberId,
        data: {
          freezePackageId: selectedPackage.id,
        },
      });

      toast({
        title: texts.successTitle,
        description: texts.successDescription,
      });

      setSelectedPackage(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const PackageCard = ({ pkg }: { pkg: FreezePackage }) => {
    const isSelected = selectedPackage?.id === pkg.id;
    const name = locale === "ar" ? pkg.name.ar || pkg.name.en : pkg.name.en;
    const description = pkg.description
      ? locale === "ar"
        ? pkg.description.ar || pkg.description.en
        : pkg.description.en
      : null;

    return (
      <div
        onClick={() => setSelectedPackage(pkg)}
        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
          isSelected
            ? "border-primary bg-primary/5"
            : "border-muted hover:border-primary/50"
        }`}
      >
        {isSelected && (
          <div className="absolute top-2 right-2">
            <Check className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">{name}</h3>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{pkg.freezeDays}</span>
            <span className="text-sm text-muted-foreground">{texts.days}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-primary">
              {pkg.price.amount}
            </span>
            <span className="text-sm text-muted-foreground">
              {pkg.price.currency}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {pkg.extendsContract && (
              <Badge variant="secondary">{texts.extendsContract}</Badge>
            )}
            {pkg.requiresDocumentation && (
              <Badge variant="outline">{texts.requiresDoc}</Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Balance */}
          {balance && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {texts.currentBalance}:
                </span>
                <span className="font-semibold">
                  {balance.availableDays} {texts.days}
                </span>
              </div>
            </div>
          )}

          {/* Package List */}
          {packagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{texts.loading}</span>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {texts.noPackages}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {texts.cancel}
          </Button>
          <Button
            type="button"
            onClick={handlePurchase}
            disabled={!selectedPackage || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {texts.purchasing}
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {texts.purchase}
                {selectedPackage && ` (${selectedPackage.price.amount} ${selectedPackage.price.currency})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
