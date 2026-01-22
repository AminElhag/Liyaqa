"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Receipt, Settings } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { WalletTransaction, WalletTransactionType } from "@/types/wallet";

interface WalletTransactionsTableProps {
  transactions: WalletTransaction[];
  isLoading: boolean;
  locale: string;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const transactionTypeConfig: Record<
  WalletTransactionType,
  { icon: React.ElementType; colorClass: string }
> = {
  CREDIT: { icon: ArrowDownLeft, colorClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  DEBIT: { icon: ArrowUpRight, colorClass: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  SUBSCRIPTION_CHARGE: { icon: Receipt, colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  REFUND: { icon: RefreshCw, colorClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  ADJUSTMENT: { icon: Settings, colorClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
};

export function WalletTransactionsTable({
  transactions,
  isLoading,
  locale,
  pageIndex,
  pageSize,
  totalPages,
  totalElements,
  onPageChange,
  onPageSizeChange,
}: WalletTransactionsTableProps) {
  const texts = useMemo(
    () => ({
      date: locale === "ar" ? "التاريخ" : "Date",
      type: locale === "ar" ? "النوع" : "Type",
      amount: locale === "ar" ? "المبلغ" : "Amount",
      description: locale === "ar" ? "الوصف" : "Description",
      balanceAfter: locale === "ar" ? "الرصيد بعد" : "Balance After",
      noDescription: locale === "ar" ? "-" : "-",
      types: {
        CREDIT: locale === "ar" ? "إيداع" : "Credit",
        DEBIT: locale === "ar" ? "خصم" : "Debit",
        SUBSCRIPTION_CHARGE: locale === "ar" ? "رسوم اشتراك" : "Subscription",
        REFUND: locale === "ar" ? "استرداد" : "Refund",
        ADJUSTMENT: locale === "ar" ? "تعديل" : "Adjustment",
      },
    }),
    [locale]
  );

  const columns: ColumnDef<WalletTransaction>[] = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: texts.date,
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{formatDate(row.original.createdAt, locale)}</div>
            <div className="text-muted-foreground text-xs">
              {new Date(row.original.createdAt).toLocaleTimeString(
                locale === "ar" ? "ar-SA" : "en-US",
                { hour: "2-digit", minute: "2-digit" }
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: texts.type,
        cell: ({ row }) => {
          const type = row.original.type;
          const config = transactionTypeConfig[type];
          const Icon = config.icon;
          return (
            <Badge variant="secondary" className={`${config.colorClass} gap-1`}>
              <Icon className="h-3 w-3" />
              {texts.types[type]}
            </Badge>
          );
        },
      },
      {
        accessorKey: "amount",
        header: texts.amount,
        cell: ({ row }) => {
          const amount = row.original.amount.amount;
          const currency = row.original.amount.currency;
          const isPositive = ["CREDIT", "REFUND"].includes(row.original.type);
          return (
            <span
              className={`font-medium ${
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositive ? "+" : "-"}
              {formatCurrency(Math.abs(amount), currency, locale)}
            </span>
          );
        },
      },
      {
        accessorKey: "description",
        header: texts.description,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
            {row.original.description || texts.noDescription}
          </span>
        ),
      },
      {
        accessorKey: "balanceAfter",
        header: texts.balanceAfter,
        cell: ({ row }) => {
          const balance = row.original.balanceAfter;
          const currency = row.original.amount.currency;
          return (
            <span
              className={`font-medium ${
                balance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(balance, currency, locale)}
            </span>
          );
        },
      },
    ],
    [locale, texts]
  );

  return (
    <DataTable
      columns={columns}
      data={transactions}
      isLoading={isLoading}
      manualPagination
      pageCount={totalPages}
      pageIndex={pageIndex}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      totalRows={totalElements}
    />
  );
}
