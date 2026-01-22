"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { SortableDealCard } from "./deal-card";
import type { DealSummary, DealStatus } from "@/types/platform";

interface KanbanColumnProps {
  status: DealStatus;
  deals: DealSummary[];
  onDealClick: (deal: DealSummary) => void;
}

const COLUMN_CONFIG: Record<
  DealStatus,
  {
    labelEn: string;
    labelAr: string;
    bgColor: string;
    borderColor: string;
    headerBg: string;
  }
> = {
  LEAD: {
    labelEn: "Leads",
    labelAr: "العملاء المحتملون",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    headerBg: "bg-slate-100",
  },
  QUALIFIED: {
    labelEn: "Qualified",
    labelAr: "المؤهلون",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    headerBg: "bg-blue-100",
  },
  PROPOSAL: {
    labelEn: "Proposal",
    labelAr: "العروض",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    headerBg: "bg-amber-100",
  },
  NEGOTIATION: {
    labelEn: "Negotiation",
    labelAr: "التفاوض",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    headerBg: "bg-emerald-100",
  },
  WON: {
    labelEn: "Won",
    labelAr: "تم الفوز",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    headerBg: "bg-green-100",
  },
  LOST: {
    labelEn: "Lost",
    labelAr: "خسارة",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    headerBg: "bg-red-100",
  },
};

export function KanbanColumn({ status, deals, onDealClick }: KanbanColumnProps) {
  const locale = useLocale();
  const config = COLUMN_CONFIG[status];

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const dealIds = deals.map((deal) => deal.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[300px] max-w-[300px] rounded-lg border",
        config.bgColor,
        config.borderColor,
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 rounded-t-lg",
          config.headerBg
        )}
      >
        <h3 className="font-semibold text-sm">
          {locale === "ar" ? config.labelAr : config.labelEn}
        </h3>
        <span className="text-xs font-medium bg-white px-2 py-1 rounded-full">
          {deals.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <SortableDealCard
              key={deal.id}
              id={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal)}
            />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {locale === "ar" ? "لا توجد صفقات" : "No deals"}
          </div>
        )}
      </div>
    </div>
  );
}

export { COLUMN_CONFIG };
