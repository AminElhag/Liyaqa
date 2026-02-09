import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { Calendar, DollarSign, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DealStatusBadge } from "./deal-status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DealSummary } from "@/types";

interface DealCardProps {
  deal: DealSummary;
  onClick?: () => void;
  isDragging?: boolean;
}

export function DealCard({ deal, onClick, isDragging }: DealCardProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const texts = {
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
            {deal.facilityName || deal.contactName}
          </h3>
          <DealStatusBadge status={deal.status} />
        </div>

        {/* Facility Name */}
        {deal.facilityName && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{deal.facilityName}</span>
          </div>
        )}

        {/* Value */}
        <div className="flex items-center text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span className="font-medium text-foreground">
              {formatCurrency(deal.estimatedValue, "SAR", locale)}
            </span>
          </div>
        </div>

        {/* Expected Close Date */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {deal.expectedCloseDate ? (
            <span>{formatDate(deal.expectedCloseDate, locale)}</span>
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
