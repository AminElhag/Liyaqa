"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import {
  Search,
  X,
  Users,
  Ticket,
  Gift,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useMembers,
  useMemberClassPackBalances,
  useActiveClassPacks,
  useGrantPackToMember,
} from "@liyaqa/shared/queries";
import type { Member } from "@liyaqa/shared/types/member";
import type { MemberClassPackBalance, ServiceType } from "@liyaqa/shared/types/scheduling";

const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  GX: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PT: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  GOODS: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const texts = {
  en: {
    title: "Member Credit Balances",
    description: "View and manage member credit pack balances",
    back: "Back to Credit Packs",
    searchPlaceholder: "Search members by name or email...",
    noMemberSelected: "Select a member to view their credit balances",
    noMemberSelectedDesc: "Use the search field above to find a member",
    noResults: "No members found",
    selectedMember: "Selected Member",
    change: "Change",
    balances: "Active Balances",
    packName: "Pack Name",
    serviceType: "Service Type",
    purchased: "Purchased",
    remaining: "Remaining",
    expiresAt: "Expires",
    status: "Status",
    noBalances: "No credit pack balances",
    noBalancesDesc: "This member has no active credit pack balances",
    grantPack: "Grant a Pack",
    grantSuccess: "Credit pack granted successfully",
    grantError: "Failed to grant credit pack",
    noExpiry: "No expiry",
    selectPack: "Select a pack to grant",
    granting: "Granting...",
    credits: "credits",
  },
  ar: {
    title: "أرصدة رصيد الأعضاء",
    description: "عرض وإدارة أرصدة باقات الرصيد للأعضاء",
    back: "العودة لباقات الرصيد",
    searchPlaceholder: "البحث عن أعضاء بالاسم أو البريد الإلكتروني...",
    noMemberSelected: "اختر عضواً لعرض أرصدة الرصيد",
    noMemberSelectedDesc: "استخدم حقل البحث أعلاه للعثور على عضو",
    noResults: "لم يتم العثور على أعضاء",
    selectedMember: "العضو المختار",
    change: "تغيير",
    balances: "الأرصدة النشطة",
    packName: "اسم الباقة",
    serviceType: "نوع الخدمة",
    purchased: "المشتراة",
    remaining: "المتبقية",
    expiresAt: "تنتهي",
    status: "الحالة",
    noBalances: "لا توجد أرصدة باقات",
    noBalancesDesc: "هذا العضو ليس لديه أرصدة باقات نشطة",
    grantPack: "منح باقة",
    grantSuccess: "تم منح الباقة بنجاح",
    grantError: "فشل في منح الباقة",
    noExpiry: "بدون انتهاء",
    selectPack: "اختر باقة لمنحها",
    granting: "جاري المنح...",
    credits: "رصيد",
  },
};

export default function CreditPackBalancesPage() {
  const locale = useLocale() as "en" | "ar";
  const { toast } = useToast();
  const t = texts[locale];
  const isRTL = locale === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showSearch, setShowSearch] = useState(true);
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

  // Cleanup debounce
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

  // Fetch selected member balances
  const { data: balancesData, isLoading: isLoadingBalances } = useMemberClassPackBalances(
    selectedMember?.id || "",
    { size: 50 }
  );
  const balances = balancesData?.content ?? [];

  // Fetch active packs for granting
  const { data: activePacks = [] } = useActiveClassPacks();

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setShowSearch(false);
    setSearchQuery("");
    setDebouncedQuery("");
  };

  const handleChangeMember = () => {
    setSelectedMember(null);
    setShowSearch(true);
  };

  const handleGrantPack = async (classPackId: string) => {
    if (!selectedMember) return;
    try {
      await grantPack.mutateAsync({
        memberId: selectedMember.id,
        classPackId,
      });
      toast({ title: t.grantSuccess });
    } catch {
      toast({ title: t.grantError, variant: "destructive" });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return t.noExpiry;
    return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Table columns
  const columns: ColumnDef<MemberClassPackBalance>[] = useMemo(
    () => [
      {
        accessorKey: "packName",
        header: t.packName,
        cell: ({ row }) => (
          <div className="font-medium">
            <LocalizedText text={row.original.packName} />
          </div>
        ),
      },
      {
        accessorKey: "classesPurchased",
        header: t.purchased,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.classesPurchased} {t.credits}
          </span>
        ),
      },
      {
        accessorKey: "classesRemaining",
        header: t.remaining,
        cell: ({ row }) => {
          const remaining = row.original.classesRemaining;
          const purchased = row.original.classesPurchased;
          const pct = purchased > 0 ? (remaining / purchased) * 100 : 0;
          return (
            <div className="flex items-center gap-2">
              <span className="tabular-nums font-medium">
                {remaining} {t.credits}
              </span>
              <div className="hidden sm:block w-16 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "expiresAt",
        header: t.expiresAt,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.expiresAt)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: t.status,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} locale={locale} />
        ),
      },
    ],
    [locale, t]
  );

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/${locale}/credit-packs`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {t.back}
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
      </div>

      {/* Member Search / Selected Member */}
      <Card>
        <CardContent className="pt-6">
          {selectedMember && !showSearch ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {(
                      selectedMember.firstName?.en?.[0] ||
                      selectedMember.firstName?.ar?.[0] ||
                      "?"
                    ).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    <LocalizedText text={selectedMember.firstName} />{" "}
                    <LocalizedText text={selectedMember.lastName} />
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                </div>
                <Badge
                  variant={selectedMember.status === "ACTIVE" ? "success" : "secondary"}
                  className="text-xs"
                >
                  {selectedMember.status}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleChangeMember}>
                {t.change}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="ps-9"
                  autoFocus
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
              {debouncedQuery.length > 0 && (
                <div className="border rounded-lg overflow-hidden max-h-[260px] overflow-y-auto">
                  {isLoadingMembers ? (
                    <div className="flex justify-center py-6">
                      <Loading />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                      <Search className="h-6 w-6 mb-1 opacity-50" />
                      <p className="text-sm">{t.noResults}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {members.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          className="flex items-center gap-3 w-full p-3 text-start hover:bg-muted/50 transition-colors"
                          onClick={() => handleSelectMember(member)}
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
                            variant={member.status === "ACTIVE" ? "success" : "secondary"}
                            className="text-xs shrink-0"
                          >
                            {member.status}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Table or Placeholder */}
      {selectedMember ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t.balances}</CardTitle>
            {activePacks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Grant the first active pack for now, or could open a dialog
                  // This is a simplified version - in production, use a dialog to select
                  if (activePacks.length === 1) {
                    handleGrantPack(activePacks[0].id);
                  }
                }}
                disabled={grantPack.isPending}
              >
                <Gift className="h-4 w-4 me-2" />
                {grantPack.isPending ? t.granting : t.grantPack}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingBalances ? (
              <div className="flex justify-center py-10">
                <Loading />
              </div>
            ) : balances.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Ticket className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold">{t.noBalances}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t.noBalancesDesc}</p>
              </div>
            ) : (
              <DataTable columns={columns} data={balances} />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t.noMemberSelected}</h3>
            <p className="text-muted-foreground mt-1">{t.noMemberSelectedDesc}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
