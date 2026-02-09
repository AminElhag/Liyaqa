import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { HeartPulse, Users, Wallet, CreditCard, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PlatformHealth, HealthAlert } from "@/types";

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
  if (score >= 80) return locale === "ar" ? "\u0645\u0645\u062a\u0627\u0632" : "Excellent";
  if (score >= 60) return locale === "ar" ? "\u062c\u064a\u062f" : "Good";
  if (score >= 40) return locale === "ar" ? "\u0645\u062a\u0648\u0633\u0637" : "Fair";
  return locale === "ar" ? "\u064a\u062d\u062a\u0627\u062c \u0627\u0647\u062a\u0645\u0627\u0645" : "Needs Attention";
}

function getStatusColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

/**
 * Simple radial gauge component (inline SVG)
 */
function RadialGauge({
  value,
  size = 80,
  strokeWidth = 8,
  color,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{Math.round(value)}</span>
      </div>
    </div>
  );
}

export function ClientHealthMatrix({ health, isLoading }: ClientHealthMatrixProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const isRtl = locale === "ar";

  const texts = {
    title: locale === "ar" ? "\u0635\u062d\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621" : "Client Health",
    alerts: locale === "ar" ? "\u062a\u0646\u0628\u064a\u0647\u0627\u062a" : "Alerts",
    viewDetails: locale === "ar" ? "\u0639\u0631\u0636 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644" : "View Details",
  };

  if (isLoading) {
    return <ClientHealthMatrixSkeleton />;
  }

  const metrics: HealthMetric[] = [
    {
      id: "client",
      labelEn: "Client Health",
      labelAr: "\u0635\u062d\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
      value: health?.clientHealthScore || 0,
      icon: Users,
      color: "#3b82f6",
    },
    {
      id: "payment",
      labelEn: "Payment Health",
      labelAr: "\u0635\u062d\u0629 \u0627\u0644\u062f\u0641\u0639",
      value: health?.paymentHealthScore || 0,
      icon: Wallet,
      color: "#10b981",
    },
    {
      id: "subscription",
      labelEn: "Subscription",
      labelAr: "\u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643\u0627\u062a",
      value: health?.subscriptionHealthScore || 0,
      icon: CreditCard,
      color: "#8b5cf6",
    },
    {
      id: "overall",
      labelEn: "Overall",
      labelAr: "\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a",
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
            {alert.count} {locale === "ar" ? "\u0639\u0646\u0635\u0631" : "items"}
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
