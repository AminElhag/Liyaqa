"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocale } from "next-intl";
import { Calendar, DollarSign, Percent, Building2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { DealStatusBadge } from "./deal-status-badge";
import { formatCurrency, formatDate, getLocalizedText } from "@liyaqa/shared/utils";
import { cn } from "@liyaqa/shared/utils";
import type { DealSummary } from "@liyaqa/shared/types/platform";

interface DealCardProps {
  deal: DealSummary;
  onClick?: () => void;
  isDragging?: boolean;
}

export function DealCard({ deal, onClick, isDragging }: DealCardProps) {
  const locale = useLocale();

  const texts = {
    overdue: locale === "ar" ? "متأخر" : "Overdue",
    noCloseDate: locale === "ar" ? "غير محدد" : "Not set",
  };

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        isDragging && "opacity-50 shadow-lg rotate-2"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: Title + Status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm line-clamp-2">
            {getLocalizedText(deal.title, locale)}
          </h3>
          <DealStatusBadge status={deal.status} />
        </div>

        {/* Company */}
        {deal.companyName && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{deal.companyName}</span>
          </div>
        )}

        {/* Value & Probability */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span className="font-medium text-foreground">
              {formatCurrency(
                deal.estimatedValue.amount,
                deal.estimatedValue.currency,
                locale
              )}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Percent className="h-3 w-3 text-muted-foreground" />
            <span
              className={cn(
                "font-medium",
                deal.probability >= 70
                  ? "text-green-600"
                  : deal.probability >= 40
                  ? "text-amber-600"
                  : "text-slate-600"
              )}
            >
              {deal.probability}%
            </span>
          </div>
        </div>

        {/* Expected Close Date */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {deal.expectedCloseDate ? (
            <span
              className={cn(
                deal.isOverdue && "text-red-600 font-medium"
              )}
            >
              {formatDate(deal.expectedCloseDate, locale)}
              {deal.isOverdue && (
                <span className="inline-flex items-center gap-1 ms-2">
                  <AlertTriangle className="h-3 w-3" />
                  {texts.overdue}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{texts.noCloseDate}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Sortable version for drag-and-drop
interface SortableDealCardProps extends DealCardProps {
  id: string;
}

export function SortableDealCard({ id, deal, onClick }: SortableDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}
