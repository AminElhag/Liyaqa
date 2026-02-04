"use client";

import { useState } from "react";
import { Package, Plus, X, Gift, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
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
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useMemberClassPackBalances,
  useActiveClassPacks,
  useGrantPackToMember,
  useCancelBalance,
} from "@liyaqa/shared/queries";
import { formatDate } from "@liyaqa/shared/utils";
import type { UUID } from "@liyaqa/shared/types/api";
import type { ClassPackBalanceStatus } from "@liyaqa/shared/types/scheduling";

interface MemberClassPacksCardProps {
  memberId: UUID;
  locale: string;
}

const texts = {
  en: {
    title: "Class Packs",
    noPacks: "No class packs",
    noPacksDesc: "Grant a class pack to this member",
    grantPack: "Grant Pack",
    grantPackDesc: "Select a class pack to grant to this member",
    selectPack: "Select a class pack",
    cancel: "Cancel",
    grant: "Grant",
    granting: "Granting...",
    classesRemaining: "remaining",
    expires: "Expires",
    noExpiry: "No expiry",
    packGranted: "Class pack granted successfully",
    packCancelled: "Class pack cancelled",
    cancelPack: "Cancel",
    cancelConfirm: "Are you sure you want to cancel this class pack balance?",
    error: "Error",
    classes: "classes",
    active: "Active",
    depleted: "Depleted",
    expired: "Expired",
    cancelled: "Cancelled",
  },
  ar: {
    title: "باقات الحصص",
    noPacks: "لا توجد باقات",
    noPacksDesc: "امنح باقة حصص لهذا العضو",
    grantPack: "منح باقة",
    grantPackDesc: "اختر باقة حصص لمنحها لهذا العضو",
    selectPack: "اختر باقة",
    cancel: "إلغاء",
    grant: "منح",
    granting: "جاري المنح...",
    classesRemaining: "متبقية",
    expires: "تنتهي",
    noExpiry: "بدون انتهاء",
    packGranted: "تم منح الباقة بنجاح",
    packCancelled: "تم إلغاء الباقة",
    cancelPack: "إلغاء",
    cancelConfirm: "هل أنت متأكد من إلغاء رصيد هذه الباقة؟",
    error: "خطأ",
    classes: "حصص",
    active: "نشط",
    depleted: "مستنفذ",
    expired: "منتهي",
    cancelled: "ملغي",
  },
};

function getStatusVariant(status: ClassPackBalanceStatus): "success" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "DEPLETED":
      return "secondary";
    case "EXPIRED":
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

export function MemberClassPacksCard({ memberId, locale }: MemberClassPacksCardProps) {
  const t = texts[locale as "en" | "ar"] || texts.en;
  const { toast } = useToast();

  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>("");

  // Fetch member balances
  const { data: balances, isLoading: balancesLoading } = useMemberClassPackBalances(memberId);

  // Fetch active packs for grant dialog
  const { data: activePacks, isLoading: packsLoading } = useActiveClassPacks();

  // Mutations
  const grantPack = useGrantPackToMember();
  const cancelBalance = useCancelBalance();

  const handleGrant = async () => {
    if (!selectedPackId) return;

    try {
      await grantPack.mutateAsync({
        memberId,
        classPackId: selectedPackId,
      });
      toast({ title: t.packGranted });
      setGrantDialogOpen(false);
      setSelectedPackId("");
    } catch {
      toast({ title: t.error, variant: "destructive" });
    }
  };

  const handleCancel = async (balanceId: UUID) => {
    if (!confirm(t.cancelConfirm)) return;

    try {
      await cancelBalance.mutateAsync(balanceId);
      toast({ title: t.packCancelled });
    } catch {
      toast({ title: t.error, variant: "destructive" });
    }
  };

  if (balancesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loading />
        </CardContent>
      </Card>
    );
  }

  const activeBalances = balances?.content?.filter(
    (b) => b.status === "ACTIVE"
  ) || [];
  const otherBalances = balances?.content?.filter(
    (b) => b.status !== "ACTIVE"
  ) || [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <Button size="sm" onClick={() => setGrantDialogOpen(true)}>
            <Gift className="h-4 w-4 me-2" />
            {t.grantPack}
          </Button>
        </CardHeader>
        <CardContent>
          {activeBalances.length === 0 && otherBalances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t.noPacks}</p>
              <p className="text-sm mt-1">{t.noPacksDesc}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Balances */}
              {activeBalances.map((balance) => (
                <div
                  key={balance.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        <LocalizedText text={balance.packName} />
                      </p>
                      <Badge variant={getStatusVariant(balance.status)}>
                        {t[balance.status.toLowerCase() as keyof typeof t] || balance.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {balance.classesRemaining}/{balance.classesPurchased} {t.classesRemaining}
                      </span>
                      {balance.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t.expires}: {formatDate(balance.expiresAt, locale)}
                        </span>
                      )}
                    </div>
                  </div>
                  {balance.status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(balance.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Other Balances (collapsed) */}
              {otherBalances.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    {locale === "ar"
                      ? `${otherBalances.length} باقات سابقة`
                      : `${otherBalances.length} past balance(s)`}
                  </summary>
                  <div className="mt-2 space-y-2">
                    {otherBalances.map((balance) => (
                      <div
                        key={balance.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-muted-foreground">
                              <LocalizedText text={balance.packName} />
                            </p>
                            <Badge variant={getStatusVariant(balance.status)}>
                              {t[balance.status.toLowerCase() as keyof typeof t] || balance.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {balance.classesUsed}/{balance.classesPurchased} {t.classes}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant Pack Dialog */}
      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              {t.grantPack}
            </DialogTitle>
            <DialogDescription>{t.grantPackDesc}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {packsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loading />
              </div>
            ) : !activePacks || activePacks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{locale === "ar" ? "لا توجد باقات متاحة" : "No active packs available"}</p>
              </div>
            ) : (
              <Select value={selectedPackId} onValueChange={setSelectedPackId}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectPack} />
                </SelectTrigger>
                <SelectContent>
                  {activePacks.map((pack) => (
                    <SelectItem key={pack.id} value={pack.id}>
                      <div className="flex items-center justify-between gap-4">
                        <LocalizedText text={pack.name} />
                        <span className="text-muted-foreground">
                          ({pack.classCount} {t.classes})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              onClick={handleGrant}
              disabled={!selectedPackId || grantPack.isPending}
            >
              {grantPack.isPending ? t.granting : t.grant}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
