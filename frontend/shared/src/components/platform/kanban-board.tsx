"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useLocale } from "next-intl";
import { KanbanColumn } from "./kanban-column";
import { DealCard } from "./deal-card";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  useDealsByStatus,
  useQualifyDeal,
  useSendProposal,
  useStartNegotiation,
  useChangeDealStage,
} from "@liyaqa/shared/queries/platform/use-deals";
import type { DealSummary, DealStatus } from "@liyaqa/shared/types/platform";

interface KanbanBoardProps {
  onDealClick: (deal: DealSummary) => void;
}

// Pipeline stages shown as draggable columns
const PIPELINE_STAGES: DealStatus[] = [
  "LEAD", "CONTACTED", "DEMO_SCHEDULED", "DEMO_DONE", "PROPOSAL_SENT", "NEGOTIATION",
];

// Terminal stages shown as read-only columns below
const TERMINAL_STAGES: DealStatus[] = ["WON", "LOST", "CHURNED"];

// All stages combined (for lookups)
const ALL_STAGES: DealStatus[] = [...PIPELINE_STAGES, ...TERMINAL_STAGES];

// Map of valid drag-and-drop transitions
const VALID_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  LEAD: ["CONTACTED"],
  CONTACTED: ["DEMO_SCHEDULED", "PROPOSAL_SENT"],
  DEMO_SCHEDULED: ["DEMO_DONE"],
  DEMO_DONE: ["PROPOSAL_SENT"],
  PROPOSAL_SENT: ["NEGOTIATION"],
  NEGOTIATION: [],   // WON requires conversion wizard
  WON: [],           // terminal
  LOST: [],          // reopen via detail page
  CHURNED: [],       // reopen via detail page
};

export function KanbanBoard({ onDealClick }: KanbanBoardProps) {
  const locale = useLocale();
  const [activeDeal, setActiveDeal] = useState<DealSummary | null>(null);

  // Fetch deals for each pipeline stage
  const leadDeals = useDealsByStatus("LEAD", { size: 100 });
  const contactedDeals = useDealsByStatus("CONTACTED", { size: 100 });
  const demoScheduledDeals = useDealsByStatus("DEMO_SCHEDULED", { size: 100 });
  const demoDoneDeals = useDealsByStatus("DEMO_DONE", { size: 100 });
  const proposalDeals = useDealsByStatus("PROPOSAL_SENT", { size: 100 });
  const negotiationDeals = useDealsByStatus("NEGOTIATION", { size: 100 });

  // Fetch terminal stages
  const wonDeals = useDealsByStatus("WON", { size: 50 });
  const lostDeals = useDealsByStatus("LOST", { size: 50 });
  const churnedDeals = useDealsByStatus("CHURNED", { size: 50 });

  // Mutations for status transitions
  const qualifyDeal = useQualifyDeal();
  const sendProposal = useSendProposal();
  const startNegotiation = useStartNegotiation();
  const changeDealStage = useChangeDealStage();

  const isLoading =
    leadDeals.isLoading ||
    contactedDeals.isLoading ||
    demoScheduledDeals.isLoading ||
    demoDoneDeals.isLoading ||
    proposalDeals.isLoading ||
    negotiationDeals.isLoading ||
    wonDeals.isLoading ||
    lostDeals.isLoading ||
    churnedDeals.isLoading;

  const dealsMap: Record<DealStatus, DealSummary[]> = {
    LEAD: leadDeals.data?.content || [],
    CONTACTED: contactedDeals.data?.content || [],
    DEMO_SCHEDULED: demoScheduledDeals.data?.content || [],
    DEMO_DONE: demoDoneDeals.data?.content || [],
    PROPOSAL_SENT: proposalDeals.data?.content || [],
    NEGOTIATION: negotiationDeals.data?.content || [],
    WON: wonDeals.data?.content || [],
    LOST: lostDeals.data?.content || [],
    CHURNED: churnedDeals.data?.content || [],
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findDealById = useCallback(
    (id: string): DealSummary | undefined => {
      for (const stage of ALL_STAGES) {
        const deal = dealsMap[stage].find((d) => d.id === id);
        if (deal) return deal;
      }
      return undefined;
    },
    [dealsMap]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const deal = findDealById(active.id as string);
      if (deal) {
        setActiveDeal(deal);
      }
    },
    [findDealById]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDeal(null);

      if (!over) return;

      const dealId = active.id as string;
      const targetStatus = over.id as DealStatus;
      const deal = findDealById(dealId);

      if (!deal || deal.status === targetStatus) return;

      // Check if transition is valid
      const validTargets = VALID_TRANSITIONS[deal.status];
      if (!validTargets.includes(targetStatus)) {
        console.warn(`Invalid transition from ${deal.status} to ${targetStatus}`);
        return;
      }

      // Execute the appropriate mutation
      switch (targetStatus) {
        case "CONTACTED":
          qualifyDeal.mutate(dealId);
          break;
        case "DEMO_SCHEDULED":
          changeDealStage.mutate({ id: dealId, stage: "DEMO_SCHEDULED" });
          break;
        case "DEMO_DONE":
          changeDealStage.mutate({ id: dealId, stage: "DEMO_DONE" });
          break;
        case "PROPOSAL_SENT":
          sendProposal.mutate(dealId);
          break;
        case "NEGOTIATION":
          startNegotiation.mutate(dealId);
          break;
      }
    },
    [findDealById, qualifyDeal, sendProposal, startNegotiation, changeDealStage]
  );

  const texts = {
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    dragHint:
      locale === "ar"
        ? "اسحب الصفقات لتغيير مرحلتها"
        : "Drag deals to change their stage",
    terminalHeader:
      locale === "ar"
        ? "الصفقات المغلقة"
        : "Closed Deals",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{texts.dragHint}</p>

      {/* Pipeline columns (draggable) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              deals={dealsMap[status]}
              onDealClick={onDealClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div className="opacity-80 rotate-3">
              <DealCard deal={activeDeal} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Terminal stages (non-draggable, compact) */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {texts.terminalHeader}
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {TERMINAL_STAGES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              deals={dealsMap[status]}
              onDealClick={onDealClick}
              isDropTarget={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
