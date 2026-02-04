"use client";

import { useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { TrendingUp, TrendingDown, Clock, Wrench } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import type { PointsTransaction, PointsTransactionType, PointsSource } from "@liyaqa/shared/types/loyalty";

interface PointsTransactionsTableProps {
  transactions: PointsTransaction[];
  isLoading?: boolean;
}

const typeConfig: Record<
  PointsTransactionType,
  { labelEn: string; labelAr: string; icon: typeof TrendingUp; color: string }
> = {
  EARN: {
    labelEn: "Earned",
    labelAr: "مكتسب",
    icon: TrendingUp,
    color: "text-green-600",
  },
  REDEEM: {
    labelEn: "Redeemed",
    labelAr: "مستبدل",
    icon: TrendingDown,
    color: "text-purple-600",
  },
  EXPIRE: {
    labelEn: "Expired",
    labelAr: "منتهي",
    icon: Clock,
    color: "text-orange-600",
  },
  ADJUSTMENT: {
    labelEn: "Adjustment",
    labelAr: "تعديل",
    icon: Wrench,
    color: "text-blue-600",
  },
};

const sourceLabels: Record<PointsSource, { en: string; ar: string }> = {
  ATTENDANCE: { en: "Check-in", ar: "تسجيل حضور" },
  REFERRAL: { en: "Referral", ar: "إحالة" },
  PURCHASE: { en: "Purchase", ar: "شراء" },
  MANUAL: { en: "Manual", ar: "يدوي" },
  PROMOTION: { en: "Promotion", ar: "ترويج" },
  BIRTHDAY: { en: "Birthday", ar: "عيد ميلاد" },
  SIGNUP_BONUS: { en: "Signup Bonus", ar: "مكافأة التسجيل" },
};

export function PointsTransactionsTable({
  transactions,
  isLoading = false,
}: PointsTransactionsTableProps) {
  const locale = useLocale();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {locale === "ar"
          ? "لا توجد معاملات نقاط بعد"
          : "No points transactions yet"}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{locale === "ar" ? "النوع" : "Type"}</TableHead>
          <TableHead>{locale === "ar" ? "النقاط" : "Points"}</TableHead>
          <TableHead>{locale === "ar" ? "المصدر" : "Source"}</TableHead>
          <TableHead>{locale === "ar" ? "الوصف" : "Description"}</TableHead>
          <TableHead className="text-right">
            {locale === "ar" ? "الرصيد بعد" : "Balance After"}
          </TableHead>
          <TableHead className="text-right">
            {locale === "ar" ? "التاريخ" : "Date"}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          const config = typeConfig[transaction.type];
          const Icon = config.icon;
          const sourceLabel = sourceLabels[transaction.source];

          return (
            <TableRow key={transaction.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className={config.color}>
                    {locale === "ar" ? config.labelAr : config.labelEn}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`font-medium ${
                    transaction.type === "EARN" ||
                    (transaction.type === "ADJUSTMENT" && transaction.points > 0)
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.type === "EARN" ||
                   (transaction.type === "ADJUSTMENT" && transaction.points > 0)
                    ? "+"
                    : "-"}
                  {Math.abs(transaction.points).toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {locale === "ar" ? sourceLabel.ar : sourceLabel.en}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {transaction.description
                  ? locale === "ar" && transaction.description.ar
                    ? transaction.description.ar
                    : transaction.description.en
                  : "-"}
              </TableCell>
              <TableCell className="text-right font-medium">
                {transaction.balanceAfter.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatDistanceToNow(new Date(transaction.createdAt), {
                  addSuffix: true,
                  locale: locale === "ar" ? ar : enUS,
                })}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
