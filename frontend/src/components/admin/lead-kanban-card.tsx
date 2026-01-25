"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocale } from "next-intl";
import { Phone, Mail, Calendar, User, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/lead";
import { LEAD_PRIORITY_LABELS, LEAD_PRIORITY_COLORS, LEAD_SOURCE_LABELS } from "@/types/lead";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface LeadKanbanCardProps {
  lead: Lead;
  onCall?: (lead: Lead) => void;
  onEmail?: (lead: Lead) => void;
  onScheduleTour?: (lead: Lead) => void;
  onClick?: (lead: Lead) => void;
}

export function LeadKanbanCard({
  lead,
  onCall,
  onEmail,
  onScheduleTour,
  onClick,
}: LeadKanbanCardProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const createdAgo = formatDistanceToNow(new Date(lead.createdAt), {
    addSuffix: true,
    locale: isArabic ? ar : enUS,
  });

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header with name and priority */}
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(lead);
            }}
            className="font-medium text-sm text-start hover:text-primary transition-colors line-clamp-1"
          >
            {lead.name}
          </button>
          {lead.priority && (
            <Badge
              variant="outline"
              className={cn("text-xs shrink-0", LEAD_PRIORITY_COLORS[lead.priority])}
            >
              {isArabic
                ? LEAD_PRIORITY_LABELS[lead.priority].ar
                : LEAD_PRIORITY_LABELS[lead.priority].en}
            </Badge>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {lead.email && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>

        {/* Source and score */}
        <div className="flex items-center justify-between text-xs">
          <Badge variant="secondary" className="text-xs">
            {isArabic
              ? LEAD_SOURCE_LABELS[lead.source].ar
              : LEAD_SOURCE_LABELS[lead.source].en}
          </Badge>
          {lead.score > 0 && (
            <span className="text-muted-foreground">
              {isArabic ? "النقاط:" : "Score:"} {lead.score}
            </span>
          )}
        </div>

        {/* Assigned user */}
        {lead.assignedToUserId && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{isArabic ? "معين" : "Assigned"}</span>
          </div>
        )}

        {/* Time info */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{createdAgo}</span>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 pt-1 border-t">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCall?.(lead);
                  }}
                >
                  <Phone className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isArabic ? "اتصال" : "Call"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEmail?.(lead);
                  }}
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isArabic ? "بريد إلكتروني" : "Email"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onScheduleTour?.(lead);
                  }}
                >
                  <Calendar className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isArabic ? "جدولة جولة" : "Schedule Tour"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
