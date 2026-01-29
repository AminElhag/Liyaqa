"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Rocket,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Send,
  Phone,
  Trophy,
  Sparkles,
  Filter,
  CheckSquare,
  Square,
  MoreHorizontal,
  Download,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { OnboardingSummary, OnboardingOverview } from "@/types/platform/onboarding";

type OnboardingPhase = "GETTING_STARTED" | "CORE_SETUP" | "OPERATIONS" | "COMPLETE" | "ALL";
type StalledFilter = "ALL" | "STALLED" | "ACTIVE";

/**
 * Props for OnboardingMonitor
 */
interface OnboardingMonitorProps {
  overview?: OnboardingOverview;
  clients?: OnboardingSummary[];
  onSendReminder?: (organizationId: string) => void;
  onScheduleCall?: (organizationId: string) => void;
  onBulkReminder?: (organizationIds: string[]) => void;
  onBulkAssign?: (organizationIds: string[], assigneeId: string) => void;
  onExport?: (organizationIds: string[]) => void;
  onViewAll?: () => void;
  onClientClick?: (organizationId: string) => void;
  isLoading?: boolean;
  showBulkActions?: boolean;
  showFilters?: boolean;
  className?: string;
}

/**
 * Get progress color based on percentage
 */
function getProgressColor(percent: number): string {
  if (percent >= 80) return "bg-green-500";
  if (percent >= 50) return "bg-blue-500";
  if (percent >= 25) return "bg-amber-500";
  return "bg-slate-400";
}

/**
 * Get stalled severity
 */
function getStalledSeverity(days: number): "none" | "warning" | "critical" {
  if (days >= 14) return "critical";
  if (days >= 7) return "warning";
  return "none";
}

/**
 * Points display component
 */
function PointsDisplay({
  points,
  maxPoints,
  locale,
}: {
  points: number;
  maxPoints?: number;
  locale: string;
}) {
  const isRtl = locale === "ar";

  return (
    <div className="flex items-center gap-1">
      <Trophy className="h-3.5 w-3.5 text-amber-500" />
      <span className="font-medium text-amber-600 dark:text-amber-400">
        {points}
        {maxPoints && <span className="text-muted-foreground">/{maxPoints}</span>}
      </span>
      <span className="text-xs text-muted-foreground">
        {isRtl ? "نقطة" : "pts"}
      </span>
    </div>
  );
}

/**
 * Stalled indicator component
 */
function StalledIndicator({
  days,
  locale,
}: {
  days: number;
  locale: string;
}) {
  const isRtl = locale === "ar";
  const severity = getStalledSeverity(days);

  if (severity === "none") return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        severity === "critical" &&
          "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30",
        severity === "warning" &&
          "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {days} {isRtl ? "يوم بدون نشاط" : "days stalled"}
    </Badge>
  );
}

/**
 * Client row component
 */
function OnboardingClientRow({
  client,
  onSendReminder,
  onScheduleCall,
  onClick,
  locale,
}: {
  client: OnboardingSummary;
  onSendReminder?: (organizationId: string) => void;
  onScheduleCall?: (organizationId: string) => void;
  onClick?: (organizationId: string) => void;
  locale: string;
}) {
  const isRtl = locale === "ar";
  const progressColor = getProgressColor(client.progressPercent);

  const texts = {
    sendReminder: isRtl ? "إرسال تذكير" : "Send Reminder",
    scheduleCall: isRtl ? "جدولة مكالمة" : "Schedule Call",
    daysIn: isRtl ? "يوم في التأهيل" : "days in onboarding",
    lastActive: isRtl ? "آخر نشاط" : "Last active",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="group rounded-lg border p-3 hover:bg-muted/50 transition-colors"
    >
      <div
        className={cn(
          "flex items-center justify-between gap-4",
          isRtl && "flex-row-reverse"
        )}
      >
        {/* Left: Client info */}
        <button
          onClick={() => onClick?.(client.organizationId)}
          className={cn(
            "flex-1 flex items-center gap-3 text-left",
            isRtl && "flex-row-reverse text-right"
          )}
        >
          {/* Progress circle */}
          <div
            className={cn(
              "relative h-12 w-12 rounded-full flex items-center justify-center",
              "bg-muted border-2",
              client.progressPercent >= 80 && "border-green-500",
              client.progressPercent >= 50 && client.progressPercent < 80 && "border-blue-500",
              client.progressPercent >= 25 && client.progressPercent < 50 && "border-amber-500",
              client.progressPercent < 25 && "border-slate-400"
            )}
          >
            <span className="text-sm font-bold">{client.progressPercent}%</span>
            {client.progressPercent >= 80 && (
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-green-500" />
            )}
          </div>

          {/* Client details */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {isRtl ? client.organizationNameAr || client.organizationNameEn : client.organizationNameEn}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <PointsDisplay points={client.totalPoints} locale={locale} />
              <span>•</span>
              <span>
                {client.daysInOnboarding} {texts.daysIn}
              </span>
              {client.lastActivityAt && (
                <>
                  <span>•</span>
                  <span>
                    {texts.lastActive}:{" "}
                    {formatDistanceToNow(new Date(client.lastActivityAt), {
                      addSuffix: true,
                      locale: isRtl ? ar : enUS,
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </button>

        {/* Right: Stalled indicator + Actions */}
        <div
          className={cn(
            "flex items-center gap-2",
            isRtl && "flex-row-reverse"
          )}
        >
          <StalledIndicator days={client.stalledDays} locale={locale} />

          {/* Quick actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendReminder?.(client.organizationId);
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{texts.sendReminder}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onScheduleCall?.(client.organizationId);
                    }}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{texts.scheduleCall}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <Progress
          value={client.progressPercent}
          className="h-1.5"
          indicatorClassName={progressColor}
        />
      </div>
    </motion.div>
  );
}

/**
 * Overview stats component
 */
function OverviewStats({
  overview,
  locale,
}: {
  overview: OnboardingOverview;
  locale: string;
}) {
  const isRtl = locale === "ar";

  const stats = [
    {
      value: overview.totalInOnboarding,
      labelEn: "In Progress",
      labelAr: "قيد التقدم",
      icon: <Rocket className="h-4 w-4 text-blue-500" />,
    },
    {
      value: overview.stalledCount,
      labelEn: "Stalled",
      labelAr: "متوقف",
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      alert: overview.stalledCount > 0,
    },
    {
      value: overview.completedThisWeek,
      labelEn: "Completed (Week)",
      labelAr: "مكتمل (الأسبوع)",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    {
      value: `${Math.round(overview.averageProgress)}%`,
      labelEn: "Avg Progress",
      labelAr: "متوسط التقدم",
      icon: <Clock className="h-4 w-4 text-purple-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg bg-muted/50",
            stat.alert && "bg-amber-50 dark:bg-amber-950/30",
            isRtl && "flex-row-reverse"
          )}
        >
          {stat.icon}
          <div className={isRtl ? "text-right" : ""}>
            <div className="text-lg font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground">
              {isRtl ? stat.labelAr : stat.labelEn}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader
 */
function OnboardingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ locale }: { locale: string }) {
  const isRtl = locale === "ar";

  return (
    <div className="text-center py-8 text-muted-foreground">
      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
      <p className="font-medium">
        {isRtl ? "لا يوجد عملاء في التأهيل" : "No clients in onboarding"}
      </p>
      <p className="text-sm">
        {isRtl
          ? "جميع العملاء أكملوا عملية التأهيل"
          : "All clients have completed onboarding"}
      </p>
    </div>
  );
}

/**
 * Bulk action bar component
 */
function BulkActionBar({
  selectedCount,
  onSendReminder,
  onExport,
  onClearSelection,
  locale,
}: {
  selectedCount: number;
  onSendReminder?: () => void;
  onExport?: () => void;
  onClearSelection: () => void;
  locale: string;
}) {
  const isRtl = locale === "ar";

  const texts = {
    selected: isRtl ? "محدد" : "selected",
    sendReminders: isRtl ? "إرسال تذكيرات" : "Send Reminders",
    export: isRtl ? "تصدير" : "Export",
    clearSelection: isRtl ? "إلغاء التحديد" : "Clear Selection",
  };

  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-2 p-2 mb-3 rounded-lg bg-primary/5 border border-primary/20",
        isRtl && "flex-row-reverse"
      )}
    >
      <Badge variant="secondary" className="gap-1">
        {selectedCount} {texts.selected}
      </Badge>

      <div className={cn("flex items-center gap-1 flex-1", isRtl && "flex-row-reverse")}>
        {onSendReminder && (
          <Button variant="ghost" size="sm" onClick={onSendReminder}>
            <Send className="h-4 w-4 me-1" />
            {texts.sendReminders}
          </Button>
        )}
        {onExport && (
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 me-1" />
            {texts.export}
          </Button>
        )}
      </div>

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        {texts.clearSelection}
      </Button>
    </motion.div>
  );
}

/**
 * Filter bar component
 */
function FilterBar({
  phaseFilter,
  stalledFilter,
  onPhaseChange,
  onStalledChange,
  locale,
}: {
  phaseFilter: OnboardingPhase;
  stalledFilter: StalledFilter;
  onPhaseChange: (phase: OnboardingPhase) => void;
  onStalledChange: (stalled: StalledFilter) => void;
  locale: string;
}) {
  const isRtl = locale === "ar";

  const texts = {
    allPhases: isRtl ? "جميع المراحل" : "All Phases",
    gettingStarted: isRtl ? "البداية" : "Getting Started",
    coreSetup: isRtl ? "الإعداد الأساسي" : "Core Setup",
    operations: isRtl ? "العمليات" : "Operations",
    complete: isRtl ? "مكتمل" : "Complete",
    allStatus: isRtl ? "جميع الحالات" : "All Status",
    stalled: isRtl ? "متوقف" : "Stalled Only",
    active: isRtl ? "نشط" : "Active Only",
  };

  return (
    <div className={cn("flex items-center gap-2 mb-3 flex-wrap", isRtl && "flex-row-reverse")}>
      <Filter className="h-4 w-4 text-muted-foreground" />

      <Select value={phaseFilter} onValueChange={(v) => onPhaseChange(v as OnboardingPhase)}>
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{texts.allPhases}</SelectItem>
          <SelectItem value="GETTING_STARTED">{texts.gettingStarted}</SelectItem>
          <SelectItem value="CORE_SETUP">{texts.coreSetup}</SelectItem>
          <SelectItem value="OPERATIONS">{texts.operations}</SelectItem>
          <SelectItem value="COMPLETE">{texts.complete}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={stalledFilter} onValueChange={(v) => onStalledChange(v as StalledFilter)}>
        <SelectTrigger className="w-[130px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{texts.allStatus}</SelectItem>
          <SelectItem value="STALLED">{texts.stalled}</SelectItem>
          <SelectItem value="ACTIVE">{texts.active}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * OnboardingMonitor Component
 * Displays clients currently in onboarding with progress and quick actions.
 */
export function OnboardingMonitor({
  overview,
  clients = [],
  onSendReminder,
  onScheduleCall,
  onBulkReminder,
  onBulkAssign,
  onExport,
  onViewAll,
  onClientClick,
  isLoading,
  showBulkActions = true,
  showFilters = true,
  className,
}: OnboardingMonitorProps) {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [phaseFilter, setPhaseFilter] = useState<OnboardingPhase>("ALL");
  const [stalledFilter, setStalledFilter] = useState<StalledFilter>("ALL");

  const texts = {
    title: isRtl ? "مراقبة التأهيل" : "Onboarding Monitor",
    subtitle: isRtl ? "العملاء في مرحلة الإعداد" : "Clients currently setting up",
    viewAll: isRtl ? "عرض الكل" : "View All",
    selectAll: isRtl ? "تحديد الكل" : "Select All",
  };

  const defaultOverview: OnboardingOverview = {
    totalInOnboarding: clients.length,
    stalledCount: clients.filter((c) => c.isStalled).length,
    averageProgress:
      clients.length > 0
        ? clients.reduce((sum, c) => sum + c.progressPercent, 0) / clients.length
        : 0,
    averageCompletionDays: 0,
    completedThisWeek: 0,
    completedThisMonth: 0,
  };

  const statsData = overview ?? defaultOverview;

  // Get phase from progress percent
  const getPhase = (progress: number): OnboardingPhase => {
    if (progress >= 100) return "COMPLETE";
    if (progress >= 61) return "OPERATIONS";
    if (progress >= 31) return "CORE_SETUP";
    return "GETTING_STARTED";
  };

  // Apply filters
  const filteredClients = clients.filter((client) => {
    // Phase filter
    if (phaseFilter !== "ALL") {
      const clientPhase = getPhase(client.progressPercent);
      if (clientPhase !== phaseFilter) return false;
    }

    // Stalled filter
    if (stalledFilter === "STALLED" && !client.isStalled) return false;
    if (stalledFilter === "ACTIVE" && client.isStalled) return false;

    return true;
  });

  // Sort: stalled first, then by progress (lowest first)
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (a.isStalled && !b.isStalled) return -1;
    if (!a.isStalled && b.isStalled) return 1;
    return a.progressPercent - b.progressPercent;
  });

  // Selection handlers
  const handleSelectClient = (clientId: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(clientId);
    } else {
      newSelected.delete(clientId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sortedClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedClients.map((c) => c.organizationId)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkReminder = () => {
    onBulkReminder?.(Array.from(selectedIds));
    handleClearSelection();
  };

  const handleExport = () => {
    onExport?.(Array.from(selectedIds));
    handleClearSelection();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div
          className={cn(
            "flex items-center justify-between",
            isRtl && "flex-row-reverse"
          )}
        >
          <div className={isRtl ? "text-right" : ""}>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              {texts.title}
            </CardTitle>
            <CardDescription>{texts.subtitle}</CardDescription>
          </div>

          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              {texts.viewAll}
              <ChevronRight className={cn("h-4 w-4 ms-1", isRtl && "rotate-180")} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <OnboardingSkeleton />
        ) : clients.length === 0 ? (
          <EmptyState locale={locale} />
        ) : (
          <>
            <OverviewStats overview={statsData} locale={locale} />

            {/* Filters */}
            {showFilters && (
              <FilterBar
                phaseFilter={phaseFilter}
                stalledFilter={stalledFilter}
                onPhaseChange={setPhaseFilter}
                onStalledChange={setStalledFilter}
                locale={locale}
              />
            )}

            {/* Bulk Actions */}
            {showBulkActions && (
              <BulkActionBar
                selectedCount={selectedIds.size}
                onSendReminder={onBulkReminder ? handleBulkReminder : undefined}
                onExport={onExport ? handleExport : undefined}
                onClearSelection={handleClearSelection}
                locale={locale}
              />
            )}

            {/* Select All (when bulk actions enabled) */}
            {showBulkActions && sortedClients.length > 0 && (
              <div className={cn("flex items-center gap-2 mb-2", isRtl && "flex-row-reverse")}>
                <Checkbox
                  checked={selectedIds.size === sortedClients.length && sortedClients.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">{texts.selectAll}</span>
              </div>
            )}

            <div className="space-y-2">
              {sortedClients.slice(0, 5).map((client) => (
                <div
                  key={client.organizationId}
                  className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}
                >
                  {showBulkActions && (
                    <Checkbox
                      checked={selectedIds.has(client.organizationId)}
                      onCheckedChange={(checked) =>
                        handleSelectClient(client.organizationId, !!checked)
                      }
                    />
                  )}
                  <div className="flex-1">
                    <OnboardingClientRow
                      client={client}
                      onSendReminder={onSendReminder}
                      onScheduleCall={onScheduleCall}
                      onClick={onClientClick}
                      locale={locale}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default OnboardingMonitor;
