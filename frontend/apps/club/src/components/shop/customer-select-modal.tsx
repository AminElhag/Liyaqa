"use client";

import { useState } from "react";
import { Search, User, UserPlus, ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";
import { useMembers } from "@liyaqa/shared/queries/use-members";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Button } from "@liyaqa/shared/components/ui/button";
import { ScrollArea } from "@liyaqa/shared/components/ui/scroll-area";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { QuickCreateCustomer } from "./quick-create-customer";
import type { Member } from "@liyaqa/shared/types/member";

interface CustomerSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (member: Member) => void;
}

type ModalView = "search" | "create";

export function CustomerSelectModal({
  open,
  onOpenChange,
  onSelect,
}: CustomerSelectModalProps) {
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ModalView>("search");

  const { data: members, isLoading } = useMembers(
    { search: search || undefined, status: "ACTIVE", size: 10 },
    { enabled: search.length >= 2 && view === "search" }
  );

  const texts = {
    selectCustomer: locale === "ar" ? "اختر العميل" : "Select Customer",
    newCustomer: locale === "ar" ? "عميل جديد" : "New Customer",
    searchPlaceholder:
      locale === "ar"
        ? "ابحث بالاسم أو البريد الإلكتروني أو الهاتف..."
        : "Search by name, email, or phone...",
    searchHint:
      locale === "ar"
        ? "أدخل حرفين على الأقل للبحث"
        : "Enter at least 2 characters to search",
    noResults: locale === "ar" ? "لم يتم العثور على أعضاء" : "No members found",
    searching: locale === "ar" ? "جاري البحث..." : "Searching...",
    addNewCustomer:
      locale === "ar" ? "+ إضافة عميل جديد" : "+ Add New Customer",
    recentCustomers: locale === "ar" ? "نتائج البحث" : "Search Results",
    backToSearch: locale === "ar" ? "العودة للبحث" : "Back to Search",
  };

  const handleSelect = (member: Member) => {
    onSelect(member);
    onOpenChange(false);
    setSearch("");
    setView("search");
  };

  const handleCustomerCreated = (member: Member) => {
    handleSelect(member);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearch("");
    setView("search");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        {view === "search" ? (
          <div>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
              <DialogTitle className="text-xl font-semibold text-neutral-900">
                {texts.selectCustomer}
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder={texts.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-10 h-12 bg-neutral-50 border-neutral-200 focus:bg-white"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {search.length < 2 && (
                    <p className="text-sm text-neutral-500 text-center py-8">
                      {texts.searchHint}
                    </p>
                  )}

                  {isLoading && (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                      ))}
                    </div>
                  )}

                  {search.length >= 2 && !isLoading && members?.content && (
                    <>
                      {members.content.length === 0 ? (
                        <div className="text-center py-8">
                          <User className="h-12 w-12 mx-auto mb-3 text-neutral-200" />
                          <p className="text-neutral-500">{texts.noResults}</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                            {texts.recentCustomers}
                          </p>
                          {members.content.map((member: Member) => (
                            <button
                              key={member.id}
                              className="w-full flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all text-start"
                              onClick={() => handleSelect(member)}
                            >
                              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-teal-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-neutral-900 truncate">
                                  <LocalizedText text={member.firstName} />{" "}
                                  <LocalizedText text={member.lastName} />
                                </p>
                                <p className="text-sm text-neutral-500 truncate">
                                  {member.email}
                                  {member.phone && (
                                    <span className="mx-1">|</span>
                                  )}
                                  {member.phone}
                                </p>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Add New Customer Button */}
              <div className="pt-2 border-t border-neutral-100">
                <Button
                  variant="outline"
                  className="w-full h-12 border-dashed border-neutral-300 text-neutral-600 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/50"
                  onClick={() => setView("create")}
                >
                  <UserPlus className="h-4 w-4 me-2" />
                  {texts.addNewCustomer}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -ms-2"
                  onClick={() => setView("search")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-xl font-semibold text-neutral-900">
                  {texts.newCustomer}
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="p-6">
              <QuickCreateCustomer
                onSuccess={handleCustomerCreated}
                onCancel={() => setView("search")}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
