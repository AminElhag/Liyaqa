"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { Shuffle, Loader2, AlertTriangle, Search, User } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@liyaqa/shared/components/ui/alert";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useMembers } from "@liyaqa/shared/queries/use-members";
import { useTransferSubscription } from "@liyaqa/shared/queries/use-subscriptions";
import type { UUID } from "@liyaqa/shared/types/api";
import type { Member } from "@liyaqa/shared/types/member";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: UUID;
  currentMemberId: UUID;
  onSuccess?: () => void;
}

export function TransferDialog({
  open,
  onOpenChange,
  subscriptionId,
  currentMemberId,
  onSuccess,
}: TransferDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const transferMutation = useTransferSubscription();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [reason, setReason] = useState("");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    const timeoutId = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timeoutId);
  }, []);

  const { data: membersData, isLoading: membersLoading } = useMembers(
    { search: debouncedSearch, size: 5 },
    { enabled: debouncedSearch.length >= 2 }
  );

  const members = membersData?.content?.filter((m: Member) => m.id !== currentMemberId) ?? [];

  const texts = {
    title: locale === "ar" ? "تحويل العضوية" : "Transfer Membership",
    description: locale === "ar"
      ? "تحويل هذه العضوية إلى عضو آخر"
      : "Transfer this membership to another member",
    searchMember: locale === "ar" ? "البحث عن عضو" : "Search for a member",
    searchPlaceholder: locale === "ar" ? "ابحث بالاسم أو البريد..." : "Search by name or email...",
    searchHint: locale === "ar" ? "أدخل حرفين على الأقل" : "Enter at least 2 characters",
    noResults: locale === "ar" ? "لا نتائج" : "No results found",
    transferTo: locale === "ar" ? "التحويل إلى" : "Transfer to",
    reason: locale === "ar" ? "سبب التحويل" : "Transfer Reason",
    reasonPlaceholder: locale === "ar" ? "أدخل سبب التحويل..." : "Enter transfer reason...",
    warning: locale === "ar" ? "تحذير" : "Warning",
    warningDesc: locale === "ar"
      ? "هذا الإجراء لا يمكن التراجع عنه. سيتم نقل العضوية بالكامل إلى العضو المحدد."
      : "This action is irreversible. The membership will be fully transferred to the selected member.",
    cancel: locale === "ar" ? "تراجع" : "Cancel",
    confirm: locale === "ar" ? "تأكيد التحويل" : "Confirm Transfer",
    confirming: locale === "ar" ? "جاري التحويل..." : "Transferring...",
    successTitle: locale === "ar" ? "تم التحويل" : "Transfer Complete",
    successDesc: locale === "ar" ? "تم تحويل العضوية بنجاح" : "The membership has been transferred successfully",
    errorTitle: locale === "ar" ? "خطأ في التحويل" : "Transfer Error",
    notReady: locale === "ar"
      ? "هذه الميزة غير متاحة حالياً. يرجى التواصل مع الدعم."
      : "This feature is not yet available. Please contact support.",
    change: locale === "ar" ? "تغيير" : "Change",
  };

  const handleSubmit = async () => {
    if (!selectedMember) return;

    try {
      await transferMutation.mutateAsync({
        id: subscriptionId,
        data: {
          targetMemberId: selectedMember.id,
          reason: reason || undefined,
        },
      });

      toast({ title: texts.successTitle, description: texts.successDesc });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : texts.notReady,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedMember(null);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-primary" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Search */}
          {!selectedMember ? (
            <div className="space-y-2">
              <Label>{texts.searchMember}</Label>
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={texts.searchPlaceholder}
                  className="ps-9"
                />
              </div>
              {debouncedSearch.length < 2 && searchQuery.length > 0 && (
                <p className="text-xs text-muted-foreground">{texts.searchHint}</p>
              )}

              {/* Search Results */}
              {debouncedSearch.length >= 2 && (
                <div className="rounded-lg border max-h-48 overflow-auto">
                  {membersLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{texts.noResults}</p>
                  ) : (
                    members.map((m: Member) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMember(m)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-start hover:bg-accent transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            <LocalizedText text={m.fullName} />
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Selected Member Card */
            <div className="space-y-2">
              <Label>{texts.transferTo}</Label>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      <LocalizedText text={selectedMember.fullName} />
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                  {texts.change}
                </Button>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>{texts.reason}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={texts.reasonPlaceholder}
              rows={2}
            />
          </div>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{texts.warning}</AlertTitle>
            <AlertDescription>{texts.warningDesc}</AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false); }}
            disabled={transferMutation.isPending}
          >
            {texts.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMember || transferMutation.isPending}
          >
            {transferMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {texts.confirming}
              </>
            ) : (
              <>
                <Shuffle className="h-4 w-4 me-2" />
                {texts.confirm}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
