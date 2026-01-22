"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  CreditCard,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";
import type { DashboardSummary, ExpiringSubscription } from "@/lib/api/dashboard";

interface SubscriptionHealthProps {
  summary: DashboardSummary | undefined;
  expiringSubscriptions: ExpiringSubscription[] | undefined;
  isLoading?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.2 },
  },
};

const COLORS = {
  active: "#22c55e",
  expiring: "#f59e0b",
  frozen: "#3b82f6",
  cancelled: "#ef4444",
};

export function SubscriptionHealth({
  summary,
  expiringSubscriptions,
  isLoading,
}: SubscriptionHealthProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    title: locale === "ar" ? "صحة الاشتراكات" : "Subscription Health",
    active: locale === "ar" ? "نشط" : "Active",
    expiring: locale === "ar" ? "قريب الانتهاء" : "Expiring",
    frozen: locale === "ar" ? "مجمد" : "Frozen",
    cancelled: locale === "ar" ? "ملغي" : "Cancelled",
    renewalRate: locale === "ar" ? "معدل التجديد" : "Renewal Rate",
    retentionRate: locale === "ar" ? "معدل الاحتفاظ" : "Retention Rate",
    expiringSoon: locale === "ar" ? "ينتهي قريباً" : "Expiring Soon",
    viewAll: locale === "ar" ? "عرض الكل" : "View All",
    day: locale === "ar" ? "يوم" : "day",
    days: locale === "ar" ? "أيام" : "days",
    renew: locale === "ar" ? "تجديد" : "Renew",
    noExpiring: locale === "ar" ? "لا توجد اشتراكات منتهية قريباً" : "No subscriptions expiring soon",
  };

  if (isLoading) {
    return <SubscriptionHealthSkeleton />;
  }

  // Calculate chart data
  const active = summary?.activeSubscriptions || 0;
  const expiring = summary?.expiringThisWeek || 0;
  const total = summary?.totalSubscriptions || 0;
  const frozen = Math.floor(total * 0.05); // Estimate 5% frozen
  const cancelled = Math.floor(total * 0.02); // Estimate 2% cancelled

  const chartData = [
    { name: texts.active, value: Math.max(0, active - expiring), color: COLORS.active },
    { name: texts.expiring, value: expiring, color: COLORS.expiring },
    { name: texts.frozen, value: frozen, color: COLORS.frozen },
    { name: texts.cancelled, value: cancelled, color: COLORS.cancelled },
  ].filter((item) => item.value > 0);

  const renewalRate = total > 0 ? ((active / total) * 100) : 100;
  const retentionRate = total > 0 ? ((total - cancelled) / total) * 100 : 100;

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader className={cn("pb-2", isRtl && "text-right")}>
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">{texts.title}</CardTitle>
            </div>
            {expiring > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {expiring}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Donut Chart */}
          <div className="h-[140px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded px-2 py-1 shadow-md">
                        <span className="text-xs font-medium">{data.name}: {data.value}</span>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="font-display text-2xl font-bold">
                  <AnimatedNumber value={active} locale={locale} />
                </span>
                <p className="text-xs text-muted-foreground">{texts.active}</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {chartData.map((item) => (
              <div
                key={item.name}
                className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bars */}
          <div className="space-y-3">
            <ProgressItem
              icon={TrendingUp}
              label={texts.renewalRate}
              value={renewalRate}
              color="bg-green-500"
              isRtl={isRtl}
            />
            <ProgressItem
              icon={RefreshCw}
              label={texts.retentionRate}
              value={retentionRate}
              color="bg-sky-500"
              isRtl={isRtl}
            />
          </div>

          {/* Expiring Soon List */}
          <div className="pt-2 border-t">
            <div className={cn(
              "flex items-center justify-between mb-2",
              isRtl && "flex-row-reverse"
            )}>
              <span className="text-sm font-medium">{texts.expiringSoon}</span>
              <Link href={`/${locale}/subscriptions?expiring=true`}>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  {texts.viewAll}
                  <ChevronRight className={cn("h-3 w-3", isRtl && "rotate-180")} />
                </Button>
              </Link>
            </div>

            {expiringSubscriptions && expiringSubscriptions.length > 0 ? (
              <div className="space-y-2">
                {expiringSubscriptions.slice(0, 3).map((sub) => (
                  <ExpiringSubscriptionItem
                    key={sub.id}
                    subscription={sub}
                    locale={locale}
                    isRtl={isRtl}
                    texts={texts}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                {texts.noExpiring}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ProgressItemProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  isRtl: boolean;
}

function ProgressItem({ icon: Icon, label, value, color, isRtl }: ProgressItemProps) {
  return (
    <div className="space-y-1">
      <div className={cn("flex items-center justify-between text-xs", isRtl && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}>
          <Icon className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-medium">{value.toFixed(1)}%</span>
      </div>
      <Progress value={value} className={cn("h-1.5", `[&>div]:${color}`)} />
    </div>
  );
}

interface ExpiringSubscriptionItemProps {
  subscription: ExpiringSubscription;
  locale: string;
  isRtl: boolean;
  texts: Record<string, string>;
}

function ExpiringSubscriptionItem({
  subscription,
  locale,
  isRtl,
  texts,
}: ExpiringSubscriptionItemProps) {
  const memberName = locale === "ar" && subscription.memberName.ar
    ? subscription.memberName.ar
    : subscription.memberName.en;
  const planName = locale === "ar" && subscription.planName.ar
    ? subscription.planName.ar
    : subscription.planName.en;

  const daysLeft = subscription.daysUntilExpiry;
  const urgency = daysLeft <= 1 ? "destructive" : daysLeft <= 3 ? "warning" : "secondary";

  return (
    <div className={cn(
      "flex items-center justify-between py-2 px-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors",
      isRtl && "flex-row-reverse"
    )}>
      <div className={cn(isRtl && "text-right")}>
        <p className="text-sm font-medium">{memberName}</p>
        <p className="text-xs text-muted-foreground">{planName}</p>
      </div>
      <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
        <Badge variant={urgency as "destructive" | "secondary"} className="text-xs">
          {daysLeft} {daysLeft === 1 ? texts.day : texts.days}
        </Badge>
      </div>
    </div>
  );
}

function SubscriptionHealthSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-8" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-[140px] w-full rounded-full mx-auto" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export { SubscriptionHealthSkeleton };
