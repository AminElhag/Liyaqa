"use client";

import { useLocale } from "next-intl";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  CreditCard,
  CheckCircle,
  XCircle,
  Edit,
  Mail,
  MessageSquare,
  Phone,
  FileText,
  UserCheck,
  Calendar,
  Award,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useActivityTimeline, useActivitySummary } from "@liyaqa/shared/queries/use-activities";
import type { ActivityType } from "@liyaqa/shared/lib/api/activities";

interface ActivityTimelineProps {
  memberId: string;
  limit?: number;
}

const activityIcons: Record<string, React.ReactNode> = {
  STATUS_CHANGED: <AlertCircle className="h-4 w-4" />,
  SUBSCRIPTION_CREATED: <CheckCircle className="h-4 w-4 text-green-500" />,
  SUBSCRIPTION_RENEWED: <CheckCircle className="h-4 w-4 text-green-500" />,
  SUBSCRIPTION_CANCELLED: <XCircle className="h-4 w-4 text-red-500" />,
  SUBSCRIPTION_FROZEN: <AlertCircle className="h-4 w-4 text-blue-500" />,
  PROFILE_UPDATED: <Edit className="h-4 w-4 text-blue-500" />,
  PAYMENT_RECEIVED: <CreditCard className="h-4 w-4 text-green-500" />,
  PAYMENT_FAILED: <CreditCard className="h-4 w-4 text-red-500" />,
  CHECK_IN: <UserCheck className="h-4 w-4 text-green-500" />,
  CHECK_OUT: <UserCheck className="h-4 w-4 text-gray-500" />,
  EMAIL_SENT: <Mail className="h-4 w-4 text-blue-500" />,
  SMS_SENT: <MessageSquare className="h-4 w-4 text-purple-500" />,
  WHATSAPP_SENT: <MessageSquare className="h-4 w-4 text-green-500" />,
  CALL_LOGGED: <Phone className="h-4 w-4 text-blue-500" />,
  NOTE_ADDED: <FileText className="h-4 w-4 text-gray-500" />,
  CONTRACT_SIGNED: <FileText className="h-4 w-4 text-green-500" />,
  ONBOARDING_STEP_COMPLETED: <Award className="h-4 w-4 text-yellow-500" />,
  MEMBER_CREATED: <UserCheck className="h-4 w-4 text-green-500" />,
};

const activityColors: Record<string, string> = {
  STATUS_CHANGED: "bg-yellow-100 dark:bg-yellow-900/30",
  SUBSCRIPTION_CREATED: "bg-green-100 dark:bg-green-900/30",
  SUBSCRIPTION_CANCELLED: "bg-red-100 dark:bg-red-900/30",
  PAYMENT_RECEIVED: "bg-green-100 dark:bg-green-900/30",
  PAYMENT_FAILED: "bg-red-100 dark:bg-red-900/30",
  CHECK_IN: "bg-blue-100 dark:bg-blue-900/30",
  NOTE_ADDED: "bg-gray-100 dark:bg-gray-800",
};

export function ActivityTimeline({ memberId, limit = 20 }: ActivityTimelineProps) {
  const locale = useLocale();
  const { data: timeline, isLoading } = useActivityTimeline(memberId, { page: 0, size: limit });
  const { data: summary } = useActivitySummary(memberId);

  const texts = {
    title: locale === "ar" ? "سجل النشاط" : "Activity Timeline",
    noActivities: locale === "ar" ? "لا يوجد نشاط" : "No activity recorded",
    totalActivities: locale === "ar" ? "إجمالي النشاط" : "Total Activities",
    by: locale === "ar" ? "بواسطة" : "by",
    system: locale === "ar" ? "النظام" : "System",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {texts.title}
        </CardTitle>
        {summary && (
          <Badge variant="secondary">
            {summary.totalActivities} {texts.totalActivities.toLowerCase()}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {timeline?.content && timeline.content.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            {/* Timeline items */}
            <div className="space-y-4">
              {timeline.content.map((activity, index) => (
                <div key={activity.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      activityColors[activity.activityType] || "bg-muted"
                    }`}
                  >
                    {activityIcons[activity.activityType] || <Activity className="h-4 w-4" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {activity.description}
                          </p>
                        )}
                        {activity.performedByName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {texts.by} {activity.performedByName}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">{texts.noActivities}</div>
        )}
      </CardContent>
    </Card>
  );
}
