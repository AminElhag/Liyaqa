"use client";

import { useLocale } from "next-intl";
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Gift, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/utils";
import type { WalletBalance, WalletTransaction, WalletTransactionType } from "@liyaqa/shared/types/member-portal";

interface WalletBalanceCardProps {
  wallet: WalletBalance | null | undefined;
  className?: string;
}

export function WalletBalanceCard({ wallet, className }: WalletBalanceCardProps) {
  const locale = useLocale();

  const formatCurrency = (amount: number, currency: string = "SAR") => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!wallet) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-neutral-400" />
            {locale === "ar" ? "المحفظة" : "Wallet"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-500 text-sm">
            {locale === "ar" ? "لا توجد محفظة" : "No wallet available"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">
              {locale === "ar" ? "رصيد المحفظة" : "Wallet Balance"}
            </p>
            <p className="text-3xl font-bold">
              {formatCurrency(
                wallet.balance?.amount ?? 0,
                wallet.balance?.currency ?? "SAR"
              )}
            </p>
          </div>
          <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
        </div>
      </div>
      {wallet.lastTransactionAt && (
        <CardContent className="pt-3 pb-3">
          <p className="text-xs text-neutral-500">
            {locale === "ar" ? "آخر معاملة:" : "Last transaction:"}{" "}
            {new Date(wallet.lastTransactionAt).toLocaleDateString(
              locale === "ar" ? "ar-SA" : "en-US",
              { month: "short", day: "numeric", year: "numeric" }
            )}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

interface WalletTransactionItemProps {
  transaction: WalletTransaction;
  className?: string;
}

export function WalletTransactionItem({ transaction, className }: WalletTransactionItemProps) {
  const locale = useLocale();

  const formatCurrency = (amount: number, currency: string = "SAR") => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTypeInfo = (type: WalletTransactionType) => {
    const typeMap: Record<WalletTransactionType, { icon: React.ReactNode; color: string; label: string }> = {
      CREDIT: {
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-green-600 bg-green-50",
        label: locale === "ar" ? "إيداع" : "Credit",
      },
      DEBIT: {
        icon: <TrendingDown className="h-4 w-4" />,
        color: "text-red-600 bg-red-50",
        label: locale === "ar" ? "سحب" : "Debit",
      },
      REFUND: {
        icon: <RefreshCw className="h-4 w-4" />,
        color: "text-blue-600 bg-blue-50",
        label: locale === "ar" ? "استرداد" : "Refund",
      },
      ADJUSTMENT: {
        icon: <Minus className="h-4 w-4" />,
        color: "text-neutral-600 bg-neutral-50",
        label: locale === "ar" ? "تعديل" : "Adjustment",
      },
      REWARD: {
        icon: <Gift className="h-4 w-4" />,
        color: "text-purple-600 bg-purple-50",
        label: locale === "ar" ? "مكافأة" : "Reward",
      },
      GIFT_CARD: {
        icon: <Gift className="h-4 w-4" />,
        color: "text-orange-600 bg-orange-50",
        label: locale === "ar" ? "بطاقة هدية" : "Gift Card",
      },
    };
    return typeMap[type] || typeMap.CREDIT;
  };

  const typeInfo = getTypeInfo(transaction.type);
  const isPositive = ["CREDIT", "REFUND", "REWARD", "GIFT_CARD"].includes(transaction.type);

  const description =
    locale === "ar"
      ? transaction.description?.ar || transaction.description?.en
      : transaction.description?.en;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className={cn("flex items-center gap-4 p-4 border-b last:border-0", className)}>
      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", typeInfo.color)}>
        {typeInfo.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{description || typeInfo.label}</span>
          <Badge variant="outline" className="text-xs shrink-0">
            {typeInfo.label}
          </Badge>
        </div>
        <p className="text-sm text-neutral-500">{formatDate(transaction.createdAt)}</p>
      </div>
      <div className={cn("text-lg font-semibold", isPositive ? "text-green-600" : "text-red-600")}>
        {isPositive ? "+" : "-"}
        {formatCurrency(
          Math.abs(transaction.amount?.amount ?? 0),
          transaction.amount?.currency ?? "SAR"
        )}
      </div>
    </div>
  );
}
