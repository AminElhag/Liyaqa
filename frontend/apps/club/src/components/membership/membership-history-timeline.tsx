"use client";

import { useLocale } from "next-intl";
import {
  Plus,
  Snowflake,
  Sun,
  XCircle,
  RefreshCcw,
  Shuffle,
  CreditCard,
  Edit,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { useMembershipHistory } from "@liyaqa/shared/queries/use-subscriptions";
import { formatDate } from "@liyaqa/shared/utils";
import type { UUID } from "@liyaqa/shared/types/api";
import type { MembershipHistoryEventType } from "@liyaqa/shared/types/member";

interface MembershipHistoryTimelineProps {
  memberId: UUID;
}

const eventConfig: Record<
  MembershipHistoryEventType,
  {
    icon: React.ReactNode;
    color: string;
    dotColor: string;
    labelEn: string;
    labelAr: string;
  }
> = {
  CREATED: {
    icon: <Plus className="h-3.5 w-3.5" />,
    color: "text-emerald-600",
    dotColor: "bg-emerald-500",
    labelEn: "Membership Created",
    labelAr: "تم إنشاء العضوية",
  },
  FROZEN: {
    icon: <Snowflake className="h-3.5 w-3.5" />,
    color: "text-blue-600",
    dotColor: "bg-blue-500",
    labelEn: "Frozen",
    labelAr: "تم التجميد",
  },
  UNFROZEN: {
    icon: <Sun className="h-3.5 w-3.5" />,
    color: "text-yellow-600",
    dotColor: "bg-yellow-500",
    labelEn: "Unfrozen",
    labelAr: "تم إلغاء التجميد",
  },
  CANCELLED: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: "text-red-600",
    dotColor: "bg-red-500",
    labelEn: "Cancelled",
    labelAr: "تم الإلغاء",
  },
  RENEWED: {
    icon: <RefreshCcw className="h-3.5 w-3.5" />,
    color: "text-primary",
    dotColor: "bg-primary",
    labelEn: "Renewed",
    labelAr: "تم التجديد",
  },
  TRANSFERRED_OUT: {
    icon: <Shuffle className="h-3.5 w-3.5" />,
    color: "text-violet-600",
    dotColor: "bg-violet-500",
    labelEn: "Transferred Out",
    labelAr: "تم التحويل (خروج)",
  },
  TRANSFERRED_IN: {
    icon: <Shuffle className="h-3.5 w-3.5" />,
    color: "text-violet-600",
    dotColor: "bg-violet-500",
    labelEn: "Transferred In",
    labelAr: "تم التحويل (دخول)",
  },
  PAYMENT_COMPLETED: {
    icon: <CreditCard className="h-3.5 w-3.5" />,
    color: "text-emerald-600",
    dotColor: "bg-emerald-500",
    labelEn: "Payment Completed",
    labelAr: "تم الدفع",
  },
  EDITED: {
    icon: <Edit className="h-3.5 w-3.5" />,
    color: "text-muted-foreground",
    dotColor: "bg-muted-foreground",
    labelEn: "Edited",
    labelAr: "تم التعديل",
  },
};

export function MembershipHistoryTimeline({
  memberId,
}: MembershipHistoryTimelineProps) {
  const locale = useLocale();
  const { data: events = [], isLoading } = useMembershipHistory(memberId);

  const texts = {
    title: locale === "ar" ? "سجل العضوية" : "Membership History",
    noHistory: locale === "ar"
      ? "لا يوجد سجل للأحداث بعد"
      : "No membership history yet",
    noHistoryHint: locale === "ar"
      ? "ستظهر الأحداث هنا عندما تحدث تغييرات على العضويات"
      : "Events will appear here as membership changes occur",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            {texts.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          {texts.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-muted-foreground">{texts.noHistory}</p>
            <p className="text-xs text-muted-foreground mt-1">{texts.noHistoryHint}</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute start-3 top-2 bottom-2 w-px bg-border" />

            <div className="space-y-4">
              {events.map((event) => {
                const config = eventConfig[event.eventType];
                return (
                  <div key={event.id} className="relative flex gap-4 ps-0">
                    {/* Dot */}
                    <div
                      className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${config.dotColor} text-white`}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pb-1">
                      <p className={`text-sm font-medium ${config.color}`}>
                        {locale === "ar" ? config.labelAr : config.labelEn}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(event.timestamp, locale)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
