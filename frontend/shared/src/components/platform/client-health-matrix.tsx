"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { HeartPulse, Users, Wallet, CreditCard, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { RadialGauge } from "@liyaqa/shared/components/ui/radial-gauge";
import { cn } from "@liyaqa/shared/utils";
import type { PlatformHealth, HealthAlert } from "@liyaqa/shared/types/platform/dashboard";

interface ClientHealthMatrixProps {
  health: PlatformHealth | undefined;
  isLoading?: boolean;
}

interface HealthMetric {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.25 },
  },
};

const gaugeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.4 + i * 0.15, duration: 0.4 },
  }),
};

function getStatusLabel(score: number, locale: string): string {
  if (score >= 80) return locale === "ar" ? "ممتاز" : "Excellent";
  if (score >= 60) return locale === "ar" ? "جيد" : "Good";
  if (score >= 40) return locale === "ar" ? "متوسط" : "Fair";
  return locale === "ar" ? "يحتاج اهتمام" : "Needs Attention";
}

function getStatusColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

export function ClientHealthMatrix({ health, isLoading }: ClientHealthMatrixProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    title: locale === "ar" ? "صحة العملاء" : "Client Health",
    alerts: locale === "ar" ? "تنبيهات" : "Alerts",
    viewDetails: locale === "ar" ? "عرض التفاصيل" : "View Details",
  };

  if (isLoading) {
    return <ClientHealthMatrixSkeleton />;
  }

  const metrics: HealthMetric[] = [
    {
      id: "client",
      labelEn: "Client Health",
      labelAr: "صحة العملاء",
      value: health?.clientHealthScore || 0,
      icon: Users,
      color: "#3b82f6",
    },
    {
      id: "payment",
      labelEn: "Payment Health",
      labelAr: "صحة الدفع",
      value: health?.paymentHealthScore || 0,
      icon: Wallet,
      color: "#10b981",
    },
    {
      id: "subscription",
      labelEn: "Subscription",
      labelAr: "الاشتراكات",
      value: health?.subscriptionHealthScore || 0,
      icon: CreditCard,
      color: "#8b5cf6",
    },
    {
      id: "overall",
      labelEn: "Overall",
      labelAr: "الإجمالي",
      value: health?.overallHealthScore || 0,
      icon: HeartPulse,
      color: "#f59e0b",
    },
  ];

  const criticalAlerts = health?.alerts?.filter((a) => a.severity === "HIGH" || a.severity === "CRITICAL") || [];

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card className="h-full dark:border-neutral-800">
        <CardHeader className={cn("pb-3", isRtl && "text-right")}>
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <div className="p-2 rounded-lg bg-violet-500/20">
                <HeartPulse className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <CardTitle className="text-lg font-semibold">{texts.title}</CardTitle>
            </div>
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalAlerts.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 2x2 Grid of Gauges */}
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.id}
                  custom={index}
                  variants={gaugeVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center p-3 rounded-lg bg-muted/30 dark:bg-muted/10"
                >
                  <div className="flex items-center gap-1 mb-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {locale === "ar" ? metric.labelAr : metric.labelEn}
                    </span>
                  </div>
                  <RadialGauge
                    value={metric.value}
                    size={80}
                    strokeWidth={8}
                    color={getStatusColor(metric.value)}
                    showValue
                    animated
                  />
                  <span
                    className="text-xs font-medium mt-2"
                    style={{ color: getStatusColor(metric.value) }}
                  >
                    {getStatusLabel(metric.value, locale)}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Alerts Section */}
          {criticalAlerts.length > 0 && (
            <div className="pt-3 border-t dark:border-neutral-800">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {texts.alerts}
              </p>
              <div className="space-y-2">
                {criticalAlerts.slice(0, 2).map((alert, index) => (
                  <AlertItem key={index} alert={alert} locale={locale} isRtl={isRtl} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface AlertItemProps {
  alert: HealthAlert;
  locale: string;
  isRtl: boolean;
}

function AlertItem({ alert, locale, isRtl }: AlertItemProps) {
  const severityColors: Record<string, string> = {
    LOW: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    HIGH: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    CRITICAL: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-2 rounded-lg",
        severityColors[alert.severity],
        isRtl && "flex-row-reverse"
      )}
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <div className={cn("flex-1 min-w-0", isRtl && "text-right")}>
        <p className="text-xs font-medium truncate">{alert.title}</p>
        {alert.count > 0 && (
          <p className="text-xs opacity-75">
            {alert.count} {locale === "ar" ? "عنصر" : "items"}
          </p>
        )}
      </div>
    </div>
  );
}

function ClientHealthMatrixSkeleton() {
  return (
    <Card className="h-full dark:border-neutral-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center p-3 rounded-lg bg-muted/30">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-3 w-16 mt-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { ClientHealthMatrixSkeleton };
