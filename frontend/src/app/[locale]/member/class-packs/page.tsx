"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Package, Clock, ShoppingCart, Check, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LocalizedText } from "@/components/ui/localized-text";
import { Loading } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMyClassPackBalances, useActiveClassPacks } from "@/queries";
import type { ClassPack, MemberClassPackBalance, ClassPackBalanceStatus } from "@/types/scheduling";
import { cn } from "@/lib/utils";

const texts = {
  en: {
    title: "My Class Packs",
    subtitle: "View your class credits and purchase more",
    activePacks: "Active Packs",
    noPacks: "No active class packs",
    noPacksDesc: "Purchase a class pack to book premium classes",
    pastPacks: "Past Packs",
    buyMore: "Buy More",
    classesRemaining: "classes remaining",
    classesUsed: "used",
    expires: "Expires",
    expired: "Expired",
    noExpiry: "No expiry",
    purchasePack: "Purchase Class Pack",
    packDetails: "Pack Details",
    classes: "classes",
    validFor: "Valid for",
    days: "days",
    buy: "Buy Now",
    buying: "Processing...",
    purchaseSuccess: "Class pack purchased successfully!",
    purchaseError: "Failed to purchase pack",
    cancel: "Cancel",
    active: "Active",
    depleted: "Depleted",
    cancelled: "Cancelled",
    price: "Price",
    inclTax: "incl. tax",
  },
  ar: {
    title: "باقات الحصص",
    subtitle: "عرض رصيدك وشراء المزيد",
    activePacks: "الباقات النشطة",
    noPacks: "لا توجد باقات نشطة",
    noPacksDesc: "اشترِ باقة حصص لحجز الحصص المميزة",
    pastPacks: "الباقات السابقة",
    buyMore: "اشترِ المزيد",
    classesRemaining: "حصص متبقية",
    classesUsed: "مستخدمة",
    expires: "تنتهي",
    expired: "منتهية",
    noExpiry: "بدون انتهاء",
    purchasePack: "شراء باقة حصص",
    packDetails: "تفاصيل الباقة",
    classes: "حصص",
    validFor: "صالحة لمدة",
    days: "يوم",
    buy: "اشترِ الآن",
    buying: "جاري المعالجة...",
    purchaseSuccess: "تم شراء الباقة بنجاح!",
    purchaseError: "فشل في شراء الباقة",
    cancel: "إلغاء",
    active: "نشط",
    depleted: "مستنفذ",
    cancelled: "ملغي",
    price: "السعر",
    inclTax: "شامل الضريبة",
  },
};

function getStatusBadgeVariant(status: ClassPackBalanceStatus): "success" | "secondary" | "destructive" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "DEPLETED":
      return "secondary";
    case "EXPIRED":
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
}

interface ActivePackCardProps {
  balance: MemberClassPackBalance;
  locale: string;
}

function ActivePackCard({ balance, locale }: ActivePackCardProps) {
  const t = texts[locale as "en" | "ar"] || texts.en;
  const dateLocale = locale === "ar" ? ar : enUS;
  const progress = ((balance.classesPurchased - balance.classesRemaining) / balance.classesPurchased) * 100;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">
                <LocalizedText text={balance.packName} />
              </h3>
              <p className="text-sm text-muted-foreground">
                {balance.classesRemaining}/{balance.classesPurchased} {t.classesRemaining}
              </p>
            </div>
            <Badge variant={getStatusBadgeVariant(balance.status)}>
              {t[balance.status.toLowerCase() as keyof typeof t] || balance.status}
            </Badge>
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-2" />

          {/* Expiry */}
          {balance.expiresAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {t.expires}: {format(parseISO(balance.expiresAt), "MMM d, yyyy", { locale: dateLocale })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PurchasePackCardProps {
  pack: ClassPack;
  locale: string;
  onPurchase: () => void;
}

function PurchasePackCard({ pack, locale, onPurchase }: PurchasePackCardProps) {
  const t = texts[locale as "en" | "ar"] || texts.en;

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Pack info */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">
              <LocalizedText text={pack.name} />
            </h3>
            <Badge variant="secondary" className="mt-2">
              {pack.classCount} {t.classes}
            </Badge>
          </div>

          {/* Validity */}
          {pack.validityDays && (
            <p className="text-sm text-muted-foreground text-center">
              {t.validFor} {pack.validityDays} {t.days}
            </p>
          )}

          {/* Price */}
          <div className="text-center pt-2 border-t">
            <p className="text-2xl font-bold">
              {formatPrice(pack.priceWithTax.amount, pack.priceWithTax.currency)}
            </p>
            <p className="text-xs text-muted-foreground">{t.inclTax}</p>
          </div>

          {/* Buy button */}
          <Button className="w-full" onClick={onPurchase}>
            <ShoppingCart className="h-4 w-4 me-2" />
            {t.buy}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MemberClassPacksPage() {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const { toast } = useToast();

  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<ClassPack | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Fetch my balances
  const { data: balances, isLoading: balancesLoading } = useMyClassPackBalances();

  // Fetch available packs
  const { data: availablePacks, isLoading: packsLoading } = useActiveClassPacks();

  const activeBalances = balances?.filter((b) => b.status === "ACTIVE") || [];
  const pastBalances = balances?.filter((b) => b.status !== "ACTIVE") || [];

  const handlePurchaseClick = (pack: ClassPack) => {
    setSelectedPack(pack);
    setPurchaseDialogOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedPack) return;

    setIsPurchasing(true);
    try {
      // TODO: Implement actual purchase flow through payment gateway
      // For now, just show success
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({ title: t.purchaseSuccess });
      setPurchaseDialogOpen(false);
      setSelectedPack(null);
    } catch {
      toast({ title: t.purchaseError, variant: "destructive" });
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (balancesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {/* Active Packs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.activePacks}</h2>
        {activeBalances.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-medium">{t.noPacks}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.noPacksDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeBalances.map((balance) => (
              <ActivePackCard key={balance.id} balance={balance} locale={locale} />
            ))}
          </div>
        )}
      </section>

      {/* Buy More */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.buyMore}</h2>
        {packsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loading />
          </div>
        ) : !availablePacks || availablePacks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {locale === "ar" ? "لا توجد باقات متاحة للشراء" : "No packs available for purchase"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {availablePacks.map((pack) => (
              <PurchasePackCard
                key={pack.id}
                pack={pack}
                locale={locale}
                onPurchase={() => handlePurchaseClick(pack)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past Packs */}
      {pastBalances.length > 0 && (
        <section className="space-y-4">
          <details>
            <summary className="text-lg font-semibold cursor-pointer hover:text-primary">
              {t.pastPacks} ({pastBalances.length})
            </summary>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {pastBalances.map((balance) => (
                <Card key={balance.id} className="opacity-60">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          <LocalizedText text={balance.packName} />
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {balance.classesUsed}/{balance.classesPurchased} {t.classesUsed}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(balance.status)}>
                        {t[balance.status.toLowerCase() as keyof typeof t] || balance.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </details>
        </section>
      )}

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.purchasePack}</DialogTitle>
            <DialogDescription>{t.packDetails}</DialogDescription>
          </DialogHeader>

          {selectedPack && (
            <div className="py-4 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  <LocalizedText text={selectedPack.name} />
                </h3>
                {selectedPack.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <LocalizedText text={selectedPack.description} />
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedPack.classCount}</p>
                  <p className="text-sm text-muted-foreground">{t.classes}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {selectedPack.validityDays || "∞"}
                  </p>
                  <p className="text-sm text-muted-foreground">{t.days}</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold">
                  {formatPrice(selectedPack.priceWithTax.amount, selectedPack.priceWithTax.currency)}
                </p>
                <p className="text-sm text-muted-foreground">{t.inclTax}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handlePurchase} disabled={isPurchasing}>
              {isPurchasing ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t.buying}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 me-2" />
                  {t.buy}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
