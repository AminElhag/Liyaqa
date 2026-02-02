"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Users, UserCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientsSummaryResponse } from "@/types/trainer-portal";

interface ClientStatsWidgetProps {
  clients: ClientsSummaryResponse | undefined;
  isLoading?: boolean;
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
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

export function ClientStatsWidget({ clients, isLoading }: ClientStatsWidgetProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  if (isLoading || !clients) {
    return <ClientStatsWidgetSkeleton />;
  }

  const stats = [
    {
      labelEn: "Total Clients",
      labelAr: "إجمالي العملاء",
      value: clients.totalClients,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      labelEn: "Active Clients",
      labelAr: "العملاء النشطون",
      value: clients.activeClients,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      labelEn: "New This Month",
      labelAr: "جديد هذا الشهر",
      value: clients.newThisMonth,
      icon: UserPlus,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border bg-card p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold mb-4">
        {locale === "ar" ? "إحصائيات العملاء" : "Client Statistics"}
      </h3>

      <div className="space-y-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const label = locale === "ar" ? stat.labelAr : stat.labelEn;

          return (
            <motion.div
              key={index}
              custom={index}
              variants={itemVariants}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg",
                stat.bgColor,
                isRtl && "flex-row-reverse"
              )}
            >
              <div className={cn("p-2 rounded-lg bg-white", stat.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className={cn("flex-1", isRtl && "text-right")}>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function ClientStatsWidgetSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
      <div className="h-6 w-40 bg-muted rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted">
            <div className="h-9 w-9 rounded-lg bg-muted-foreground/20" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-muted-foreground/20 rounded mb-2" />
              <div className="h-6 w-16 bg-muted-foreground/20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ClientStatsWidgetSkeleton };
