"use client";

import { useState, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import {
  Search,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Checkbox } from "@liyaqa/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { LocalizedText, useLocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useMembers } from "@liyaqa/shared/queries";
import type { ClassSession } from "@liyaqa/shared/types/scheduling";
import type { Member } from "@liyaqa/shared/types/member";

interface BookingMemberSearchProps {
  session: ClassSession;
  existingMemberIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookMember: (memberId: string) => Promise<void>;
}

const texts = {
  en: {
    title: "Add Member to Session",
    search: "Search members by name or email...",
    noResults: "No members found",
    addToWaitlist: "Add to waitlist if session is full",
    activeSubscription: "Active subscription",
    noSubscription: "No active subscription",
    alreadyBooked: "Already booked",
    add: "Add",
    adding: "Adding...",
    cancel: "Cancel",
    memberAdded: "Member added to session",
    error: "Failed to add member",
    sessionFull: "Session is full",
    availableSpots: "spots available",
    waitlistOnly: "Waitlist only",
  },
  ar: {
    title: "إضافة عضو للجلسة",
    search: "البحث بالاسم أو البريد الإلكتروني...",
    noResults: "لم يتم العثور على أعضاء",
    addToWaitlist: "إضافة إلى قائمة الانتظار إذا كانت الجلسة ممتلئة",
    activeSubscription: "اشتراك نشط",
    noSubscription: "لا يوجد اشتراك نشط",
    alreadyBooked: "محجوز مسبقًا",
    add: "إضافة",
    adding: "جاري الإضافة...",
    cancel: "إلغاء",
    memberAdded: "تم إضافة العضو للجلسة",
    error: "فشل في إضافة العضو",
    sessionFull: "الجلسة ممتلئة",
    availableSpots: "أماكن متاحة",
    waitlistOnly: "قائمة الانتظار فقط",
  },
};

// Format session date for display
function formatSessionInfo(
  session: ClassSession,
  locale: string
): { date: string; time: string } {
  const sessionDate = new Date(session.date);
  const dateFormatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
  );

  const formatTime = (time: string): string => {
    const parts = time.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  return {
    date: dateFormatter.format(sessionDate),
    time: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
  };
}

export function BookingMemberSearch({
  session,
  existingMemberIds,
  open,
  onOpenChange,
  onBookMember,
}: BookingMemberSearchProps) {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [addToWaitlist, setAddToWaitlist] = useState(true);
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);

  // Fetch members
  const { data: membersData, isLoading: isLoadingMembers } = useMembers({
    search: searchQuery,
    size: 20,
  });

  const className = useLocalizedText(session.className);
  const sessionInfo = useMemo(
    () => formatSessionInfo(session, locale),
    [session, locale]
  );

  const isFull = session.availableSpots === 0;

  // Filter out already booked members
  const availableMembers = useMemo(() => {
    if (!membersData?.content) return [];
    return membersData.content.filter(
      (member) => !existingMemberIds.includes(member.id)
    );
  }, [membersData?.content, existingMemberIds]);

  const handleAddMember = useCallback(
    async (member: Member) => {
      // Check if session is full and waitlist is disabled
      if (isFull && !addToWaitlist) {
        toast({ title: t.sessionFull, variant: "destructive" });
        return;
      }

      setLoadingMemberId(member.id);
      try {
        await onBookMember(member.id);
        toast({ title: t.memberAdded });
        // Don't close dialog - allow adding more members
      } catch {
        toast({ title: t.error, variant: "destructive" });
      } finally {
        setLoadingMemberId(null);
      }
    },
    [isFull, addToWaitlist, onBookMember, toast, t]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {className} • {sessionInfo.date} • {sessionInfo.time}
          </DialogDescription>
        </DialogHeader>

        {/* Availability badge */}
        <div className="flex items-center gap-2">
          {isFull ? (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {t.waitlistOnly}
            </Badge>
          ) : (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {session.availableSpots} {t.availableSpots}
            </Badge>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] border rounded-lg">
          {isLoadingMembers ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">{t.noResults}</p>
            </div>
          ) : (
            <div className="divide-y">
              {availableMembers.map((member) => {
                const isLoading = loadingMemberId === member.id;
                const hasActiveSubscription = member.status === "ACTIVE";

                return (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center justify-between p-3 hover:bg-muted/50 transition-colors",
                      isLoading && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {(member.firstName?.en?.[0] ||
                            member.firstName?.ar?.[0] ||
                            "?"
                          ).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          <LocalizedText text={member.firstName} />{" "}
                          <LocalizedText text={member.lastName} />
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasActiveSubscription ? (
                        <Badge variant="success" className="text-xs">
                          {t.activeSubscription}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {t.noSubscription}
                        </Badge>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddMember(member)}
                        disabled={isLoading}
                        className="ml-2"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        {t.add}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Waitlist option */}
        {isFull && (
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="waitlist"
              checked={addToWaitlist}
              onCheckedChange={(checked) => setAddToWaitlist(checked === true)}
            />
            <label
              htmlFor="waitlist"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              {t.addToWaitlist}
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
