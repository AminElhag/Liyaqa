"use client";

import { useLocale } from "next-intl";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, Clock, MapPin, QrCode, User, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCheckInHistory, useVisitStats, useActiveCheckIn, useCheckOutMember } from "@/queries/use-check-ins";
import type { CheckInMethod } from "@/lib/api/check-ins";

interface CheckInHistoryProps {
  memberId: string;
}

const methodLabels: Record<CheckInMethod, { en: string; ar: string; icon: React.ReactNode }> = {
  QR_CODE: { en: "QR Code", ar: "رمز QR", icon: <QrCode className="h-3 w-3" /> },
  MEMBER_ID: { en: "Member ID", ar: "رقم العضوية", icon: <User className="h-3 w-3" /> },
  PHONE: { en: "Phone", ar: "الهاتف", icon: <User className="h-3 w-3" /> },
  RFID_CARD: { en: "RFID Card", ar: "بطاقة RFID", icon: <User className="h-3 w-3" /> },
  MANUAL: { en: "Manual", ar: "يدوي", icon: <User className="h-3 w-3" /> },
  BIOMETRIC: { en: "Biometric", ar: "بيومتري", icon: <User className="h-3 w-3" /> },
};

export function CheckInHistory({ memberId }: CheckInHistoryProps) {
  const locale = useLocale();
  const { data: history, isLoading: historyLoading } = useCheckInHistory(memberId, { page: 0, size: 10 });
  const { data: stats, isLoading: statsLoading } = useVisitStats(memberId);
  const { data: activeCheckIn } = useActiveCheckIn(memberId);
  const checkOutMutation = useCheckOutMember();

  const texts = {
    title: locale === "ar" ? "سجل الحضور" : "Check-In History",
    visitStats: locale === "ar" ? "إحصائيات الزيارات" : "Visit Statistics",
    totalVisits: locale === "ar" ? "إجمالي الزيارات" : "Total Visits",
    thisMonth: locale === "ar" ? "هذا الشهر" : "This Month",
    thisWeek: locale === "ar" ? "هذا الأسبوع" : "This Week",
    avgPerWeek: locale === "ar" ? "المتوسط الأسبوعي" : "Avg/Week",
    lastVisit: locale === "ar" ? "آخر زيارة" : "Last Visit",
    recentCheckIns: locale === "ar" ? "الحضور الأخير" : "Recent Check-Ins",
    noCheckIns: locale === "ar" ? "لا يوجد سجل حضور" : "No check-in history",
    checkOut: locale === "ar" ? "تسجيل خروج" : "Check Out",
    currentlyCheckedIn: locale === "ar" ? "مسجل حضور حالياً" : "Currently Checked In",
    duration: locale === "ar" ? "المدة" : "Duration",
  };

  if (historyLoading || statsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visit Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{texts.visitStats}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalVisits}</div>
                <div className="text-xs text-muted-foreground">{texts.totalVisits}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.visitsThisMonth}</div>
                <div className="text-xs text-muted-foreground">{texts.thisMonth}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.visitsThisWeek}</div>
                <div className="text-xs text-muted-foreground">{texts.thisWeek}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.averageVisitsPerWeek.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">{texts.avgPerWeek}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">
                  {stats.lastVisit
                    ? formatDistanceToNow(new Date(stats.lastVisit), { addSuffix: true })
                    : "-"}
                </div>
                <div className="text-xs text-muted-foreground">{texts.lastVisit}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Check-In */}
      {activeCheckIn && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <div className="font-medium text-green-700 dark:text-green-400">
                    {texts.currentlyCheckedIn}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(activeCheckIn.checkInTime), "PPp")}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkOutMutation.mutate(memberId)}
                disabled={checkOutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {texts.checkOut}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check-In History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{texts.recentCheckIns}</CardTitle>
        </CardHeader>
        <CardContent>
          {history?.content && history.content.length > 0 ? (
            <div className="space-y-3">
              {history.content.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {methodLabels[checkIn.method].icon}
                      <span>{methodLabels[checkIn.method][locale as "en" | "ar"]}</span>
                    </div>
                    {checkIn.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{checkIn.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(checkIn.checkInTime), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(checkIn.checkInTime), "h:mm a")}</span>
                    </div>
                    {checkIn.duration && (
                      <Badge variant="secondary">{checkIn.duration}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">{texts.noCheckIns}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
