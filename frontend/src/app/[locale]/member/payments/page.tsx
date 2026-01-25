"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Receipt,
  Wallet,
  AlertCircle,
  Check,
  Clock,
  Ban,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  WalletBalanceCard,
  WalletTransactionItem,
} from "@/components/member/wallet-balance";
import {
  useMyInvoices,
  useMyPendingInvoices,
  useMyWallet,
  useMyWalletTransactions,
} from "@/queries/use-member-portal";
import type { InvoiceStatus } from "@/types/billing";
import type { InvoiceLite } from "@/types/member-portal";

export default function PaymentsPage() {
  const t = useTranslations("member.invoices");
  const locale = useLocale();
  const [activeTab, setActiveTab] = React.useState("invoices");

  const { data: pendingInvoices, isLoading: pendingLoading } = useMyPendingInvoices();
  const { data: allInvoices, isLoading: invoicesLoading } = useMyInvoices({ size: 20 });
  const { data: wallet, isLoading: walletLoading } = useMyWallet();
  const { data: transactions, isLoading: transactionsLoading } = useMyWalletTransactions({ size: 20 });

  const formatCurrency = (amount: number, currency: string = "SAR") => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusMap: Record<InvoiceStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ReactNode }> = {
      DRAFT: {
        variant: "outline",
        label: locale === "ar" ? "مسودة" : "Draft",
        icon: <FileText className="h-3 w-3" />,
      },
      ISSUED: {
        variant: "secondary",
        label: locale === "ar" ? "صادرة" : "Issued",
        icon: <Clock className="h-3 w-3" />,
      },
      PAID: {
        variant: "default",
        label: locale === "ar" ? "مدفوعة" : "Paid",
        icon: <Check className="h-3 w-3" />,
      },
      PARTIALLY_PAID: {
        variant: "secondary",
        label: locale === "ar" ? "مدفوعة جزئياً" : "Partial",
        icon: <Clock className="h-3 w-3" />,
      },
      OVERDUE: {
        variant: "destructive",
        label: locale === "ar" ? "متأخرة" : "Overdue",
        icon: <AlertCircle className="h-3 w-3" />,
      },
      CANCELLED: {
        variant: "outline",
        label: locale === "ar" ? "ملغاة" : "Cancelled",
        icon: <Ban className="h-3 w-3" />,
      },
    };
    const { variant, label, icon } = statusMap[status];
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  const InvoiceItem = ({ invoice }: { invoice: InvoiceLite }) => (
    <div className="flex items-center justify-between py-4 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">#{invoice.invoiceNumber}</span>
          {getStatusBadge(invoice.status)}
        </div>
        <p className="text-sm text-neutral-500">
          {invoice.issueDate &&
            new Date(invoice.issueDate).toLocaleDateString(
              locale === "ar" ? "ar-SA" : "en-US",
              { year: "numeric", month: "short", day: "numeric" }
            )}
          {invoice.dueDate && (
            <>
              {" • "}
              {locale === "ar" ? "الاستحقاق:" : "Due:"}{" "}
              {new Date(invoice.dueDate).toLocaleDateString(
                locale === "ar" ? "ar-SA" : "en-US",
                { month: "short", day: "numeric" }
              )}
            </>
          )}
        </p>
      </div>
      <div className="text-end">
        <p className="font-semibold">
          {formatCurrency(
            invoice.totalAmount?.amount ?? 0,
            invoice.totalAmount?.currency ?? "SAR"
          )}
        </p>
        {invoice.remainingBalance?.amount > 0 && invoice.status !== "PAID" && (
          <p className="text-sm text-danger">
            {locale === "ar" ? "المتبقي:" : "Due:"}{" "}
            {formatCurrency(
              invoice.remainingBalance.amount,
              invoice.remainingBalance.currency ?? "SAR"
            )}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" />
            {locale === "ar" ? "الفواتير" : "Invoices"}
            {pendingInvoices && pendingInvoices.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-danger text-white text-xs rounded-full">
                {pendingInvoices.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="wallet" className="gap-2">
            <Wallet className="h-4 w-4" />
            {locale === "ar" ? "المحفظة" : "Wallet"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6 space-y-6">
          {/* Pending Invoices */}
          {pendingLoading ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : pendingInvoices && pendingInvoices.length > 0 ? (
            <Card className="border-danger/30 bg-danger/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-danger">
                  <AlertCircle className="h-5 w-5" />
                  {t("pendingPayment")}
                </CardTitle>
                <CardDescription>
                  {locale === "ar"
                    ? "فواتير تحتاج للدفع"
                    : "Invoices that need payment"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {pendingInvoices.map((invoice) => (
                    <InvoiceItem key={invoice.id} invoice={invoice} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* All Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {locale === "ar" ? "جميع الفواتير" : "All Invoices"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : allInvoices?.items && allInvoices.items.length > 0 ? (
                <div className="divide-y">
                  {allInvoices.items.map((invoice) => (
                    <InvoiceItem key={invoice.id} invoice={invoice} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                  <p className="text-neutral-500">
                    {locale === "ar" ? "لا توجد فواتير" : "No invoices"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="mt-6 space-y-6">
          {/* Wallet Balance */}
          {walletLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <WalletBalanceCard wallet={wallet} />
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                {locale === "ar" ? "سجل المعاملات" : "Transaction History"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactionsLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : transactions?.items && transactions.items.length > 0 ? (
                <div>
                  {transactions.items.map((transaction) => (
                    <WalletTransactionItem
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <Wallet className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                  <p className="text-neutral-500">
                    {locale === "ar"
                      ? "لا توجد معاملات"
                      : "No transactions yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
