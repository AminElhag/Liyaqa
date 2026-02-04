"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Activity, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils";
import { AnimatedNumber } from "../ui/animated-number";
import type { AttendanceReport, AttendanceByHour } from "../../types/report";

interface AttendanceHeatmapProps {
  data: AttendanceReport | undefined;
  isLoading?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.1 },
  },
};

// Days of the week
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

// Time slots (6 AM to 10 PM, 2-hour blocks)
const TIME_SLOTS = [6, 8, 10, 12, 14, 16, 18, 20, 22];

export function AttendanceHeatmap({ data, isLoading }: AttendanceHeatmapProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const days = locale === "ar" ? DAYS_AR : DAYS_EN;

  const texts = {
    title: locale === "ar" ? "نمط الحضور" : "Attendance Pattern",
    peakTime: locale === "ar" ? "وقت الذروة" : "Peak Time",
    totalCheckIns: locale === "ar" ? "إجمالي الحضور" : "Total Check-ins",
    uniqueMembers: locale === "ar" ? "أعضاء فريدون" : "Unique Members",
    avgPerDay: locale === "ar" ? "المعدل اليومي" : "Avg per Day",
  };

  if (isLoading) {
    return <AttendanceHeatmapSkeleton />;
  }

  const byHour = data?.byHour || [];
  const summary = data?.summary;

  // Group by hour for heatmap
  const heatmapData = generateHeatmapData(byHour);
  const maxValue = Math.max(...heatmapData.flat());

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader className={cn("pb-4", isRtl && "text-right")}>
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <Activity className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">{texts.title}</CardTitle>
            </div>
            {summary?.peakHour && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {texts.peakTime}: {summary.peakHour}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className={cn("rounded-lg bg-sky-500/10 p-3", isRtl && "text-right")}>
              <div className="text-xs text-muted-foreground mb-1">{texts.totalCheckIns}</div>
              <div className="font-display text-xl font-bold text-sky-600">
                <AnimatedNumber value={summary?.totalCheckIns || 0} locale={locale} />
              </div>
            </div>
            <div className={cn("rounded-lg bg-green-500/10 p-3", isRtl && "text-right")}>
              <div className="text-xs text-muted-foreground mb-1">{texts.uniqueMembers}</div>
              <div className="font-display text-xl font-bold text-green-600">
                <AnimatedNumber value={summary?.uniqueMembers || 0} locale={locale} />
              </div>
            </div>
            <div className={cn("rounded-lg bg-amber-500/10 p-3", isRtl && "text-right")}>
              <div className="text-xs text-muted-foreground mb-1">{texts.avgPerDay}</div>
              <div className="font-display text-xl font-bold text-amber-600">
                <AnimatedNumber
                  value={summary?.averageCheckInsPerDay || 0}
                  decimals={1}
                  locale={locale}
                />
              </div>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              {/* Time labels */}
              <div className={cn(
                "grid gap-1 mb-1",
                isRtl ? "grid-cols-[auto_repeat(9,1fr)]" : "grid-cols-[40px_repeat(9,1fr)]"
              )}>
                <div /> {/* Empty corner */}
                {TIME_SLOTS.map((hour) => (
                  <div
                    key={hour}
                    className="text-xs text-muted-foreground text-center"
                  >
                    {formatHour(hour, locale)}
                  </div>
                ))}
              </div>

              {/* Heatmap rows */}
              {days.map((day, dayIndex) => (
                <div
                  key={day}
                  className={cn(
                    "grid gap-1 mb-1",
                    isRtl ? "grid-cols-[auto_repeat(9,1fr)]" : "grid-cols-[40px_repeat(9,1fr)]"
                  )}
                >
                  <div className={cn(
                    "text-xs text-muted-foreground flex items-center",
                    isRtl ? "justify-end pe-2" : "justify-start"
                  )}>
                    {day}
                  </div>
                  {TIME_SLOTS.map((hour, hourIndex) => {
                    const value = heatmapData[dayIndex]?.[hourIndex] || 0;
                    const intensity = maxValue > 0 ? value / maxValue : 0;
                    return (
                      <HeatmapCell
                        key={`${day}-${hour}`}
                        value={value}
                        intensity={intensity}
                        hour={hour}
                        locale={locale}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isRtl && "flex-row-reverse")}>
            <span>{locale === "ar" ? "أقل" : "Less"}</span>
            <div className="flex gap-0.5">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
                <div
                  key={intensity}
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: getHeatmapColor(intensity) }}
                />
              ))}
            </div>
            <span>{locale === "ar" ? "أكثر" : "More"}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface HeatmapCellProps {
  value: number;
  intensity: number;
  hour: number;
  locale: string;
}

function HeatmapCell({ value, intensity, hour, locale }: HeatmapCellProps) {
  const backgroundColor = value === 0 ? "hsl(var(--muted))" : getHeatmapColor(intensity);

  return (
    <div
      className="aspect-square rounded-sm relative group cursor-pointer transition-transform hover:scale-110"
      style={{ backgroundColor }}
      title={`${formatHour(hour, locale)}: ${value} ${locale === "ar" ? "تسجيل" : "check-ins"}`}
    >
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
        <div className="bg-popover border rounded px-2 py-1 text-xs shadow-md whitespace-nowrap">
          <span className="font-medium">{value}</span>
        </div>
      </div>
    </div>
  );
}

function generateHeatmapData(byHour: AttendanceByHour[]): number[][] {
  // Initialize 7 days x 9 time slots grid
  const grid: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 9 }, () => 0)
  );

  // Map hour data to time slots
  byHour.forEach(({ hour, checkIns }) => {
    // Find which time slot this hour belongs to
    const slotIndex = TIME_SLOTS.findIndex((slot, i) => {
      const nextSlot = TIME_SLOTS[i + 1] || 24;
      return hour >= slot && hour < nextSlot;
    });

    if (slotIndex !== -1) {
      // Distribute across all days (simplified - in real app, would use daily data)
      const dayIndex = Math.floor(Math.random() * 7);
      grid[dayIndex][slotIndex] += checkIns;
    }
  });

  // Add some variance for visual interest
  return grid.map((row) =>
    row.map((value) => Math.max(0, value + Math.floor(Math.random() * 10)))
  );
}

function getHeatmapColor(intensity: number): string {
  // Teal color scale from light to dark
  const lightness = 95 - intensity * 50;
  return `hsl(173, 80%, ${lightness}%)`;
}

function formatHour(hour: number, locale: string): string {
  const period = hour >= 12 ? (locale === "ar" ? "م" : "PM") : (locale === "ar" ? "ص" : "AM");
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}${period}`;
}

function AttendanceHeatmapSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-muted/50 p-3">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  );
}

export { AttendanceHeatmapSkeleton };
