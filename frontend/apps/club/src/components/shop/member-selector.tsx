"use client";

import { useState } from "react";
import { Search, X, User } from "lucide-react";
import { useLocale } from "next-intl";
import { useMembers } from "@liyaqa/shared/queries/use-members";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import type { Member } from "@liyaqa/shared/types/member";

interface MemberSelectorProps {
  selectedMember: Member | null;
  onSelect: (member: Member) => void;
  onClear: () => void;
}

export function MemberSelector({
  selectedMember,
  onSelect,
  onClear,
}: MemberSelectorProps) {
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const { data: members, isLoading } = useMembers(
    { search: search || undefined, status: "ACTIVE", size: 10 },
    { enabled: search.length >= 2 && !selectedMember }
  );

  const texts = {
    searchPlaceholder:
      locale === "ar"
        ? "ابحث عن عضو بالاسم أو البريد الإلكتروني..."
        : "Search member by name or email...",
    searchHint:
      locale === "ar"
        ? "أدخل حرفين على الأقل للبحث"
        : "Enter at least 2 characters to search",
    noResults: locale === "ar" ? "لم يتم العثور على أعضاء" : "No members found",
    change: locale === "ar" ? "تغيير" : "Change",
    searching: locale === "ar" ? "جاري البحث..." : "Searching...",
  };

  if (selectedMember) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                <LocalizedText text={selectedMember.firstName} />{" "}
                <LocalizedText text={selectedMember.lastName} />
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedMember.email}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="h-4 w-4 me-1" />
            {texts.change}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={texts.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>

        {search.length < 2 && (
          <p className="text-sm text-muted-foreground">{texts.searchHint}</p>
        )}

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {search.length >= 2 && !isLoading && members?.content && (
          <>
            {members.content.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {texts.noResults}
              </p>
            ) : (
              <ul className="border rounded-md divide-y max-h-60 overflow-auto">
                {members.content.map((member: Member) => (
                  <li
                    key={member.id}
                    className="p-3 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => {
                      onSelect(member);
                      setSearch("");
                    }}
                  >
                    <p className="font-medium">
                      <LocalizedText text={member.firstName} />{" "}
                      <LocalizedText text={member.lastName} />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
