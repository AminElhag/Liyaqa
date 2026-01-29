"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Plus, Building2, Users, Percent, Calendar, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useCorporateAccounts, useSearchCorporateAccounts } from "@/queries/use-corporate-accounts";
import type { CorporateAccountSummary, AccountStatus, CorporateBillingType } from "@/types/accounts";

const statusConfig: Record<AccountStatus, { labelEn: string; labelAr: string; variant: "default" | "secondary" | "destructive" }> = {
  ACTIVE: { labelEn: "Active", labelAr: "نشط", variant: "default" },
  SUSPENDED: { labelEn: "Suspended", labelAr: "معلق", variant: "secondary" },
  TERMINATED: { labelEn: "Terminated", labelAr: "منتهي", variant: "destructive" },
};

const billingTypeLabels: Record<CorporateBillingType, { en: string; ar: string }> = {
  INVOICE: { en: "Invoice", ar: "فاتورة" },
  PREPAID: { en: "Prepaid", ar: "مدفوع مقدماً" },
  MONTHLY: { en: "Monthly", ar: "شهري" },
};

function CorporateAccountCard({ account }: { account: CorporateAccountSummary }) {
  const locale = useLocale();
  const statusInfo = statusConfig[account.status];
  const isExpiringSoon = account.contractEndDate &&
    new Date(account.contractEndDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Link href={`/${locale}/corporate-accounts/${account.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {locale === "ar" && account.companyNameAr ? account.companyNameAr : account.companyName}
              </CardTitle>
              <CardDescription>
                {locale === "ar" && account.companyNameAr ? account.companyName : account.companyNameAr}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <Badge variant={statusInfo.variant}>
                {locale === "ar" ? statusInfo.labelAr : statusInfo.labelEn}
              </Badge>
              {isExpiringSoon && (
                <Badge variant="destructive" className="text-xs">
                  {locale === "ar" ? "ينتهي قريباً" : "Expiring Soon"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {account.memberCount}
                {account.maxMembers ? ` / ${account.maxMembers}` : ""}{" "}
                {locale === "ar" ? "موظف" : "employees"}
              </span>
            </div>
            {account.discountPercentage > 0 && (
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span>
                  {account.discountPercentage}%{" "}
                  {locale === "ar" ? "خصم" : "discount"}
                </span>
              </div>
            )}
            {account.contractEndDate && (
              <div className="flex items-center gap-2 col-span-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {locale === "ar" ? "ينتهي: " : "Ends: "}
                  {new Date(account.contractEndDate).toLocaleDateString(
                    locale === "ar" ? "ar-SA" : "en-US"
                  )}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CorporateAccountsPage() {
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allData, isLoading: isLoadingAll } = useCorporateAccounts({ page, size: 12 });
  const { data: searchData, isLoading: isSearching } = useSearchCorporateAccounts(searchQuery, { page, size: 12 });

  const isLoading = searchQuery ? isSearching : isLoadingAll;
  const data = searchQuery ? searchData : allData;

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }

  const accounts: CorporateAccountSummary[] = data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {locale === "ar" ? "الحسابات المؤسسية" : "Corporate Accounts"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إدارة حسابات الشركات والمؤسسات"
              : "Manage corporate and business accounts"}
          </p>
        </div>
        <Link href={`/${locale}/corporate-accounts/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {locale === "ar" ? "حساب جديد" : "New Account"}
          </Button>
        </Link>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={locale === "ar" ? "البحث عن شركة..." : "Search companies..."}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          className="pl-10"
        />
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery
                ? locale === "ar" ? "لا توجد نتائج" : "No Results"
                : locale === "ar" ? "لا توجد حسابات مؤسسية" : "No Corporate Accounts"
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? locale === "ar"
                  ? "لم يتم العثور على نتائج مطابقة"
                  : "No matching accounts found"
                : locale === "ar"
                  ? "لم يتم إنشاء أي حسابات مؤسسية بعد"
                  : "No corporate accounts have been created yet"
              }
            </p>
            {!searchQuery && (
              <Link href={`/${locale}/corporate-accounts/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {locale === "ar" ? "إنشاء حساب" : "Create Account"}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <CorporateAccountCard key={account.id} account={account} />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.first}
              >
                {locale === "ar" ? "السابق" : "Previous"}
              </Button>
              <span className="flex items-center px-4">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
              >
                {locale === "ar" ? "التالي" : "Next"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
