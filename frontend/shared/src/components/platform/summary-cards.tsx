"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Building2,
  CreditCard,
  Handshake,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import type { PlatformSummary } from "@liyaqa/shared/types/platform";

interface SummaryCardsProps {
  summary: PlatformSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const locale = useLocale();

  const stats = [
    {
      titleEn: "Total Clients",
      titleAr: "إجمالي العملاء",
      value: summary.totalClients,
      subValue: summary.activeClients,
      subLabelEn: "active",
      subLabelAr: "نشط",
      icon: Building2,
      href: `/${locale}/clients`,
      alert: summary.pendingClients > 0,
      alertValue: summary.pendingClients,
      alertLabelEn: "pending",
      alertLabelAr: "معلق",
    },
    {
      titleEn: "Subscriptions",
      titleAr: "الاشتراكات",
      value: summary.totalSubscriptions,
      subValue: summary.activeSubscriptions,
      subLabelEn: "active",
      subLabelAr: "نشط",
      icon: CreditCard,
      href: `/${locale}/client-subscriptions`,
      alert: summary.expiringSubscriptions > 0,
      alertValue: summary.expiringSubscriptions,
      alertLabelEn: "expiring soon",
      alertLabelAr: "تنتهي قريباً",
    },
    {
      titleEn: "Open Deals",
      titleAr: "الصفقات المفتوحة",
      value: summary.openDeals,
      subValue: summary.wonDealsThisMonth,
      subLabelEn: "won this month",
      subLabelAr: "فازت هذا الشهر",
      icon: Handshake,
      href: `/${locale}/deals`,
    },
    {
      titleEn: "Unpaid Invoices",
      titleAr: "الفواتير غير المدفوعة",
      value: summary.unpaidInvoices,
      icon: FileText,
      href: `/${locale}/client-invoices`,
      alert: summary.overdueInvoices > 0,
      alertValue: summary.overdueInvoices,
      alertLabelEn: "overdue",
      alertLabelAr: "متأخرة",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Link key={index} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">
                  {locale === "ar" ? stat.titleAr : stat.titleEn}
                </CardTitle>
                <Icon className="h-4 w-4 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value.toLocaleString()}
                </div>
                {stat.subValue !== undefined && stat.subLabelEn && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {stat.subValue}{" "}
                    {locale === "ar" ? stat.subLabelAr : stat.subLabelEn}
                  </div>
                )}
                {stat.alert && stat.alertValue && stat.alertValue > 0 && (
                  <div className="flex items-center text-xs mt-1 text-warning">
                    <AlertCircle className="h-3 w-3 me-1" />
                    {stat.alertValue}{" "}
                    {locale === "ar" ? stat.alertLabelAr : stat.alertLabelEn}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
