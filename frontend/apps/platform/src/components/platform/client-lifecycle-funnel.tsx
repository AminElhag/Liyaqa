"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  PlayCircle,
  ShieldCheck,
  AlertTriangle,
  UserMinus,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { cn } from "@liyaqa/shared/utils";

/**
 * Lifecycle stage type
 */
export type LifecycleStage = "TRIAL" | "ONBOARDING" | "ACTIVE" | "AT_RISK" | "CHURNED";

/**
 * Stage data
 */
export interface StageData {
  stage: LifecycleStage;
  count: number;
  previousCount?: number;
  change?: number;
}

/**
 * Lifecycle overview data
 */
export interface LifecycleOverview {
  trial: StageData;
  onboarding: StageData;
  active: StageData;
  atRisk: StageData;
  churned: StageData;
  totalClients: number;
}

/**
 * Props for ClientLifecycleFunnel
 */
interface ClientLifecycleFunnelProps {
  data?: LifecycleOverview;
  onStageClick?: (stage: LifecycleStage) => void;
  selectedStage?: LifecycleStage;
  isLoading?: boolean;
  className?: string;
}

/**
 * Stage configuration
 */
const stageConfig: Record<
  LifecycleStage,
  {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    labelEn: string;
    labelAr: string;
    descriptionEn: string;
    descriptionAr: string;
  }
> = {
  TRIAL: {
    icon: <PlayCircle className="h-5 w-5" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    labelEn: "Trial",
    labelAr: "تجربة",
    descriptionEn: "In trial period",
    descriptionAr: "في فترة التجربة",
  },
  ONBOARDING: {
    icon: <UserPlus className="h-5 w-5" />,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    labelEn: "Onboarding",
    labelAr: "تأهيل",
    descriptionEn: "Setting up",
    descriptionAr: "في مرحلة الإعداد",
  },
  ACTIVE: {
    icon: <ShieldCheck className="h-5 w-5" />,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    labelEn: "Active",
    labelAr: "نشط",
    descriptionEn: "Healthy clients",
    descriptionAr: "عملاء نشطون",
  },
  AT_RISK: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    labelEn: "At Risk",
    labelAr: "معرض للخطر",
    descriptionEn: "Needs attention",
    descriptionAr: "يحتاج انتباه",
  },
  CHURNED: {
    icon: <UserMinus className="h-5 w-5" />,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    borderColor: "border-gray-200 dark:border-gray-800",
    labelEn: "Churned",
    labelAr: "مغادر",
    descriptionEn: "Lost this month",
    descriptionAr: "خسارة هذا الشهر",
  },
};

/**
 * Change indicator component
 */
function ChangeIndicator({ change, locale }: { change?: number; locale: string }) {
  if (change === undefined || change === 0) return null;

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isPositive && "text-green-600 dark:text-green-400",
        isNegative && "text-red-600 dark:text-red-400"
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>
        {isPositive ? "+" : ""}
        {change}
      </span>
    </div>
  );
}

/**
 * Funnel stage card component
 */
function StageCard({
  stage,
  data,
  isSelected,
  onClick,
  locale,
  index,
}: {
  stage: LifecycleStage;
  data: StageData;
  isSelected: boolean;
  onClick: () => void;
  locale: string;
  index: number;
}) {
  const config = stageConfig[stage];
  const isRtl = locale === "ar";

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 min-w-[120px] flex-1",
        config.bgColor,
        isSelected ? "ring-2 ring-primary ring-offset-2" : config.borderColor,
        "hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary"
      )}
    >
      {/* Icon */}
      <div className={cn("mb-2", config.color)}>{config.icon}</div>

      {/* Count */}
      <div className="text-2xl font-bold text-foreground">{data.count}</div>

      {/* Label */}
      <div className={cn("text-sm font-medium", config.color)}>
        {isRtl ? config.labelAr : config.labelEn}
      </div>

      {/* Change indicator */}
      <ChangeIndicator change={data.change} locale={locale} />

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          layoutId="funnel-selection"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-primary"
        />
      )}
    </motion.button>
  );
}

/**
 * Arrow connector between stages
 */
function StageConnector({ isRtl }: { isRtl: boolean }) {
  return (
    <div className="flex items-center justify-center px-1">
      <ChevronRight
        className={cn(
          "h-6 w-6 text-muted-foreground/50",
          isRtl && "rotate-180"
        )}
      />
    </div>
  );
}

/**
 * Skeleton loader
 */
function FunnelSkeleton() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex flex-col items-center p-4 rounded-xl border-2 border-muted bg-muted/50 min-w-[120px] flex-1 animate-pulse"
        >
          <div className="h-5 w-5 rounded-full bg-muted-foreground/20 mb-2" />
          <div className="h-8 w-12 rounded bg-muted-foreground/20 mb-1" />
          <div className="h-4 w-16 rounded bg-muted-foreground/20" />
        </div>
      ))}
    </div>
  );
}

/**
 * ClientLifecycleFunnel Component
 * Visual funnel showing client distribution across lifecycle stages.
 */
export function ClientLifecycleFunnel({
  data,
  onStageClick,
  selectedStage,
  isLoading,
  className,
}: ClientLifecycleFunnelProps) {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const [internalSelectedStage, setInternalSelectedStage] = useState<LifecycleStage | undefined>(
    selectedStage
  );

  const activeSelection = selectedStage ?? internalSelectedStage;

  const texts = {
    title: isRtl ? "دورة حياة العميل" : "Client Lifecycle",
    subtitle: isRtl ? "توزيع العملاء عبر المراحل" : "Client distribution across stages",
    viewDetails: isRtl ? "عرض التفاصيل" : "View Details",
    total: isRtl ? "إجمالي العملاء" : "Total Clients",
  };

  const handleStageClick = (stage: LifecycleStage) => {
    setInternalSelectedStage(stage);
    if (onStageClick) {
      onStageClick(stage);
    }
  };

  const stages: LifecycleStage[] = ["TRIAL", "ONBOARDING", "ACTIVE", "AT_RISK", "CHURNED"];

  // Default data if not provided
  const defaultData: LifecycleOverview = {
    trial: { stage: "TRIAL", count: 0 },
    onboarding: { stage: "ONBOARDING", count: 0 },
    active: { stage: "ACTIVE", count: 0 },
    atRisk: { stage: "AT_RISK", count: 0 },
    churned: { stage: "CHURNED", count: 0 },
    totalClients: 0,
  };

  const lifecycleData = data ?? defaultData;

  const getStageData = (stage: LifecycleStage): StageData => {
    switch (stage) {
      case "TRIAL":
        return lifecycleData.trial;
      case "ONBOARDING":
        return lifecycleData.onboarding;
      case "ACTIVE":
        return lifecycleData.active;
      case "AT_RISK":
        return lifecycleData.atRisk;
      case "CHURNED":
        return lifecycleData.churned;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
          <div className={isRtl ? "text-right" : ""}>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {texts.title}
            </CardTitle>
            <CardDescription>{texts.subtitle}</CardDescription>
          </div>
          <div className={cn("text-right", isRtl && "text-left")}>
            <div className="text-2xl font-bold">{lifecycleData.totalClients}</div>
            <div className="text-xs text-muted-foreground">{texts.total}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <FunnelSkeleton />
        ) : (
          <div
            className={cn(
              "flex items-center gap-1 overflow-x-auto pb-2",
              isRtl && "flex-row-reverse"
            )}
          >
            {stages.map((stage, index) => (
              <div
                key={stage}
                className={cn("flex items-center", isRtl && "flex-row-reverse")}
              >
                <StageCard
                  stage={stage}
                  data={getStageData(stage)}
                  isSelected={activeSelection === stage}
                  onClick={() => handleStageClick(stage)}
                  locale={locale}
                  index={index}
                />
                {index < stages.length - 1 && <StageConnector isRtl={isRtl} />}
              </div>
            ))}
          </div>
        )}

        {/* Selected stage detail */}
        <AnimatePresence>
          {activeSelection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t"
            >
              <div
                className={cn(
                  "flex items-center justify-between",
                  isRtl && "flex-row-reverse"
                )}
              >
                <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      stageConfig[activeSelection].bgColor,
                      stageConfig[activeSelection].color
                    )}
                  >
                    {stageConfig[activeSelection].icon}
                  </div>
                  <div className={isRtl ? "text-right" : ""}>
                    <div className="font-medium">
                      {isRtl
                        ? stageConfig[activeSelection].labelAr
                        : stageConfig[activeSelection].labelEn}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isRtl
                        ? stageConfig[activeSelection].descriptionAr
                        : stageConfig[activeSelection].descriptionEn}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const routes: Record<LifecycleStage, string> = {
                      TRIAL: `/${locale}/platform/clients?status=TRIAL`,
                      ONBOARDING: `/${locale}/platform/clients?status=ONBOARDING`,
                      ACTIVE: `/${locale}/platform/clients?status=ACTIVE`,
                      AT_RISK: `/${locale}/platform/health?risk=HIGH`,
                      CHURNED: `/${locale}/platform/clients?status=CHURNED`,
                    };
                    router.push(routes[activeSelection]);
                  }}
                >
                  {texts.viewDetails}
                  <ChevronRight className={cn("h-4 w-4 ms-1", isRtl && "rotate-180")} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default ClientLifecycleFunnel;
