"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, Package, Gift } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useMembers, useGrantPackToMember } from "@liyaqa/shared/queries";
import type { ClassPack } from "@liyaqa/shared/types/scheduling";
import type { Member } from "@liyaqa/shared/types/member";

interface GrantPackToMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classPack: ClassPack;
  locale: "en" | "ar";
}

const texts = {
  en: {
    title: "Assign Class Pack to Member",
    description: "Search for a member to grant this class pack as complimentary.",
    packSummary: "Pack Details",
    credits: "credits",
    validity: "Validity",
    days: "days",
    noExpiry: "No expiry",
    searchPlaceholder: "Search by name or email...",
    noResults: "No members found",
    typeToSearch: "Type to search for a member",
    selectedMember: "Selected Member",
    remove: "Remove",
    cancel: "Cancel",
    assign: "Assign Pack",
    assigning: "Assigning...",
    success: "Class pack assigned successfully",
    error: "Failed to assign class pack",
  },
  ar: {
    title: "تعيين باقة حصص لعضو",
    description: "ابحث عن عضو لمنح هذه الباقة كمجانية.",
    packSummary: "تفاصيل الباقة",
    credits: "حصص",
    validity: "الصلاحية",
    days: "أيام",
    noExpiry: "بدون انتهاء",
    searchPlaceholder: "البحث بالاسم أو البريد الإلكتروني...",
    noResults: "لم يتم العثور على أعضاء",
    typeToSearch: "اكتب للبحث عن عضو",
    selectedMember: "العضو المختار",
    remove: "إزالة",
    cancel: "إلغاء",
    assign: "تعيين الباقة",
    assigning: "جاري التعيين...",
    success: "تم تعيين الباقة بنجاح",
    error: "فشل في تعيين الباقة",
  },
};

export function GrantPackToMemberDialog({
  open,
  onOpenChange,
  classPack,
  locale,
}: GrantPackToMemberDialogProps) {
  const t = texts[locale];
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const grantPack = useGrantPackToMember();

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 300);
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setDebouncedQuery("");
      setSelectedMember(null);
    }
  }, [open]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Fetch members based on search
  const { data: membersData, isLoading: isLoadingMembers } = useMembers(
    { search: debouncedQuery, size: 10 },
    { enabled: debouncedQuery.length > 0 }
  );

  const members = membersData?.content ?? [];

  const handleAssign = async () => {
    if (!selectedMember) return;
    try {
      await grantPack.mutateAsync({
        memberId: selectedMember.id,
        classPackId: classPack.id,
      });
      toast({ title: t.success });
      onOpenChange(false);
    } catch {
      toast({ title: t.error, variant: "destructive" });
    }
  };

  const formatPrice = (price: { amount: number; currency: string }) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: price.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price.amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        {/* Pack summary card */}
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
            <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">
              <LocalizedText text={classPack.name} />
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {classPack.classCount} {t.credits}
              </span>
              <span>•</span>
              <span>{formatPrice(classPack.price)}</span>
              <span>•</span>
              <span>
                {classPack.validityDays
                  ? `${classPack.validityDays} ${t.days}`
                  : t.noExpiry}
              </span>
            </div>
          </div>
        </div>

        {/* Selected member card */}
        {selectedMember ? (
          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {(
                    selectedMember.firstName?.en?.[0] ||
                    selectedMember.firstName?.ar?.[0] ||
                    "?"
                  ).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  <LocalizedText text={selectedMember.firstName} />{" "}
                  <LocalizedText text={selectedMember.lastName} />
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedMember.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMember(null)}
            >
              <X className="h-4 w-4 me-1" />
              {t.remove}
            </Button>
          </div>
        ) : (
          <>
            {/* Search input */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="ps-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedQuery("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search results */}
            <div className="flex-1 overflow-y-auto min-h-[160px] max-h-[260px] border rounded-lg">
              {!debouncedQuery ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">{t.typeToSearch}</p>
                </div>
              ) : isLoadingMembers ? (
                <div className="flex justify-center py-8">
                  <Loading />
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">{t.noResults}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className="flex items-center gap-3 w-full p-3 text-start hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {(
                            member.firstName?.en?.[0] ||
                            member.firstName?.ar?.[0] ||
                            "?"
                          ).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          <LocalizedText text={member.firstName} />{" "}
                          <LocalizedText text={member.lastName} />
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                      <Badge
                        variant={
                          member.status === "ACTIVE" ? "success" : "secondary"
                        }
                        className="text-xs shrink-0"
                      >
                        {member.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedMember || grantPack.isPending}
          >
            {grantPack.isPending ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t.assigning}
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 me-2" />
                {t.assign}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
