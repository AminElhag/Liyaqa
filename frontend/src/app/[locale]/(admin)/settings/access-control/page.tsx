"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DoorOpen,
  Cpu,
  MapPin,
  Clock,
  CreditCard,
  Fingerprint,
  Users,
  Activity,
} from "lucide-react";
import { useDevices, useZones, useAllOccupancies } from "@/queries/use-access-control";

export default function AccessControlDashboardPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: devicesPage, isLoading: loadingDevices } = useDevices(0, 100);
  const { data: zonesPage, isLoading: loadingZones } = useZones(0, 100);
  const { data: occupancies, isLoading: loadingOccupancy } = useAllOccupancies();

  const onlineDevices = devicesPage?.content.filter((d) => d.isOnline).length ?? 0;
  const totalDevices = devicesPage?.content.length ?? 0;
  const activeZones = zonesPage?.content.filter((z) => z.isActive).length ?? 0;
  const totalOccupancy = occupancies?.reduce((sum, o) => sum + o.currentCount, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isArabic ? "التحكم في الوصول" : "Access Control"}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? "إدارة الأجهزة والمناطق وقواعد الوصول"
            : "Manage devices, zones, and access rules"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {loadingDevices ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "الأجهزة المتصلة" : "Online Devices"}
                </CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {onlineDevices}/{totalDevices}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "أجهزة نشطة" : "devices online"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "المناطق النشطة" : "Active Zones"}
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeZones}</div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "مناطق مراقبة" : "monitored zones"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "الإشغال الحالي" : "Current Occupancy"}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOccupancy}</div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "أعضاء داخل المنشأة" : "members inside facility"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "حالة النظام" : "System Status"}
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className="bg-green-500">
                  {isArabic ? "يعمل" : "Operational"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {isArabic ? "جميع الأنظمة تعمل" : "All systems running"}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/settings/access-control/devices">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "الأجهزة" : "Devices"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "إدارة البوابات الدوارة والأجهزة البيومترية وقارئات RFID"
                  : "Manage turnstiles, biometric terminals, and RFID readers"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings/access-control/zones">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "المناطق" : "Zones"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "تحديد مناطق الوصول والسعة القصوى"
                  : "Define access zones and maximum capacity"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings/access-control/rules">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "قواعد الوقت" : "Time Rules"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "تحديد أوقات السماح والحظر للوصول"
                  : "Configure allowed and restricted access times"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Zone Occupancy Overview */}
      {loadingOccupancy || loadingZones ? (
        <Skeleton className="h-64" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? "إشغال المناطق" : "Zone Occupancy"}</CardTitle>
            <CardDescription>
              {isArabic ? "الإشغال الحالي لكل منطقة" : "Current occupancy by zone"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {zonesPage?.content
                .filter((z) => z.isActive)
                .map((zone) => {
                  const occupancy = occupancies?.find((o) => o.zoneId === zone.id);
                  const percentage = zone.maxOccupancy
                    ? Math.round(((occupancy?.currentCount ?? 0) / zone.maxOccupancy) * 100)
                    : null;

                  return (
                    <div key={zone.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {isArabic && zone.nameAr ? zone.nameAr : zone.name}
                        </span>
                        <Badge variant="outline">{zone.zoneType}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">
                          {occupancy?.currentCount ?? 0}
                        </span>
                        {zone.maxOccupancy && (
                          <span className="text-muted-foreground">
                            / {zone.maxOccupancy}
                          </span>
                        )}
                      </div>
                      {percentage !== null && (
                        <div className="mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                percentage > 90
                                  ? "bg-destructive"
                                  : percentage > 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {percentage}% {isArabic ? "ممتلئ" : "full"}
                          </p>
                        </div>
                      )}
                      {occupancy?.peakCountToday !== undefined && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {isArabic ? "الذروة اليوم:" : "Peak today:"}{" "}
                          {occupancy.peakCountToday}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
