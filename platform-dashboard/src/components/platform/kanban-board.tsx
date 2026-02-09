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
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { DealCard } from "./deal-card";
import {
  useDealsByStatus,
  useQualifyDeal,
  useSendProposal,
  useStartNegotiation,
} from "@/hooks/use-deals";
import type { DealSummary, DealStatus } from "@/types";

interface KanbanBoardProps {
  onDealClick: (deal: DealSummary) => void;
}

// Only show these stages in the kanban (open deals)
const KANBAN_STAGES: DealStatus[] = ["LEAD", "CONTACTED", "PROPOSAL_SENT", "NEGOTIATION"];

// Map of valid transitions
const VALID_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  LEAD: ["CONTACTED"],
  CONTACTED: ["PROPOSAL_SENT"],
  DEMO_SCHEDULED: [],
  DEMO_DONE: [],
  PROPOSAL_SENT: ["NEGOTIATION"],
  NEGOTIATION: [],
  WON: [],
  LOST: [],
  CHURNED: [],
};

export function KanbanBoard({ onDealClick }: KanbanBoardProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const [activeDeal, setActiveDeal] = useState<DealSummary | null>(null);

  // Fetch deals for each stage
  const leadDeals = useDealsByStatus("LEAD", { size: 100 });
  const contactedDeals = useDealsByStatus("CONTACTED", { size: 100 });
  const proposalDeals = useDealsByStatus("PROPOSAL_SENT", { size: 100 });
  const negotiationDeals = useDealsByStatus("NEGOTIATION", { size: 100 });

  // Mutations for status transitions
  const qualifyDeal = useQualifyDeal();
  const sendProposal = useSendProposal();
  const startNegotiation = useStartNegotiation();

  const isLoading =
    leadDeals.isLoading ||
    contactedDeals.isLoading ||
    proposalDeals.isLoading ||
    negotiationDeals.isLoading;

  const dealsMap: Record<DealStatus, DealSummary[]> = {
    LEAD: leadDeals.data?.content || [],
    CONTACTED: contactedDeals.data?.content || [],
    DEMO_SCHEDULED: [],
    DEMO_DONE: [],
    PROPOSAL_SENT: proposalDeals.data?.content || [],
    NEGOTIATION: negotiationDeals.data?.content || [],
    WON: [],
    LOST: [],
    CHURNED: [],
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
      for (const stage of KANBAN_STAGES) {
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
        case "PROPOSAL_SENT":
          sendProposal.mutate(dealId);
          break;
        case "NEGOTIATION":
          startNegotiation.mutate(dealId);
          break;
      }
    },
    [findDealById, qualifyDeal, sendProposal, startNegotiation]
  );

  const texts = {
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    dragHint:
      locale === "ar"
        ? "اسحب الصفقات لتغيير مرحلتها"
        : "Drag deals to change their stage",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{texts.dragHint}</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_STAGES.map((status) => (
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
    </div>
  );
}
