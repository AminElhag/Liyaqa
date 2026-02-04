"use client";

import { useLocale } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/utils";
import type { TaskStatus, TaskType, TaskPriority } from "@liyaqa/shared/lib/api/tasks";

interface TaskFiltersProps {
  selectedStatuses: TaskStatus[];
  onStatusChange: (statuses: TaskStatus[]) => void;
  selectedTypes: TaskType[];
  onTypeChange: (types: TaskType[]) => void;
  selectedPriorities: TaskPriority[];
  onPriorityChange: (priorities: TaskPriority[]) => void;
}

const statusOptions: { value: TaskStatus; labelEn: string; labelAr: string }[] = [
  { value: "PENDING", labelEn: "Pending", labelAr: "قيد الانتظار" },
  { value: "IN_PROGRESS", labelEn: "In Progress", labelAr: "قيد التنفيذ" },
  { value: "COMPLETED", labelEn: "Completed", labelAr: "مكتمل" },
  { value: "SNOOZED", labelEn: "Snoozed", labelAr: "مؤجل" },
  { value: "CANCELLED", labelEn: "Cancelled", labelAr: "ملغى" },
];

const typeOptions: { value: TaskType; labelEn: string; labelAr: string }[] = [
  { value: "ONBOARDING_CALL", labelEn: "Onboarding Call", labelAr: "مكالمة تأهيل" },
  { value: "RENEWAL_FOLLOWUP", labelEn: "Renewal Follow-up", labelAr: "متابعة تجديد" },
  { value: "PAYMENT_COLLECTION", labelEn: "Payment Collection", labelAr: "تحصيل دفعة" },
  { value: "RETENTION_OUTREACH", labelEn: "Retention Outreach", labelAr: "تواصل استبقاء" },
  { value: "WIN_BACK", labelEn: "Win Back", labelAr: "استعادة عميل" },
  { value: "GENERAL_FOLLOWUP", labelEn: "General Follow-up", labelAr: "متابعة عامة" },
  { value: "TOUR_SCHEDULED", labelEn: "Tour Scheduled", labelAr: "جولة مجدولة" },
  { value: "TRIAL_FOLLOWUP", labelEn: "Trial Follow-up", labelAr: "متابعة تجربة" },
  { value: "FEEDBACK_CALL", labelEn: "Feedback Call", labelAr: "مكالمة ملاحظات" },
  { value: "UPSELL_OPPORTUNITY", labelEn: "Upsell Opportunity", labelAr: "فرصة بيع إضافي" },
];

const priorityOptions: { value: TaskPriority; labelEn: string; labelAr: string; color: string }[] = [
  { value: "LOW", labelEn: "Low", labelAr: "منخفض", color: "bg-gray-100 hover:bg-gray-200" },
  { value: "MEDIUM", labelEn: "Medium", labelAr: "متوسط", color: "bg-yellow-100 hover:bg-yellow-200" },
  { value: "HIGH", labelEn: "High", labelAr: "مرتفع", color: "bg-orange-100 hover:bg-orange-200" },
  { value: "URGENT", labelEn: "Urgent", labelAr: "عاجل", color: "bg-red-100 hover:bg-red-200" },
];

export function TaskFilters({
  selectedStatuses,
  onStatusChange,
  selectedTypes,
  onTypeChange,
  selectedPriorities,
  onPriorityChange,
}: TaskFiltersProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    status: locale === "ar" ? "الحالة" : "Status",
    type: locale === "ar" ? "النوع" : "Type",
    priority: locale === "ar" ? "الأولوية" : "Priority",
    clearAll: locale === "ar" ? "مسح الكل" : "Clear All",
  };

  const toggleStatus = (status: TaskStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const toggleType = (type: TaskType) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypeChange([...selectedTypes, type]);
    }
  };

  const togglePriority = (priority: TaskPriority) => {
    if (selectedPriorities.includes(priority)) {
      onPriorityChange(selectedPriorities.filter((p) => p !== priority));
    } else {
      onPriorityChange([...selectedPriorities, priority]);
    }
  };

  const clearAll = () => {
    onStatusChange([]);
    onTypeChange([]);
    onPriorityChange([]);
  };

  const hasFilters = selectedStatuses.length > 0 || selectedTypes.length > 0 || selectedPriorities.length > 0;

  return (
    <div className="p-4 rounded-md3-lg border bg-card space-y-4">
      {/* Status Filter */}
      <div>
        <h4 className={cn("text-sm font-medium mb-2", isRtl && "text-right")}>{texts.status}</h4>
        <div className={cn("flex flex-wrap gap-2", isRtl && "flex-row-reverse")}>
          {statusOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={locale === "ar" ? option.labelAr : option.labelEn}
              selected={selectedStatuses.includes(option.value)}
              onClick={() => toggleStatus(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div>
        <h4 className={cn("text-sm font-medium mb-2", isRtl && "text-right")}>{texts.type}</h4>
        <div className={cn("flex flex-wrap gap-2", isRtl && "flex-row-reverse")}>
          {typeOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={locale === "ar" ? option.labelAr : option.labelEn}
              selected={selectedTypes.includes(option.value)}
              onClick={() => toggleType(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div>
        <h4 className={cn("text-sm font-medium mb-2", isRtl && "text-right")}>{texts.priority}</h4>
        <div className={cn("flex flex-wrap gap-2", isRtl && "flex-row-reverse")}>
          {priorityOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={locale === "ar" ? option.labelAr : option.labelEn}
              selected={selectedPriorities.includes(option.value)}
              onClick={() => togglePriority(option.value)}
              className={selectedPriorities.includes(option.value) ? option.color : undefined}
            />
          ))}
        </div>
      </div>

      {/* Clear All */}
      {hasFilters && (
        <div className={cn("pt-2 border-t", isRtl && "text-right")}>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="h-4 w-4 me-1" />
            {texts.clearAll}
          </Button>
        </div>
      )}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

function FilterChip({ label, selected, onClick, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md3-sm text-sm font-medium transition-colors",
        selected
          ? className || "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {label}
    </button>
  );
}
