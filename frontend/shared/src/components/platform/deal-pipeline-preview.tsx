"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { Handshake, ChevronRight, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { cn } from "@liyaqa/shared/utils";
import { AnimatedNumber, AnimatedCurrency } from "@liyaqa/shared/components/ui/animated-number";
import type { DealPipelineOverview } from "@liyaqa/shared/types/platform/dashboard";

interface DealPipelinePreviewProps {
  pipeline: DealPipelineOverview | undefined;
  isLoading?: boolean;
}

interface StageData {
  id: string;
  labelEn: string;
  labelAr: string;
  count: number;
  value: number;
  color: string;
  bgColor: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.2 },
  },
};

const stageVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.3 + i * 0.1, duration: 0.3 },
  }),
};

export function DealPipelinePreview({ pipeline, isLoading }: DealPipelinePreviewProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    title: locale === "ar" ? "خط أنابيب الصفقات" : "Deal Pipeline",
    viewAll: locale === "ar" ? "عرض الكل" : "View All",
    totalValue: locale === "ar" ? "القيمة الإجمالية" : "Total Value",
    weightedValue: locale === "ar" ? "القيمة المرجحة" : "Weighted Value",
  };

  if (isLoading) {
    return <DealPipelinePreviewSkeleton />;
  }

  const stages: StageData[] = [
    {
      id: "leads",
      labelEn: "Leads",
      labelAr: "العملاء المحتملين",
      count: pipeline?.leads || 0,
      value: (pipeline?.totalValue || 0) * 0.1,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-slate-500/10 dark:bg-slate-500/20",
    },
    {
      id: "qualified",
      labelEn: "Qualified",
      labelAr: "مؤهل",
      count: pipeline?.qualified || 0,
      value: (pipeline?.totalValue || 0) * 0.2,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    },
    {
      id: "proposal",
      labelEn: "Proposal",
      labelAr: "العرض",
      count: pipeline?.proposal || 0,
      value: (pipeline?.totalValue || 0) * 0.35,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    },
    {
      id: "negotiation",
      labelEn: "Negotiation",
      labelAr: "التفاوض",
      count: pipeline?.negotiation || 0,
      value: (pipeline?.totalValue || 0) * 0.35,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    },
  ];

  const totalDeals = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card className="dark:border-neutral-800">
        <CardHeader className={cn("pb-3", isRtl && "text-right")}>
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Handshake className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-lg font-semibold">{texts.title}</CardTitle>
              <Badge variant="secondary" className="ml-2">
                {totalDeals}
              </Badge>
            </div>
            <Link href={`/${locale}/deals`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                {texts.viewAll}
                <ChevronRight className={cn("h-3 w-3", isRtl && "rotate-180")} />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Pipeline Flow */}
          <div className={cn("flex items-stretch gap-2 overflow-x-auto pb-2", isRtl && "flex-row-reverse")}>
            {stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                custom={index}
                variants={stageVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-2 flex-1 min-w-[120px]"
              >
                <Link href={`/${locale}/deals?status=${stage.id.toUpperCase()}`} className="flex-1">
                  <div
                    className={cn(
                      "rounded-lg p-3 transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer",
                      stage.bgColor
                    )}
                  >
                    <p className={cn("text-xs font-medium mb-1", stage.color)}>
                      {locale === "ar" ? stage.labelAr : stage.labelEn}
                    </p>
                    <p className="font-display text-2xl font-bold">
                      <AnimatedNumber value={stage.count} locale={locale === "ar" ? "ar-SA" : "en-SA"} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <AnimatedCurrency
                        value={stage.value}
                        currency="SAR"
                        locale={locale === "ar" ? "ar-SA" : "en-SA"}
                        compact
                      />
                    </p>
                  </div>
                </Link>
                {index < stages.length - 1 && (
                  <ArrowRight className={cn("h-4 w-4 text-muted-foreground/50 flex-shrink-0", isRtl && "rotate-180")} />
                )}
              </motion.div>
            ))}
          </div>

          {/* Summary Row */}
          <div className={cn("flex items-center justify-between mt-4 pt-4 border-t dark:border-neutral-800", isRtl && "flex-row-reverse")}>
            <div className={cn(isRtl && "text-right")}>
              <p className="text-xs text-muted-foreground">{texts.totalValue}</p>
              <p className="font-display text-lg font-bold">
                <AnimatedCurrency
                  value={pipeline?.totalValue || 0}
                  currency="SAR"
                  locale={locale === "ar" ? "ar-SA" : "en-SA"}
                />
              </p>
            </div>
            <div className={cn(isRtl && "text-left", !isRtl && "text-right")}>
              <p className="text-xs text-muted-foreground">{texts.weightedValue}</p>
              <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">
                <AnimatedCurrency
                  value={pipeline?.weightedValue || 0}
                  currency="SAR"
                  locale={locale === "ar" ? "ar-SA" : "en-SA"}
                />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DealPipelinePreviewSkeleton() {
  return (
    <Card className="dark:border-neutral-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1">
              <Skeleton className="h-24 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export { DealPipelinePreviewSkeleton };
