import { useTranslation } from "react-i18next";
import {
  Users,
  Building,
  UserPlus,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Usage level type
 */
type UsageLevel = "NORMAL" | "WARNING" | "CRITICAL" | "EXCEEDED";

/**
 * Usage status for a single resource
 */
interface UsageStatus {
  label: string;
  labelAr: string;
  current: number;
  max: number;
  percentUsed: number;
  level: UsageLevel;
  icon: React.ReactNode;
}

/**
 * Client usage summary
 */
interface ClientUsageSummary {
  organizationId: string;
  organizationName: string;
  usages: {
    members: UsageStatus;
    staff: UsageStatus;
    clubs: UsageStatus;
    apiCalls?: UsageStatus;
  };
  isExceeded: boolean;
  isInGracePeriod: boolean;
  gracePeriodEnds?: string;
}

/**
 * Usage limit statistics
 */
interface UsageLimitStatistics {
  totalTracked: number;
  exceededCount: number;
  warningCount: number;
  criticalCount: number;
}

/**
 * Props for UsageWarnings component
 */
interface UsageWarningsProps {
  statistics: UsageLimitStatistics;
  clientsApproachingLimits?: ClientUsageSummary[];
  onUpgradeClick?: (organizationId: string) => void;
  onViewAllClick?: () => void;
  className?: string;
}

/**
 * Usage level configuration
 */
const levelConfig: Record<UsageLevel, { color: string; bgColor: string; label: string; labelAr: string }> = {
  NORMAL: {
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500",
    label: "Normal",
    labelAr: "\u0637\u0628\u064a\u0639\u064a",
  },
  WARNING: {
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500",
    label: "Warning",
    labelAr: "\u062a\u062d\u0630\u064a\u0631",
  },
  CRITICAL: {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500",
    label: "Critical",
    labelAr: "\u062d\u0631\u062c",
  },
  EXCEEDED: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500",
    label: "Exceeded",
    labelAr: "\u0645\u062a\u062c\u0627\u0648\u0632",
  },
};

/**
 * UsageBar component
 */
function UsageBar({
  usage,
  showLabel = true,
}: {
  usage: UsageStatus;
  showLabel?: boolean;
}) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const config = levelConfig[usage.level];

  return (
    <div>
      {showLabel && (
        <div className="flex items-center justify-between text-sm mb-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{usage.icon}</span>
            <span>{isRtl ? usage.labelAr : usage.label}</span>
          </div>
          <span className={cn("font-medium", config.color)}>
            {usage.current.toLocaleString()} / {usage.max.toLocaleString()}
          </span>
        </div>
      )}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", config.bgColor)}
          style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
        />
        {/* Warning threshold marker at 80% */}
        <div className="absolute top-0 bottom-0 w-px bg-yellow-500/50" style={{ left: "80%" }} />
      </div>
    </div>
  );
}

/**
 * UsageWarnings Component
 * Displays clients approaching or exceeding usage limits.
 */
export function UsageWarnings({
  statistics,
  clientsApproachingLimits = [],
  onUpgradeClick,
  onViewAllClick,
  className,
}: UsageWarningsProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const texts = {
    title: isRtl ? "\u062d\u062f\u0648\u062f \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645" : "Usage Limits",
    subtitle: isRtl ? "\u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0630\u064a\u0646 \u064a\u0642\u062a\u0631\u0628\u0648\u0646 \u0645\u0646 \u062d\u062f\u0648\u062f\u0647\u0645" : "Clients approaching their limits",
    exceeded: isRtl ? "\u0645\u062a\u062c\u0627\u0648\u0632" : "Exceeded",
    warning: isRtl ? "\u062a\u062d\u0630\u064a\u0631" : "Warning",
    critical: isRtl ? "\u062d\u0631\u062c" : "Critical",
    viewAll: isRtl ? "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" : "View All",
    upgrade: isRtl ? "\u062a\u0631\u0642\u064a\u0629" : "Upgrade",
    noWarnings: isRtl ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u062d\u0630\u064a\u0631\u0627\u062a" : "No warnings",
    allGood: isRtl ? "\u062c\u0645\u064a\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0636\u0645\u0646 \u0627\u0644\u062d\u062f\u0648\u062f" : "All clients within limits",
    gracePeriod: isRtl ? "\u0641\u062a\u0631\u0629 \u0627\u0644\u0633\u0645\u0627\u062d" : "Grace period",
    daysLeft: isRtl ? "\u064a\u0648\u0645 \u0645\u062a\u0628\u0642\u064a" : "days left",
    members: isRtl ? "\u0627\u0644\u0623\u0639\u0636\u0627\u0621" : "Members",
    staff: isRtl ? "\u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646" : "Staff",
    clubs: isRtl ? "\u0627\u0644\u0623\u0646\u062f\u064a\u0629" : "Clubs",
    apiCalls: isRtl ? "\u0627\u0633\u062a\u062f\u0639\u0627\u0621\u0627\u062a API" : "API Calls",
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {texts.title}
            </CardTitle>
            <CardDescription>{texts.subtitle}</CardDescription>
          </div>

          {onViewAllClick && (
            <Button variant="ghost" size="sm" onClick={onViewAllClick}>
              {texts.viewAll}
              <ChevronRight className="h-4 w-4 ms-1" />
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>{statistics.exceededCount} {texts.exceeded}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span>{statistics.criticalCount} {texts.critical}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span>{statistics.warningCount} {texts.warning}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {clientsApproachingLimits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <p className="font-medium">{texts.noWarnings}</p>
            <p className="text-sm">{texts.allGood}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientsApproachingLimits.slice(0, 5).map((client) => {
              // Determine the highest severity level
              const levels = [
                client.usages.members.level,
                client.usages.staff.level,
                client.usages.clubs.level,
              ];
              const highestSeverity = client.isExceeded
                ? "EXCEEDED"
                : levels.includes("CRITICAL")
                ? "CRITICAL"
                : levels.includes("WARNING")
                ? "WARNING"
                : "NORMAL";
              const config = levelConfig[highestSeverity];

              return (
                <div
                  key={client.organizationId}
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          client.isExceeded
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-yellow-100 dark:bg-yellow-900/30"
                        )}
                      >
                        <AlertTriangle
                          className={cn(
                            "h-4 w-4",
                            client.isExceeded ? "text-red-500" : "text-yellow-500"
                          )}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{client.organizationName}</div>
                        {client.isInGracePeriod && client.gracePeriodEnds && (
                          <div className="text-xs text-muted-foreground">
                            {texts.gracePeriod}:{" "}
                            {(() => {
                              const daysLeft = Math.ceil(
                                (new Date(client.gracePeriodEnds).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              );
                              return daysLeft;
                            })()}{" "}
                            {texts.daysLeft}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(config.color, "border-current")}
                      >
                        {isRtl ? config.labelAr : config.label}
                      </Badge>
                      {onUpgradeClick && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpgradeClick(client.organizationId)}
                        >
                          {texts.upgrade}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Usage Bars */}
                  <div className="space-y-2">
                    <UsageBar
                      usage={{
                        ...client.usages.members,
                        label: texts.members,
                        labelAr: texts.members,
                        icon: <Users className="h-4 w-4" />,
                      }}
                    />
                    <UsageBar
                      usage={{
                        ...client.usages.staff,
                        label: texts.staff,
                        labelAr: texts.staff,
                        icon: <UserPlus className="h-4 w-4" />,
                      }}
                    />
                    <UsageBar
                      usage={{
                        ...client.usages.clubs,
                        label: texts.clubs,
                        labelAr: texts.clubs,
                        icon: <Building className="h-4 w-4" />,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UsageWarnings;
