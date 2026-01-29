"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Activity,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { HealthHistoryPoint, HealthEvent } from "@/lib/api/platform/health";

/**
 * Time range options
 */
type TimeRange = 30 | 60 | 90;

/**
 * Props for HealthTrendChart
 */
interface HealthTrendChartProps {
  organizationName?: string;
  historyData?: HealthHistoryPoint[];
  currentScore?: number;
  scoreChange?: number;
  trend?: "IMPROVING" | "STABLE" | "DECLINING";
  onTimeRangeChange?: (days: TimeRange) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Score component colors
 */
const scoreComponentColors = {
  usage: "#3b82f6", // blue
  engagement: "#8b5cf6", // purple
  payment: "#10b981", // emerald
  support: "#f59e0b", // amber
};

/**
 * Trend icon component
 */
function TrendIcon({
  trend,
  className,
}: {
  trend?: "IMPROVING" | "STABLE" | "DECLINING";
  className?: string;
}) {
  switch (trend) {
    case "IMPROVING":
      return <TrendingUp className={cn("h-4 w-4 text-green-500", className)} />;
    case "DECLINING":
      return <TrendingDown className={cn("h-4 w-4 text-red-500", className)} />;
    default:
      return <Minus className={cn("h-4 w-4 text-muted-foreground", className)} />;
  }
}

/**
 * Custom tooltip component
 */
function CustomTooltip({
  active,
  payload,
  label,
  locale,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name: string; value: number; color: string }>;
  label?: string | number;
  locale: string;
  [key: string]: unknown;
}) {
  const isRtl = locale === "ar";

  if (!active || !payload || !payload.length) return null;

  const dateLabel = format(parseISO(String(label || "")), "MMM d, yyyy", {
    locale: isRtl ? ar : enUS,
  });

  const labels: Record<string, { en: string; ar: string }> = {
    overallScore: { en: "Overall", ar: "الإجمالي" },
    usageScore: { en: "Usage", ar: "الاستخدام" },
    engagementScore: { en: "Engagement", ar: "التفاعل" },
    paymentScore: { en: "Payment", ar: "الدفع" },
    supportScore: { en: "Support", ar: "الدعم" },
  };

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <div className="font-medium mb-2">{dateLabel}</div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className={cn("flex items-center justify-between gap-4", isRtl && "flex-row-reverse")}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{isRtl ? labels[entry.name]?.ar : labels[entry.name]?.en}</span>
            </div>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Event marker component
 */
function EventMarker({
  event,
  locale,
}: {
  event: HealthEvent;
  locale: string;
}) {
  const isRtl = locale === "ar";

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        event.impact === "POSITIVE" && "border-green-500 text-green-600",
        event.impact === "NEGATIVE" && "border-red-500 text-red-600",
        event.impact === "NEUTRAL" && "border-gray-500 text-gray-600"
      )}
    >
      {event.description}
    </Badge>
  );
}

/**
 * Score breakdown legend
 */
function ScoreBreakdownLegend({ locale }: { locale: string }) {
  const isRtl = locale === "ar";

  const components = [
    { key: "usage", labelEn: "Usage (40%)", labelAr: "الاستخدام (40%)", color: scoreComponentColors.usage },
    { key: "engagement", labelEn: "Engagement (25%)", labelAr: "التفاعل (25%)", color: scoreComponentColors.engagement },
    { key: "payment", labelEn: "Payment (20%)", labelAr: "الدفع (20%)", color: scoreComponentColors.payment },
    { key: "support", labelEn: "Support (15%)", labelAr: "الدعم (15%)", color: scoreComponentColors.support },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap gap-4 justify-center text-sm",
        isRtl && "flex-row-reverse"
      )}
    >
      {components.map((comp) => (
        <div
          key={comp.key}
          className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: comp.color }}
          />
          <span className="text-muted-foreground">
            {isRtl ? comp.labelAr : comp.labelEn}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader
 */
function ChartSkeleton() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
        <span className="text-sm text-muted-foreground">Loading chart...</span>
      </div>
    </div>
  );
}

/**
 * HealthTrendChart Component
 * Line chart showing health score history with component breakdown.
 */
export function HealthTrendChart({
  organizationName,
  historyData = [],
  currentScore,
  scoreChange,
  trend,
  onTimeRangeChange,
  isLoading,
  className,
}: HealthTrendChartProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [showComponents, setShowComponents] = useState(false);

  const texts = {
    title: isRtl ? "اتجاه درجة الصحة" : "Health Score Trend",
    subtitle: organizationName
      ? isRtl
        ? `تاريخ صحة ${organizationName}`
        : `${organizationName} health history`
      : isRtl
      ? "تاريخ درجة الصحة"
      : "Health score history",
    days30: isRtl ? "30 يوم" : "30 days",
    days60: isRtl ? "60 يوم" : "60 days",
    days90: isRtl ? "90 يوم" : "90 days",
    showComponents: isRtl ? "عرض المكونات" : "Show Components",
    hideComponents: isRtl ? "إخفاء المكونات" : "Hide Components",
    noData: isRtl ? "لا توجد بيانات متاحة" : "No data available",
    currentScore: isRtl ? "الدرجة الحالية" : "Current Score",
  };

  const handleTimeRangeChange = (days: TimeRange) => {
    setTimeRange(days);
    onTimeRangeChange?.(days);
  };

  // Format data for chart
  const chartData = historyData.map((point) => ({
    date: point.date,
    overallScore: point.overallScore,
    usageScore: point.usageScore,
    engagementScore: point.engagementScore,
    paymentScore: point.paymentScore,
    supportScore: point.supportScore,
  }));

  // Find events to mark on chart
  const eventsWithData = historyData
    .filter((point) => point.events && point.events.length > 0)
    .flatMap((point) =>
      (point.events || []).map((event) => ({
        ...event,
        date: point.date,
        score: point.overallScore,
      }))
    );

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
              <Activity className="h-5 w-5 text-primary" />
              {texts.title}
            </CardTitle>
            <CardDescription>{texts.subtitle}</CardDescription>
          </div>

          <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
            {/* Current score display */}
            {currentScore !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-lg bg-muted",
                  isRtl && "flex-row-reverse"
                )}
              >
                <span className="text-2xl font-bold">{currentScore}</span>
                {scoreChange !== undefined && (
                  <div
                    className={cn(
                      "flex items-center text-sm",
                      scoreChange > 0 && "text-green-600",
                      scoreChange < 0 && "text-red-600"
                    )}
                  >
                    <TrendIcon trend={trend} />
                    <span>
                      {scoreChange > 0 ? "+" : ""}
                      {scoreChange}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Time range selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Calendar className="h-4 w-4" />
                  {timeRange === 30 && texts.days30}
                  {timeRange === 60 && texts.days60}
                  {timeRange === 90 && texts.days90}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleTimeRangeChange(30)}>
                  {texts.days30}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTimeRangeChange(60)}>
                  {texts.days60}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTimeRangeChange(90)}>
                  {texts.days90}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Toggle components */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComponents(!showComponents)}
            >
              {showComponents ? texts.hideComponents : texts.showComponents}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <ChartSkeleton />
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {texts.noData}
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      format(parseISO(value), "MMM d", {
                        locale: isRtl ? ar : enUS,
                      })
                    }
                    className="text-xs"
                    reversed={isRtl}
                  />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    content={(props) => (
                      <CustomTooltip {...props} locale={locale} />
                    )}
                  />

                  {/* Threshold lines */}
                  <ReferenceLine
                    y={80}
                    stroke="#22c55e"
                    strokeDasharray="5 5"
                    strokeOpacity={0.5}
                  />
                  <ReferenceLine
                    y={60}
                    stroke="#eab308"
                    strokeDasharray="5 5"
                    strokeOpacity={0.5}
                  />
                  <ReferenceLine
                    y={40}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    strokeOpacity={0.5}
                  />

                  {/* Main overall score line */}
                  <Line
                    type="monotone"
                    dataKey="overallScore"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: "#8b5cf6" }}
                  />

                  {/* Component lines (conditional) */}
                  {showComponents && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="usageScore"
                        stroke={scoreComponentColors.usage}
                        strokeWidth={1.5}
                        strokeOpacity={0.7}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="engagementScore"
                        stroke={scoreComponentColors.engagement}
                        strokeWidth={1.5}
                        strokeOpacity={0.7}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="paymentScore"
                        stroke={scoreComponentColors.payment}
                        strokeWidth={1.5}
                        strokeOpacity={0.7}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="supportScore"
                        stroke={scoreComponentColors.support}
                        strokeWidth={1.5}
                        strokeOpacity={0.7}
                        dot={false}
                      />
                    </>
                  )}

                  {/* Event markers */}
                  {eventsWithData.map((event, index) => (
                    <ReferenceDot
                      key={index}
                      x={event.date}
                      y={event.score}
                      r={6}
                      fill={
                        event.impact === "POSITIVE"
                          ? "#22c55e"
                          : event.impact === "NEGATIVE"
                          ? "#ef4444"
                          : "#9ca3af"
                      }
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            {showComponents && (
              <div className="mt-4 pt-4 border-t">
                <ScoreBreakdownLegend locale={locale} />
              </div>
            )}

            {/* Events list */}
            {eventsWithData.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-2">
                  {isRtl ? "الأحداث" : "Events"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {eventsWithData.slice(0, 5).map((event, index) => (
                    <EventMarker key={index} event={event} locale={locale} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default HealthTrendChart;
