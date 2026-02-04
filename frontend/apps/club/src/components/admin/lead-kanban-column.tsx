"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useLocale } from "next-intl";
import { cn } from "@liyaqa/shared/utils";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { ScrollArea } from "@liyaqa/shared/components/ui/scroll-area";
import { LeadKanbanCard } from "./lead-kanban-card";
import type { Lead, LeadStatus } from "@liyaqa/shared/types/lead";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@liyaqa/shared/types/lead";

interface LeadKanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onCardCall?: (lead: Lead) => void;
  onCardEmail?: (lead: Lead) => void;
  onCardScheduleTour?: (lead: Lead) => void;
  onCardClick?: (lead: Lead) => void;
}

export function LeadKanbanColumn({
  status,
  leads,
  onCardCall,
  onCardEmail,
  onCardScheduleTour,
  onCardClick,
}: LeadKanbanColumnProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const statusLabel = isArabic
    ? LEAD_STATUS_LABELS[status].ar
    : LEAD_STATUS_LABELS[status].en;

  const statusColor = LEAD_STATUS_COLORS[status];

  return (
    <div
      className={cn(
        "flex flex-col bg-muted/30 rounded-lg border min-w-[280px] w-[280px]",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs font-medium", statusColor)}>
            {statusLabel}
          </Badge>
        </div>
        <Badge variant="outline" className="text-xs">
          {leads.length}
        </Badge>
      </div>

      {/* Column Body */}
      <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
        <div
          ref={setNodeRef}
          className="p-2 space-y-2 min-h-[100px]"
        >
          <SortableContext
            items={leads.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {leads.map((lead) => (
              <LeadKanbanCard
                key={lead.id}
                lead={lead}
                onCall={onCardCall}
                onEmail={onCardEmail}
                onScheduleTour={onCardScheduleTour}
                onClick={onCardClick}
              />
            ))}
          </SortableContext>

          {leads.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {isArabic ? "لا توجد عملاء محتملين" : "No leads"}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
