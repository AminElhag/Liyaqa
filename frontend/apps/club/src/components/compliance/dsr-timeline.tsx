"use client";

import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import type { DSRStatus } from "@liyaqa/shared/types/data-protection";

interface DSRTimelineProps {
  currentStatus: DSRStatus;
  isArabic?: boolean;
}

const steps: { status: DSRStatus; label: { en: string; ar: string } }[] = [
  { status: "RECEIVED", label: { en: "Received", ar: "مستلم" } },
  { status: "IDENTITY_VERIFICATION", label: { en: "Verify Identity", ar: "التحقق من الهوية" } },
  { status: "IN_PROGRESS", label: { en: "Processing", ar: "قيد المعالجة" } },
  { status: "COMPLETED", label: { en: "Completed", ar: "مكتمل" } },
];

const statusOrder: DSRStatus[] = [
  "RECEIVED",
  "IDENTITY_VERIFICATION",
  "IN_PROGRESS",
  "COMPLETED",
];

export function DSRTimeline({ currentStatus, isArabic = false }: DSRTimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isRejected = currentStatus === "REJECTED";
  const isCancelled = currentStatus === "CANCELLED";

  if (isRejected || isCancelled) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2">
          <XCircle className={cn(
            "h-6 w-6",
            isRejected ? "text-red-500" : "text-slate-500"
          )} />
          <span className={cn(
            "font-medium",
            isRejected ? "text-red-500" : "text-slate-500"
          )}>
            {isRejected
              ? (isArabic ? "مرفوض" : "Rejected")
              : (isArabic ? "ملغى" : "Cancelled")
            }
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={step.status} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isCompleted && "bg-green-100",
                  isCurrent && "bg-blue-100",
                  isPending && "bg-muted"
                )}
              >
                {isCompleted && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {isCurrent && <Clock className="h-5 w-5 text-blue-600" />}
                {isPending && <Circle className="h-5 w-5 text-muted-foreground" />}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 text-center max-w-[80px]",
                  isCompleted && "text-green-600 font-medium",
                  isCurrent && "text-blue-600 font-medium",
                  isPending && "text-muted-foreground"
                )}
              >
                {isArabic ? step.label.ar : step.label.en}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-16 mx-2",
                  index < currentIndex ? "bg-green-500" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
