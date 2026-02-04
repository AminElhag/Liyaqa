"use client";

import { useState, useMemo } from "react";
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
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { LeadKanbanColumn } from "./lead-kanban-column";
import { LeadKanbanCard } from "./lead-kanban-card";
import { useLeads, useTransitionLeadStatus } from "@liyaqa/shared/queries/use-leads";
import type { Lead, LeadStatus, LeadSource } from "@liyaqa/shared/types/lead";

const PIPELINE_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "TOUR_SCHEDULED",
  "TRIAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

interface LeadKanbanBoardProps {
  filterAssignee?: string;
  filterSource?: LeadSource;
  filterDateFrom?: string;
  filterDateTo?: string;
}

export function LeadKanbanBoard({
  filterAssignee,
  filterSource,
  filterDateFrom,
  filterDateTo,
}: LeadKanbanBoardProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const router = useRouter();

  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const { data, isLoading, error } = useLeads({
    size: 500, // Load all leads for kanban view
    assignedToUserId: filterAssignee,
    source: filterSource,
    createdAfter: filterDateFrom,
    createdBefore: filterDateTo,
  });

  const transitionMutation = useTransitionLeadStatus();

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

  // Group leads by status
  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      NEW: [],
      CONTACTED: [],
      TOUR_SCHEDULED: [],
      TRIAL: [],
      NEGOTIATION: [],
      WON: [],
      LOST: [],
    };

    if (data?.content) {
      for (const lead of data.content) {
        if (grouped[lead.status]) {
          grouped[lead.status].push(lead);
        }
      }
    }

    return grouped;
  }, [data?.content]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = data?.content?.find((l) => l.id === active.id);
    if (lead) {
      setActiveLead(lead);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over if needed for visual feedback
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const lead = data?.content?.find((l) => l.id === active.id);
    if (!lead) return;

    const newStatus = over.id as LeadStatus;

    // Check if status actually changed
    if (lead.status === newStatus) return;

    // Validate transition
    if (!isValidTransition(lead.status, newStatus)) {
      toast.error(
        isArabic
          ? "لا يمكن الانتقال إلى هذه الحالة"
          : "Cannot transition to this status"
      );
      return;
    }

    try {
      await transitionMutation.mutateAsync({
        id: lead.id,
        data: { status: newStatus },
      });

      toast.success(
        isArabic
          ? "تم تحديث حالة العميل المحتمل"
          : "Lead status updated"
      );
    } catch {
      toast.error(
        isArabic
          ? "فشل في تحديث الحالة"
          : "Failed to update status"
      );
    }
  };

  const isValidTransition = (from: LeadStatus, to: LeadStatus): boolean => {
    // Allow most transitions except WON/LOST backwards without explicit reopen
    const terminalStatuses: LeadStatus[] = ["WON", "LOST"];

    if (terminalStatuses.includes(from) && !terminalStatuses.includes(to)) {
      // Moving from terminal status back - may need reopen first
      return false;
    }

    return true;
  };

  const handleCardCall = (lead: Lead) => {
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, "_self");
    } else {
      toast.error(isArabic ? "لا يوجد رقم هاتف" : "No phone number available");
    }
  };

  const handleCardEmail = (lead: Lead) => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`, "_self");
    }
  };

  const handleCardScheduleTour = (lead: Lead) => {
    // Navigate to lead detail with tour scheduling
    router.push(`/${locale}/leads/${lead.id}?action=schedule-tour`);
  };

  const handleCardClick = (lead: Lead) => {
    router.push(`/${locale}/leads/${lead.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-destructive">
        {isArabic ? "حدث خطأ في تحميل البيانات" : "Error loading leads"}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STATUSES.map((status) => (
          <LeadKanbanColumn
            key={status}
            status={status}
            leads={leadsByStatus[status]}
            onCardCall={handleCardCall}
            onCardEmail={handleCardEmail}
            onCardScheduleTour={handleCardScheduleTour}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead && (
          <div className="opacity-80">
            <LeadKanbanCard lead={activeLead} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
