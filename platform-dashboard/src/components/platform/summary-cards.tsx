import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Building2,
  CreditCard,
  Handshake,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformSummary } from "@/types";

interface SummaryCardsProps {
  summary: PlatformSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const stats = [
    {
      titleEn: "Total Clients",
      titleAr: "إجمالي العملاء",
      value: summary.totalClients,
      subValue: summary.activeClients,
      subLabelEn: "active",
      subLabelAr: "نشط",
      icon: Building2,
      href: "/clients",
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
      href: "/client-subscriptions",
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
      href: "/deals",
    },
    {
      titleEn: "Unpaid Invoices",
      titleAr: "الفواتير غير المدفوعة",
      value: summary.unpaidInvoices,
      icon: FileText,
      href: "/client-invoices",
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
          <Link key={index} to={stat.href}>
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
