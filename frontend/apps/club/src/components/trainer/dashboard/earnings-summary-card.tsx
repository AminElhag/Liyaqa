"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import type { EarningsSummaryResponse } from "@liyaqa/shared/types/trainer-portal";
import type { Money } from "@liyaqa/shared/types/api";

interface EarningsSummaryCardProps {
  summary: EarningsSummaryResponse | undefined;
  isLoading?: boolean;
}

interface StatItem {
  labelEn: string;
  labelAr: string;
  amount: Money | undefined;
  icon: LucideIcon;
  color: "primary" | "warning" | "success" | "info";
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
};

function formatMoney(money: Money | undefined, locale: string): string {
  if (!money) return "0";

  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: money.currency || "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(money.amount);
}

export function EarningsSummaryCard({ summary, isLoading }: EarningsSummaryCardProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  if (isLoading || !summary) {
    return <EarningsSummarySkeleton />;
  }

  const stats: StatItem[] = [
    {
      labelEn: "Total Earnings",
      labelAr: "إجمالي الأرباح",
      amount: summary.totalEarnings,
      icon: DollarSign,
      color: "primary",
    },
    {
      labelEn: "Pending",
      labelAr: "قيد الانتظار",
      amount: summary.pendingEarnings,
      icon: Clock,
      color: "warning",
    },
    {
      labelEn: "Paid",
      labelAr: "مدفوع",
      amount: summary.paidEarnings,
      icon: CheckCircle,
      color: "success",
    },
    {
      labelEn: "This Month",
      labelAr: "هذا الشهر",
      amount: summary.currentMonthEarnings,
      icon: TrendingUp,
      color: "info",
    },
  ];

  const gradientClasses: Record<string, string> = {
    primary: "from-teal-500/20 to-teal-500/10",
    warning: "from-amber-500/20 to-amber-500/10",
    success: "from-green-500/20 to-green-500/10",
    info: "from-blue-500/20 to-blue-500/10",
  };

  const iconClasses: Record<string, string> = {
    primary: "bg-teal-500 text-white",
    warning: "bg-amber-500 text-white",
    success: "bg-green-500 text-white",
    info: "bg-blue-500 text-white",
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border bg-card p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold mb-4">
        {locale === "ar" ? "ملخص الأرباح" : "Earnings Summary"}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const label = locale === "ar" ? stat.labelAr : stat.labelEn;

          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className={cn(
                "relative overflow-hidden rounded-lg p-4",
                "bg-gradient-to-br",
                gradientClasses[stat.color]
              )}
            >
              <div className={cn("flex items-start gap-3", isRtl && "flex-row-reverse")}>
                <div className={cn("p-2 rounded-lg shrink-0", iconClasses[stat.color])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className={cn("flex-1 min-w-0", isRtl && "text-right")}>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-xl font-bold truncate">
                    {formatMoney(stat.amount, locale)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function EarningsSummarySkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
      <div className="h-6 w-40 bg-muted rounded mb-4" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-muted p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted-foreground/20" />
              <div className="flex-1">
                <div className="h-3 w-16 bg-muted-foreground/20 rounded mb-2" />
                <div className="h-6 w-24 bg-muted-foreground/20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { EarningsSummarySkeleton };
