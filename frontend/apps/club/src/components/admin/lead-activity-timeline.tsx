"use client";

import { useLocale } from "next-intl";
import {
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  Users,
  MapPin,
  FileText,
  ArrowRight,
  UserPlus,
  CalendarClock,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { cn } from "@liyaqa/shared/utils";
import { format, formatDistanceToNow, isAfter, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { LeadActivity, LeadActivityType } from "@liyaqa/shared/types/lead";
import { LEAD_ACTIVITY_TYPE_LABELS } from "@liyaqa/shared/types/lead";

const ACTIVITY_ICONS: Record<LeadActivityType, React.ComponentType<{ className?: string }>> = {
  CALL: Phone,
  EMAIL: Mail,
  SMS: MessageSquare,
  WHATSAPP: MessageCircle,
  MEETING: Users,
  TOUR: MapPin,
  NOTE: FileText,
  STATUS_CHANGE: ArrowRight,
  ASSIGNMENT: UserPlus,
  FOLLOW_UP_SCHEDULED: CalendarClock,
  FOLLOW_UP_COMPLETED: CheckCircle,
};

const ACTIVITY_COLORS: Record<LeadActivityType, string> = {
  CALL: "bg-blue-100 text-blue-700 border-blue-200",
  EMAIL: "bg-purple-100 text-purple-700 border-purple-200",
  SMS: "bg-green-100 text-green-700 border-green-200",
  WHATSAPP: "bg-emerald-100 text-emerald-700 border-emerald-200",
  MEETING: "bg-indigo-100 text-indigo-700 border-indigo-200",
  TOUR: "bg-yellow-100 text-yellow-700 border-yellow-200",
  NOTE: "bg-gray-100 text-gray-700 border-gray-200",
  STATUS_CHANGE: "bg-orange-100 text-orange-700 border-orange-200",
  ASSIGNMENT: "bg-pink-100 text-pink-700 border-pink-200",
  FOLLOW_UP_SCHEDULED: "bg-cyan-100 text-cyan-700 border-cyan-200",
  FOLLOW_UP_COMPLETED: "bg-teal-100 text-teal-700 border-teal-200",
};

interface LeadActivityTimelineProps {
  activities: LeadActivity[];
  onCompleteFollowUp?: (activityId: string) => void;
  isCompletingFollowUp?: boolean;
}

export function LeadActivityTimeline({
  activities,
  onCompleteFollowUp,
  isCompletingFollowUp,
}: LeadActivityTimelineProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "الجدول الزمني للنشاطات" : "Activity Timeline"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {isArabic ? "لا توجد نشاطات بعد" : "No activities yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isFollowUpOverdue = (activity: LeadActivity): boolean => {
    if (!activity.followUpDate || activity.followUpCompleted) return false;
    return isAfter(new Date(), parseISO(activity.followUpDate));
  };

  const isFollowUpDueSoon = (activity: LeadActivity): boolean => {
    if (!activity.followUpDate || activity.followUpCompleted) return false;
    const followUpDate = parseISO(activity.followUpDate);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isAfter(followUpDate, now) && isAfter(tomorrow, followUpDate);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isArabic ? "الجدول الزمني للنشاطات" : "Activity Timeline"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute start-5 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-6">
            {activities.map((activity, index) => {
              const Icon = ACTIVITY_ICONS[activity.type];
              const colorClass = ACTIVITY_COLORS[activity.type];
              const typeLabel = LEAD_ACTIVITY_TYPE_LABELS[activity.type];
              const overdue = isFollowUpOverdue(activity);
              const dueSoon = isFollowUpDueSoon(activity);
              const hasPendingFollowUp = activity.followUpDate && !activity.followUpCompleted;

              return (
                <div key={activity.id} className="relative flex gap-4 ps-2">
                  {/* Icon */}
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-background",
                      colorClass
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1.5 pb-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={colorClass}>
                          {isArabic ? typeLabel.ar : typeLabel.en}
                        </Badge>
                        {hasPendingFollowUp && (
                          <Badge
                            variant={overdue ? "destructive" : dueSoon ? "default" : "secondary"}
                            className="flex items-center gap-1"
                          >
                            {overdue ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {isArabic ? "متابعة: " : "Follow-up: "}
                            {format(parseISO(activity.followUpDate!), "PP", { locale: dateLocale })}
                          </Badge>
                        )}
                        {activity.followUpCompleted && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 me-1" />
                            {isArabic ? "تمت المتابعة" : "Completed"}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                    </div>

                    {activity.notes && (
                      <p className="mt-2 text-sm text-foreground">{activity.notes}</p>
                    )}

                    {activity.outcome && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="font-medium">
                          {isArabic ? "النتيجة: " : "Outcome: "}
                        </span>
                        {activity.outcome}
                      </p>
                    )}

                    {activity.durationMinutes && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {isArabic
                          ? `المدة: ${activity.durationMinutes} دقيقة`
                          : `Duration: ${activity.durationMinutes} min`}
                      </p>
                    )}

                    {/* Complete Follow-up Button */}
                    {hasPendingFollowUp && onCompleteFollowUp && (
                      <Button
                        size="sm"
                        variant={overdue ? "destructive" : "outline"}
                        className="mt-2"
                        onClick={() => onCompleteFollowUp(activity.id)}
                        disabled={isCompletingFollowUp}
                      >
                        <CheckCircle className="h-3 w-3 me-1" />
                        {isArabic ? "إكمال المتابعة" : "Complete Follow-up"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
