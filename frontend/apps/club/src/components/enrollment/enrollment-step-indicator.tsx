"use client";

import { cn } from "@liyaqa/shared/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description: string;
}

interface EnrollmentStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function EnrollmentStepIndicator({
  steps,
  currentStep,
  onStepClick,
}: EnrollmentStepIndicatorProps) {
  return (
    <nav aria-label="Enrollment progress" className="w-full">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isClickable = index < currentStep;

          return (
            <li key={index} className="flex flex-1 items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(index)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start transition-colors",
                  isClickable && "cursor-pointer hover:bg-muted",
                  !isClickable && !isActive && "cursor-default opacity-50"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isActive && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                    !isCompleted && !isActive && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className={cn(
                    "truncate text-sm font-medium",
                    isActive && "text-foreground",
                    !isActive && "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 hidden h-px flex-1 sm:block",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
