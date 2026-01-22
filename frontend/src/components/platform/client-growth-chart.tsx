"use client";

import { useLocale } from "next-intl";
import {
  TrendingUp,
  TrendingDown,
  UserPlus,
  UserMinus,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ClientGrowth } from "@/types/platform";

interface ClientGrowthChartProps {
  growth: ClientGrowth;
}

export function ClientGrowthChart({ growth }: ClientGrowthChartProps) {
  const locale = useLocale();

  const isPositiveGrowth = growth.netGrowthThisMonth >= 0;
  const isPositiveRate = growth.growthRate >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === "ar" ? "نمو العملاء" : "Client Growth"}
        </CardTitle>
        <CardDescription>
          {locale === "ar"
            ? "اكتساب العملاء والاحتفاظ بهم"
            : "Client acquisition and retention"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* New Clients This Month */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <UserPlus className="h-4 w-4 text-green-500" />
              {locale === "ar" ? "عملاء جدد" : "New Clients"}
            </div>
            <div className="text-2xl font-bold text-green-600">
              +{growth.newClientsThisMonth}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {locale === "ar" ? "هذا الشهر" : "This month"}
            </div>
            {growth.newClientsLastMonth > 0 && (
              <div className="text-xs text-muted-foreground">
                {locale === "ar" ? "الشهر الماضي:" : "Last month:"}{" "}
                {growth.newClientsLastMonth}
              </div>
            )}
          </div>

          {/* Churned Clients */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <UserMinus className="h-4 w-4 text-red-500" />
              {locale === "ar" ? "عملاء مغادرون" : "Churned"}
            </div>
            <div className="text-2xl font-bold text-red-600">
              -{growth.churnedClientsThisMonth}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {locale === "ar" ? "هذا الشهر" : "This month"}
            </div>
          </div>

          {/* Net Growth */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              {locale === "ar" ? "صافي النمو" : "Net Growth"}
            </div>
            <div
              className={`text-2xl font-bold ${
                isPositiveGrowth ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositiveGrowth ? "+" : ""}
              {growth.netGrowthThisMonth}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {locale === "ar" ? "هذا الشهر" : "This month"}
            </div>
          </div>

          {/* Growth Rate */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              {isPositiveRate ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              {locale === "ar" ? "معدل النمو" : "Growth Rate"}
            </div>
            <div
              className={`text-2xl font-bold ${
                isPositiveRate ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositiveRate ? "+" : ""}
              {growth.growthRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {locale === "ar" ? "مقارنة بالشهر الماضي" : "vs last month"}
            </div>
          </div>
        </div>

        {/* Growth Bar Visual */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {locale === "ar" ? "ملخص النمو" : "Growth Summary"}
            </span>
            <span
              className={`font-medium ${
                isPositiveGrowth ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositiveGrowth ? "+" : ""}
              {growth.netGrowthThisMonth}{" "}
              {locale === "ar" ? "صافي" : "net"}
            </span>
          </div>
          <div className="flex gap-1 h-4">
            {growth.newClientsThisMonth > 0 && (
              <div
                className="bg-green-500 rounded-sm flex items-center justify-center text-white text-xs font-medium"
                style={{
                  flex: growth.newClientsThisMonth,
                  minWidth: growth.newClientsThisMonth > 0 ? "30px" : "0",
                }}
              >
                +{growth.newClientsThisMonth}
              </div>
            )}
            {growth.churnedClientsThisMonth > 0 && (
              <div
                className="bg-red-500 rounded-sm flex items-center justify-center text-white text-xs font-medium"
                style={{
                  flex: growth.churnedClientsThisMonth,
                  minWidth: growth.churnedClientsThisMonth > 0 ? "30px" : "0",
                }}
              >
                -{growth.churnedClientsThisMonth}
              </div>
            )}
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span className="text-green-600">
              {locale === "ar" ? "اكتساب" : "Acquired"}
            </span>
            <span className="text-red-600">
              {locale === "ar" ? "مغادرة" : "Churned"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
