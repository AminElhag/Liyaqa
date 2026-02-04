"use client";

import { useLocale } from "next-intl";
import { Bell, AlertTriangle } from "lucide-react";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@liyaqa/shared/components/ui/popover";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { usePendingFollowUps, useOverdueFollowUps } from "@liyaqa/shared/queries/use-leads";
import { cn } from "@liyaqa/shared/utils";
import { format, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import Link from "next/link";

interface FollowUpBadgeProps {
  className?: string;
}

export function FollowUpBadge({ className }: FollowUpBadgeProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const { data: pendingData, isLoading: pendingLoading } = usePendingFollowUps({ size: 5 });
  const { data: overdueData, isLoading: overdueLoading } = useOverdueFollowUps({ size: 5 });

  const pendingCount = pendingData?.totalElements ?? 0;
  const overdueCount = overdueData?.totalElements ?? 0;
  const totalCount = pendingCount + overdueCount;

  const isLoading = pendingLoading || overdueLoading;

  if (isLoading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (totalCount === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
        >
          {overdueCount > 0 ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          <Badge
            variant={overdueCount > 0 ? "destructive" : "default"}
            className="absolute -top-1 -end-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
          >
            {totalCount > 9 ? "9+" : totalCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">
              {isArabic ? "المتابعات" : "Follow-ups"}
            </h4>
            <Link
              href={`/${locale}/leads?view=follow-ups`}
              className="text-sm text-primary hover:underline"
            >
              {isArabic ? "عرض الكل" : "View All"}
            </Link>
          </div>

          {/* Overdue Follow-ups */}
          {overdueCount > 0 && (
            <div>
              <h5 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {isArabic ? `متأخرة (${overdueCount})` : `Overdue (${overdueCount})`}
              </h5>
              <div className="space-y-2">
                {overdueData?.content?.slice(0, 3).map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/${locale}/leads/${activity.leadId}`}
                    className="block p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <p className="text-sm font-medium truncate">
                      {activity.notes || (isArabic ? "متابعة" : "Follow-up")}
                    </p>
                    <p className="text-xs text-destructive">
                      {activity.followUpDate &&
                        format(parseISO(activity.followUpDate), "PP", { locale: dateLocale })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Pending Follow-ups */}
          {pendingCount > 0 && (
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">
                {isArabic ? `قادمة (${pendingCount})` : `Upcoming (${pendingCount})`}
              </h5>
              <div className="space-y-2">
                {pendingData?.content?.slice(0, 3).map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/${locale}/leads/${activity.leadId}`}
                    className="block p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <p className="text-sm font-medium truncate">
                      {activity.notes || (isArabic ? "متابعة" : "Follow-up")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.followUpDate &&
                        format(parseISO(activity.followUpDate), "PP", { locale: dateLocale })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
