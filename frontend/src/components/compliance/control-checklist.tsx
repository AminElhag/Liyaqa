"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ControlImplementation, ControlStatus } from "@/types/compliance";

interface ControlChecklistProps {
  controls: ControlImplementation[];
  isArabic?: boolean;
  onStatusChange?: (id: string, status: ControlStatus) => void;
  onUploadEvidence?: (requirementId: string) => void;
}

const statusIcons: Record<ControlStatus, React.ReactNode> = {
  NOT_IMPLEMENTED: <Circle className="h-4 w-4 text-muted-foreground" />,
  IN_PROGRESS: <Clock className="h-4 w-4 text-yellow-500" />,
  IMPLEMENTED: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  NOT_APPLICABLE: <MinusCircle className="h-4 w-4 text-slate-400" />,
};

const statusLabels: Record<ControlStatus, { en: string; ar: string }> = {
  NOT_IMPLEMENTED: { en: "Not Started", ar: "لم يبدأ" },
  IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ" },
  IMPLEMENTED: { en: "Implemented", ar: "مُنفَّذ" },
  NOT_APPLICABLE: { en: "N/A", ar: "غير قابل للتطبيق" },
};

const statusColors: Record<ControlStatus, string> = {
  NOT_IMPLEMENTED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  IMPLEMENTED: "bg-green-100 text-green-800",
  NOT_APPLICABLE: "bg-slate-100 text-slate-500",
};

export function ControlChecklist({
  controls,
  isArabic = false,
  onStatusChange,
  onUploadEvidence,
}: ControlChecklistProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (controls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isArabic ? "لا توجد ضوابط" : "No controls found"}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {controls.map((control) => {
        const isExpanded = expandedIds.has(control.id);
        const label = statusLabels[control.status];

        return (
          <div key={control.id} className="border rounded-lg">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
              onClick={() => toggleExpand(control.id)}
            >
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                {statusIcons[control.status]}
                <div>
                  <span className="font-medium text-sm">
                    {control.requirementCode}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {control.requirementTitle}
                  </span>
                </div>
              </div>
              <Badge className={statusColors[control.status]}>
                {isArabic ? label.ar : label.en}
              </Badge>
            </div>

            {isExpanded && (
              <div className="border-t p-4 bg-muted/30 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {isArabic ? "الحالة:" : "Status:"}
                  </span>
                  <Select
                    value={control.status}
                    onValueChange={(value) =>
                      onStatusChange?.(control.id, value as ControlStatus)
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_IMPLEMENTED">
                        {isArabic ? "لم يبدأ" : "Not Started"}
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS">
                        {isArabic ? "قيد التنفيذ" : "In Progress"}
                      </SelectItem>
                      <SelectItem value="IMPLEMENTED">
                        {isArabic ? "مُنفَّذ" : "Implemented"}
                      </SelectItem>
                      <SelectItem value="NOT_APPLICABLE">
                        {isArabic ? "غير قابل للتطبيق" : "Not Applicable"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {control.implementationNotes && (
                  <div>
                    <span className="text-sm font-medium">
                      {isArabic ? "ملاحظات:" : "Notes:"}
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {control.implementationNotes}
                    </p>
                  </div>
                )}

                {control.nextReviewDate && (
                  <div className="text-sm">
                    <span className="font-medium">
                      {isArabic ? "المراجعة التالية:" : "Next Review:"}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(control.nextReviewDate).toLocaleDateString(
                        isArabic ? "ar-SA" : "en-US"
                      )}
                    </span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUploadEvidence?.(control.requirementId);
                  }}
                >
                  {isArabic ? "رفع دليل" : "Upload Evidence"}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
