"use client";

import { Wallet, Plus, Settings, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { formatCurrency, formatDate } from "@liyaqa/shared/utils";
import type { WalletBalance } from "@liyaqa/shared/types/wallet";

interface WalletBalanceCardProps {
  wallet: WalletBalance | undefined;
  isLoading: boolean;
  locale: string;
  onAddCredit: () => void;
  onAdjustBalance: () => void;
}

export function WalletBalanceCard({
  wallet,
  isLoading,
  locale,
  onAddCredit,
  onAdjustBalance,
}: WalletBalanceCardProps) {
  const texts = {
    wallet: locale === "ar" ? "المحفظة" : "Wallet",
    balance: locale === "ar" ? "الرصيد" : "Balance",
    credit: locale === "ar" ? "رصيد دائن" : "Credit",
    debt: locale === "ar" ? "رصيد مدين" : "Debt",
    noBalance: locale === "ar" ? "لا يوجد رصيد" : "No Balance",
    addCredit: locale === "ar" ? "إضافة رصيد" : "Add Credit",
    adjustBalance: locale === "ar" ? "تعديل الرصيد" : "Adjust",
    lastTransaction: locale === "ar" ? "آخر معاملة" : "Last Transaction",
    noTransactions: locale === "ar" ? "لا توجد معاملات" : "No transactions yet",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            {texts.wallet}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const balance = wallet?.balance.amount ?? 0;
  const currency = wallet?.balance.currency ?? "SAR";
  const hasCredit = balance > 0;
  const hasDebt = balance < 0;
  const isNeutral = balance === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5" />
          {texts.wallet}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              hasCredit
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : hasDebt
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-muted"
            }`}
          >
            {hasCredit ? (
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : hasDebt ? (
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <Wallet className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p
              className={`text-2xl font-bold ${
                hasCredit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : hasDebt
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
              }`}
            >
              {formatCurrency(Math.abs(balance), currency, locale)}
            </p>
            <p
              className={`text-sm font-medium ${
                hasCredit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : hasDebt
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
              }`}
            >
              {hasCredit ? texts.credit : hasDebt ? texts.debt : texts.noBalance}
            </p>
          </div>
        </div>

        {/* Last Transaction */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {texts.lastTransaction}:{" "}
            {wallet?.lastTransactionAt
              ? formatDate(wallet.lastTransactionAt, locale)
              : texts.noTransactions}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" onClick={onAddCredit}>
            <Plus className="me-1.5 h-4 w-4" />
            {texts.addCredit}
          </Button>
          <Button size="sm" variant="outline" onClick={onAdjustBalance}>
            <Settings className="me-1.5 h-4 w-4" />
            {texts.adjustBalance}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
