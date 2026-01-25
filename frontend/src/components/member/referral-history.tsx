"use client";

import { useLocale } from "next-intl";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Users, UserCheck, Clock, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyReferrals } from "@/queries/use-referrals";
import type { ReferralStatus } from "@/types/referral";

interface ReferralHistoryProps {
  memberId: string;
}

const STATUS_LABELS: Record<ReferralStatus, { en: string; ar: string }> = {
  CLICKED: { en: "Clicked", ar: "تم النقر" },
  SIGNED_UP: { en: "Signed Up", ar: "تم التسجيل" },
  CONVERTED: { en: "Converted", ar: "محول" },
  EXPIRED: { en: "Expired", ar: "منتهي" },
};

const STATUS_COLORS: Record<ReferralStatus, string> = {
  CLICKED: "bg-blue-100 text-blue-800",
  SIGNED_UP: "bg-yellow-100 text-yellow-800",
  CONVERTED: "bg-green-100 text-green-800",
  EXPIRED: "bg-gray-100 text-gray-800",
};

const STATUS_ICONS: Record<ReferralStatus, typeof Clock> = {
  CLICKED: Clock,
  SIGNED_UP: Clock,
  CONVERTED: UserCheck,
  EXPIRED: XCircle,
};

export function ReferralHistory({ memberId }: ReferralHistoryProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const { data, isLoading } = useMyReferrals(memberId, { size: 20 });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isArabic ? "سجل الإحالات" : "Referral History"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {isArabic ? "سجل الإحالات" : "Referral History"}
        </CardTitle>
        <CardDescription>
          {isArabic
            ? "الأشخاص الذين قمت بإحالتهم"
            : "People you've referred"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data?.content && data.content.length > 0 ? (
          <div className="space-y-3">
            {data.content.map((referral) => {
              const StatusIcon = STATUS_ICONS[referral.status];

              return (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {isArabic ? "إحالة" : "Referral"} #{referral.id.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(referral.createdAt), "PP", { locale: dateLocale })}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[referral.status]}>
                    {isArabic
                      ? STATUS_LABELS[referral.status].ar
                      : STATUS_LABELS[referral.status].en}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isArabic
                ? "لم تقم بإحالة أي شخص بعد"
                : "You haven't referred anyone yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isArabic
                ? "شارك رابط الإحالة الخاص بك لبدء كسب المكافآت"
                : "Share your referral link to start earning rewards"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
