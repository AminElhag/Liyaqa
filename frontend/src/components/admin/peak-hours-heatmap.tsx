"use client";

import { useMemo } from "react";
import type { AttendanceByHour } from "@/types/report";

interface PeakHoursHeatmapProps {
  data: AttendanceByHour[];
  locale: string;
}

export function PeakHoursHeatmap({ data, locale }: PeakHoursHeatmapProps) {
  const { maxCheckIns, normalizedData } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.checkIns), 1);
    return {
      maxCheckIns: max,
      normalizedData: data.map((item) => ({
        ...item,
        intensity: item.checkIns / max,
      })),
    };
  }, [data]);

  // Memoize filtered data to avoid O(n) filter operations on every render
  const { morningData, afternoonData, eveningData } = useMemo(() => ({
    morningData: normalizedData.filter((d) => d.hour >= 5 && d.hour <= 11),
    afternoonData: normalizedData.filter((d) => d.hour >= 12 && d.hour <= 17),
    eveningData: normalizedData.filter((d) => d.hour >= 18 && d.hour <= 22),
  }), [normalizedData]);

  const getBackgroundColor = (intensity: number) => {
    if (intensity === 0) return "bg-neutral-100";
    if (intensity < 0.2) return "bg-blue-100";
    if (intensity < 0.4) return "bg-blue-200";
    if (intensity < 0.6) return "bg-blue-300";
    if (intensity < 0.8) return "bg-blue-400";
    return "bg-blue-500";
  };

  const getTextColor = (intensity: number) => {
    return intensity >= 0.6 ? "text-white" : "text-neutral-700";
  };

  const formatHour = (hour: number) => {
    if (locale === "ar") {
      const period = hour < 12 ? "ص" : "م";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}${period}`;
    }
    const period = hour < 12 ? "AM" : "PM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-neutral-500">
        {locale === "ar" ? "لا توجد بيانات" : "No data available"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Morning / Afternoon / Evening sections */}
      <div className="grid gap-6">
        {/* Morning: 5 AM - 11 AM */}
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-2">
            {locale === "ar" ? "الصباح" : "Morning"} (5 AM - 11 AM)
          </p>
          <div className="grid grid-cols-7 gap-2">
            {morningData.map((item) => (
                <div
                  key={item.hour}
                  className={`relative p-3 rounded-lg text-center transition-all hover:scale-105 ${getBackgroundColor(
                    item.intensity
                  )} ${getTextColor(item.intensity)}`}
                >
                  <p className="text-xs font-medium">{formatHour(item.hour)}</p>
                  <p className="text-lg font-bold">{item.checkIns}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Afternoon: 12 PM - 5 PM */}
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-2">
            {locale === "ar" ? "بعد الظهر" : "Afternoon"} (12 PM - 5 PM)
          </p>
          <div className="grid grid-cols-6 gap-2">
            {afternoonData.map((item) => (
                <div
                  key={item.hour}
                  className={`relative p-3 rounded-lg text-center transition-all hover:scale-105 ${getBackgroundColor(
                    item.intensity
                  )} ${getTextColor(item.intensity)}`}
                >
                  <p className="text-xs font-medium">{formatHour(item.hour)}</p>
                  <p className="text-lg font-bold">{item.checkIns}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Evening: 6 PM - 10 PM */}
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-2">
            {locale === "ar" ? "المساء" : "Evening"} (6 PM - 10 PM)
          </p>
          <div className="grid grid-cols-5 gap-2">
            {eveningData.map((item) => (
                <div
                  key={item.hour}
                  className={`relative p-3 rounded-lg text-center transition-all hover:scale-105 ${getBackgroundColor(
                    item.intensity
                  )} ${getTextColor(item.intensity)}`}
                >
                  <p className="text-xs font-medium">{formatHour(item.hour)}</p>
                  <p className="text-lg font-bold">{item.checkIns}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 pt-4 border-t">
        <span className="text-sm text-neutral-500">
          {locale === "ar" ? "أقل" : "Low"}
        </span>
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded bg-neutral-100" />
          <div className="w-6 h-6 rounded bg-blue-100" />
          <div className="w-6 h-6 rounded bg-blue-200" />
          <div className="w-6 h-6 rounded bg-blue-300" />
          <div className="w-6 h-6 rounded bg-blue-400" />
          <div className="w-6 h-6 rounded bg-blue-500" />
        </div>
        <span className="text-sm text-neutral-500">
          {locale === "ar" ? "أكثر" : "High"}
        </span>
      </div>
    </div>
  );
}
