"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { History, Loader2, Calendar, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { useSubscriptionFreezeHistory } from "../queries/use-freeze-packages";
import type { UUID } from "../../types/api";
import type { FreezeHistory } from "../../types/freeze";

interface FreezeHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: UUID;
}

export function FreezeHistoryDialog({
  open,
  onOpenChange,
  subscriptionId,
}: FreezeHistoryDialogProps) {
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data, isLoading } = useSubscriptionFreezeHistory(subscriptionId, {
    page,
    size: pageSize,
  });

  const history = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const texts = {
    title: locale === "ar" ? "سجل التجميد" : "Freeze History",
    description:
      locale === "ar"
        ? "عرض جميع عمليات التجميد السابقة لهذا الاشتراك"
        : "View all previous freeze operations for this subscription",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    noHistory:
      locale === "ar"
        ? "لا يوجد سجل تجميد لهذا الاشتراك"
        : "No freeze history found for this subscription",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    endDate: locale === "ar" ? "تاريخ الانتهاء" : "End Date",
    days: locale === "ar" ? "يوم" : "days",
    type: locale === "ar" ? "النوع" : "Type",
    reason: locale === "ar" ? "السبب" : "Reason",
    active: locale === "ar" ? "نشط" : "Active",
    completed: locale === "ar" ? "مكتمل" : "Completed",
    contractExtended: locale === "ar" ? "تم تمديد العقد" : "Contract Extended",
    close: locale === "ar" ? "إغلاق" : "Close",
    page: locale === "ar" ? "صفحة" : "Page",
    of: locale === "ar" ? "من" : "of",
    freezeTypes: {
      MEDICAL: locale === "ar" ? "طبي" : "Medical",
      TRAVEL: locale === "ar" ? "سفر" : "Travel",
      PERSONAL: locale === "ar" ? "شخصي" : "Personal",
      MILITARY: locale === "ar" ? "عسكري" : "Military",
      OTHER: locale === "ar" ? "أخرى" : "Other",
    },
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      locale === "ar" ? "ar-SA" : "en-US",
      { year: "numeric", month: "short", day: "numeric" }
    );
  };

  const HistoryItem = ({ item }: { item: FreezeHistory }) => (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatDate(item.freezeStartDate)}</span>
          {item.freezeEndDate && (
            <>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">{formatDate(item.freezeEndDate)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {item.isActive ? (
            <Badge variant="default" className="bg-blue-500">
              {texts.active}
            </Badge>
          ) : (
            <Badge variant="secondary">{texts.completed}</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{texts.days}:</span>
          <span className="font-medium">{item.freezeDays}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{texts.type}:</span>
          <Badge variant="outline">
            {texts.freezeTypes[item.freezeType as keyof typeof texts.freezeTypes]}
          </Badge>
        </div>
      </div>

      {item.reason && (
        <div className="mt-2 text-sm">
          <span className="text-muted-foreground">{texts.reason}: </span>
          <span>{item.reason}</span>
        </div>
      )}

      {item.contractExtended && (
        <div className="mt-2 flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
          <Check className="h-4 w-4" />
          <span>{texts.contractExtended}</span>
          {item.originalEndDate && item.newEndDate && (
            <span className="text-muted-foreground ml-1">
              ({formatDate(item.originalEndDate)} → {formatDate(item.newEndDate)})
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{texts.loading}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {texts.noHistory}
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {history.map((item) => (
                  <HistoryItem key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {locale === "ar" ? "السابق" : "Previous"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {texts.page} {page + 1} {texts.of} {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              {locale === "ar" ? "التالي" : "Next"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {texts.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
