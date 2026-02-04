"use client";

import { memo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { formatCurrency } from "@liyaqa/shared/utils";
import type { TopClient } from "@liyaqa/shared/types/platform";

interface TopClientsTableProps {
  clients: TopClient[];
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  ACTIVE: "success",
  TRIAL: "warning",
  PENDING: "secondary",
  SUSPENDED: "destructive",
  CANCELLED: "destructive",
};

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  ACTIVE: { en: "Active", ar: "نشط" },
  TRIAL: { en: "Trial", ar: "تجريبي" },
  PENDING: { en: "Pending", ar: "معلق" },
  SUSPENDED: { en: "Suspended", ar: "موقوف" },
  CANCELLED: { en: "Cancelled", ar: "ملغى" },
};

// Memoized ClientRow component to prevent unnecessary re-renders
interface ClientRowProps {
  client: TopClient;
  index: number;
  locale: string;
}

const ClientRow = memo<ClientRowProps>(({ client, index, locale }) => {
  const statusLabel =
    STATUS_LABELS[client.subscriptionStatus] || STATUS_LABELS.PENDING;

  return (
    <Link
      href={`/${locale}/clients/${client.organizationId}`}
      className="block"
    >
      <div className="flex items-center justify-between py-3 px-2 border-b last:border-0 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
            {index + 1}
          </div>
          <div>
            <p className="font-medium">
              {locale === "ar" && client.organizationNameAr
                ? client.organizationNameAr
                : client.organizationNameEn}
            </p>
            <p className="text-xs text-muted-foreground">
              {client.invoiceCount}{" "}
              {locale === "ar" ? "فاتورة" : "invoices"}
            </p>
          </div>
        </div>
        <div className="text-end">
          <p className="font-medium">
            {formatCurrency(
              client.totalRevenue,
              client.currency,
              locale
            )}
          </p>
          <Badge
            variant={
              STATUS_VARIANTS[client.subscriptionStatus] ||
              "secondary"
            }
            className="text-xs mt-1"
          >
            {locale === "ar" ? statusLabel.ar : statusLabel.en}
          </Badge>
        </div>
      </div>
    </Link>
  );
});

ClientRow.displayName = "ClientRow";

export function TopClientsTable({ clients }: TopClientsTableProps) {
  const locale = useLocale();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            {locale === "ar" ? "أفضل العملاء" : "Top Clients"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "العملاء الأعلى إيرادات"
              : "Clients by revenue"}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/clients`}>
            {locale === "ar" ? "عرض الكل" : "View All"}
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {clients.length > 0 ? (
          <div className="space-y-3">
            {clients.map((client, index) => (
              <ClientRow
                key={client.organizationId}
                client={client}
                index={index}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">
              {locale === "ar" ? "لا يوجد عملاء بعد" : "No clients yet"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
