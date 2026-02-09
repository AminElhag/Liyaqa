import * as React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  icon?: React.ReactNode;
  color?: string;
}

interface WizardStepperProps {
  steps: WizardStep[];
  currentStep: number;
  locale?: string;
  onStepClick?: (stepIndex: number) => void;
  allowClickPrevious?: boolean;
  className?: string;
}

const stepColors: Record<string, string> = {
  blue: "from-blue-500 to-blue-400",
  emerald: "from-emerald-500 to-emerald-400",
  amber: "from-amber-500 to-amber-400",
  cyan: "from-cyan-500 to-cyan-400",
  violet: "from-violet-500 to-violet-400",
  purple: "from-purple-500 to-purple-400",
};

const stepBgColors: Record<string, string> = {
  blue: "bg-blue-500/20",
  emerald: "bg-emerald-500/20",
  amber: "bg-amber-500/20",
  cyan: "bg-cyan-500/20",
  violet: "bg-violet-500/20",
  purple: "bg-purple-500/20",
};

export function WizardStepper({
  steps,
  currentStep,
  locale = "en",
  onStepClick,
  allowClickPrevious = true,
  className,
}: WizardStepperProps) {
  const isRtl = locale === "ar";
  const totalSteps = steps.length;
  const progressPercent = ((currentStep) / (totalSteps - 1)) * 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Stepper */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Track */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full mx-8">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-violet-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ originX: isRtl ? 1 : 0 }}
            />
          </div>

          {/* Steps */}
          <div
            className={cn(
              "relative flex justify-between",
              isRtl && "flex-row-reverse"
            )}
          >
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              const isPending = index > currentStep;
              const canClick = allowClickPrevious && isCompleted && onStepClick;
              const color = step.color || "purple";

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center",
                    canClick && "cursor-pointer"
                  )}
                  onClick={() => canClick && onStepClick(index)}
                >
                  {/* Step Circle */}
                  <motion.div
                    className={cn(
                      "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                      isCompleted && "border-emerald-500 bg-emerald-500",
                      isActive && [
                        "border-purple-500",
                        stepBgColors[color],
                        "shadow-lg shadow-purple-500/30",
                      ],
                      isPending && "border-muted bg-background"
                    )}
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check className="w-5 h-5 text-white" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        className={cn(
                          "w-3 h-3 rounded-full bg-gradient-to-r",
                          stepColors[color]
                        )}
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </motion.div>

                  {/* Step Label */}
                  <div
                    className={cn(
                      "mt-2 text-center max-w-[100px]",
                      isRtl && "font-arabic"
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium transition-colors duration-200",
                        isCompleted && "text-emerald-600 dark:text-emerald-400",
                        isActive && "text-purple-600 dark:text-purple-400",
                        isPending && "text-muted-foreground"
                      )}
                    >
                      {isRtl && step.titleAr ? step.titleAr : step.title}
                    </p>
                    {step.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 hidden lg:block">
                        {isRtl && step.descriptionAr
                          ? step.descriptionAr
                          : step.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              "text-sm font-medium",
              isRtl && "font-arabic"
            )}
          >
            {isRtl
              ? `\u0627\u0644\u062E\u0637\u0648\u0629 ${currentStep + 1} \u0645\u0646 ${totalSteps}`
              : `Step ${currentStep + 1} of ${totalSteps}`}
          </span>
          <span
            className={cn(
              "text-sm text-muted-foreground",
              isRtl && "font-arabic"
            )}
          >
            {isRtl && steps[currentStep].titleAr
              ? steps[currentStep].titleAr
              : steps[currentStep].title}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        {/* Mobile Step Dots */}
        <div className="flex justify-center gap-2 mt-3">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;

            return (
              <motion.div
                key={step.id}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-200",
                  isCompleted && "bg-emerald-500",
                  isActive && "bg-purple-500",
                  index > currentStep && "bg-muted"
                )}
                animate={{
                  scale: isActive ? 1.3 : 1,
                }}
                transition={{ duration: 0.2 }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WizardStepper;
