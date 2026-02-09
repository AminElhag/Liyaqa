import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  disabled?: boolean;
  className?: string;
}

type PresetRange = "today" | "yesterday" | "last7days" | "last30days" | "last90days" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

/**
 * Date range picker component for dashboard filtering.
 * Supports preset ranges and custom date selection.
 */
export function DateRangePicker({
  value,
  onChange,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const [preset, setPreset] = useState<PresetRange>("last30days");

  const texts = {
    selectRange: locale === "ar" ? "اختر نطاق التاريخ" : "Select date range",
    today: locale === "ar" ? "اليوم" : "Today",
    yesterday: locale === "ar" ? "أمس" : "Yesterday",
    last7days: locale === "ar" ? "آخر 7 أيام" : "Last 7 days",
    last30days: locale === "ar" ? "آخر 30 يوماً" : "Last 30 days",
    last90days: locale === "ar" ? "آخر 90 يوماً" : "Last 90 days",
    thisMonth: locale === "ar" ? "هذا الشهر" : "This month",
    lastMonth: locale === "ar" ? "الشهر الماضي" : "Last month",
    thisYear: locale === "ar" ? "هذا العام" : "This year",
    custom: locale === "ar" ? "نطاق مخصص" : "Custom range",
    clear: locale === "ar" ? "مسح" : "Clear",
    apply: locale === "ar" ? "تطبيق" : "Apply",
  };

  const dateLocale = locale === "ar" ? ar : enUS;

  const getPresetRange = (presetType: PresetRange): DateRange | undefined => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (presetType) {
      case "today":
        return { from: today, to: today };

      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { from: yesterday, to: yesterday };
      }

      case "last7days": {
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        return { from: last7, to: today };
      }

      case "last30days": {
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        return { from: last30, to: today };
      }

      case "last90days": {
        const last90 = new Date(today);
        last90.setDate(last90.getDate() - 90);
        return { from: last90, to: today };
      }

      case "thisMonth":
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: today,
        };

      case "lastMonth": {
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return { from: lastMonthStart, to: lastMonthEnd };
      }

      case "thisYear":
        return {
          from: new Date(now.getFullYear(), 0, 1),
          to: today,
        };

      case "custom":
        return value;

      default:
        return undefined;
    }
  };

  const handlePresetChange = (newPreset: PresetRange) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      const range = getPresetRange(newPreset);
      onChange(range);
    }
  };

  const handleCustomRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
      setPreset("custom");
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setPreset("last30days");
  };

  const formatDateRange = (range?: DateRange) => {
    if (!range) return texts.selectRange;

    const fromStr = format(range.from, "MMM d, yyyy", { locale: dateLocale });
    const toStr = format(range.to, "MMM d, yyyy", { locale: dateLocale });

    if (range.from.getTime() === range.to.getTime()) {
      return fromStr;
    }

    return `${fromStr} - ${toStr}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Preset Selector */}
      <Select value={preset} onValueChange={(val) => handlePresetChange(val as PresetRange)}>
        <SelectTrigger className={cn("w-[180px]", locale === "ar" && "text-right")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">{texts.today}</SelectItem>
          <SelectItem value="yesterday">{texts.yesterday}</SelectItem>
          <SelectItem value="last7days">{texts.last7days}</SelectItem>
          <SelectItem value="last30days">{texts.last30days}</SelectItem>
          <SelectItem value="last90days">{texts.last90days}</SelectItem>
          <SelectItem value="thisMonth">{texts.thisMonth}</SelectItem>
          <SelectItem value="lastMonth">{texts.lastMonth}</SelectItem>
          <SelectItem value="thisYear">{texts.thisYear}</SelectItem>
          <SelectItem value="custom">{texts.custom}</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Date Picker (shown when custom preset is selected) */}
      {preset === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                "justify-start text-left font-normal min-w-[240px]",
                !value && "text-muted-foreground",
                locale === "ar" && "text-right"
              )}
            >
              <CalendarIcon className={cn("h-4 w-4", locale === "ar" ? "ml-2" : "mr-2")} />
              {formatDateRange(value)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={value ? { from: value.from, to: value.to } : undefined}
              onSelect={handleCustomRangeChange}
              numberOfMonths={2}
              locale={dateLocale}
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Display current range when not custom */}
      {preset !== "custom" && value && (
        <Button
          variant="outline"
          disabled
          className={cn(
            "justify-start text-left font-normal min-w-[240px]",
            locale === "ar" && "text-right"
          )}
        >
          <CalendarIcon className={cn("h-4 w-4", locale === "ar" ? "ml-2" : "mr-2")} />
          {formatDateRange(value)}
        </Button>
      )}

      {/* Clear Button */}
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          disabled={disabled}
          className="h-9 w-9"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{texts.clear}</span>
        </Button>
      )}
    </div>
  );
}
