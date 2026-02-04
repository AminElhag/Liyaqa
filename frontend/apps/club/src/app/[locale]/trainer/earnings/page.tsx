"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  useTrainerEarnings,
  useEarningsSummary,
} from "@liyaqa/shared/queries/use-trainer-portal";
import { useMyTrainerProfile } from "@liyaqa/shared/queries/use-trainers";
import { getEarningsColumns } from "@/components/trainer/earnings-columns";
import type {
  EarningStatus,
  EarningType,
  TrainerEarningsResponse,
} from "@liyaqa/shared/types/trainer-portal";
import type { Money } from "@liyaqa/shared/types/api";

function formatMoney(money: Money | undefined, locale: string): string {
  if (!money) return "0";

  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: money.currency || "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(money.amount);
}

export default function EarningsPage() {
  const locale = useLocale();

  // Get trainer profile
  const { data: trainerProfile } = useMyTrainerProfile();
  const trainerId = trainerProfile?.id;

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EarningStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<EarningType | "ALL">("ALL");
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch earnings
  const { data: earningsData, isLoading, error } = useTrainerEarnings({
    trainerId,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    earningType: typeFilter !== "ALL" ? typeFilter : undefined,
    startDate,
    endDate,
    page,
    size: pageSize,
    sortBy: "earningDate",
    sortDirection: "DESC",
  });

  // Fetch summary
  const { data: summary } = useEarningsSummary(trainerId);

  const texts = {
    title: locale === "ar" ? "الأرباح والمدفوعات" : "Earnings & Payments",
    description:
      locale === "ar"
        ? "تتبع أرباحك وعرض سجل المدفوعات"
        : "Track your earnings and view payment history",
    search:
      locale === "ar"
        ? "البحث برقم الدفع..."
        : "Search by payment reference...",
    status: locale === "ar" ? "الحالة" : "Status",
    type: locale === "ar" ? "النوع" : "Type",
    startDate: locale === "ar" ? "من تاريخ" : "Start Date",
    endDate: locale === "ar" ? "إلى تاريخ" : "End Date",
    all: locale === "ar" ? "الكل" : "All",
    pending: locale === "ar" ? "معلق" : "Pending",
    approved: locale === "ar" ? "موافق عليه" : "Approved",
    paid: locale === "ar" ? "مدفوع" : "Paid",
    cancelled: locale === "ar" ? "ملغي" : "Cancelled",
    allTypes: locale === "ar" ? "جميع الأنواع" : "All Types",
    ptSession: locale === "ar" ? "جلسة تدريب شخصي" : "PT Session",
    classSession: locale === "ar" ? "جلسة جماعية" : "Class Session",
    bonus: locale === "ar" ? "مكافأة" : "Bonus",
    commission: locale === "ar" ? "عمولة" : "Commission",
    adjustment: locale === "ar" ? "تعديل" : "Adjustment",
    noEarnings: locale === "ar" ? "لا توجد أرباح" : "No earnings found",
    error:
      locale === "ar" ? "حدث خطأ أثناء تحميل الأرباح" : "Error loading earnings",
    // Stats cards
    totalEarnings: locale === "ar" ? "إجمالي الأرباح" : "Total Earnings",
    pendingEarnings: locale === "ar" ? "أرباح معلقة" : "Pending Earnings",
    paidThisMonth: locale === "ar" ? "المدفوع هذا الشهر" : "Paid This Month",
    monthComparison: locale === "ar" ? "مقارنة شهرية" : "Monthly Comparison",
    lastMonth: locale === "ar" ? "الشهر الماضي" : "Last Month",
    thisMonth: locale === "ar" ? "هذا الشهر" : "This Month",
    filters: locale === "ar" ? "الفلاتر" : "Filters",
  };

  // Columns
  const columns = getEarningsColumns({
    locale,
    // onView: Optional - can be implemented later for earning detail page
  });

  // Filter earnings by search (client-side filtering for payment reference)
  const filteredData = earningsData?.content?.filter((earning) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return earning.paymentReference?.toLowerCase().includes(searchLower);
  });

  if (isLoading && !earningsData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">{texts.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{texts.title}</h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {texts.totalEarnings}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {formatMoney(summary?.totalEarnings, locale)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {texts.pendingEarnings}
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatMoney(summary?.pendingEarnings, locale)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {texts.paidThisMonth}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(summary?.currentMonthEarnings, locale)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {texts.monthComparison}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{texts.lastMonth}</div>
              <div className="text-lg font-bold">
                {formatMoney(summary?.lastMonthEarnings, locale)}
              </div>
              <div className="text-xs text-muted-foreground">{texts.thisMonth}</div>
              <div className="text-lg font-bold text-blue-600">
                {formatMoney(summary?.currentMonthEarnings, locale)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.filters}</CardTitle>
          <CardDescription>
            {texts.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={texts.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as EarningStatus | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="PENDING">{texts.pending}</SelectItem>
                <SelectItem value="APPROVED">{texts.approved}</SelectItem>
                <SelectItem value="PAID">{texts.paid}</SelectItem>
                <SelectItem value="CANCELLED">{texts.cancelled}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as EarningType | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={texts.type} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.allTypes}</SelectItem>
                <SelectItem value="PT_SESSION">{texts.ptSession}</SelectItem>
                <SelectItem value="CLASS_SESSION">{texts.classSession}</SelectItem>
                <SelectItem value="BONUS">{texts.bonus}</SelectItem>
                <SelectItem value="COMMISSION">{texts.commission}</SelectItem>
                <SelectItem value="ADJUSTMENT">{texts.adjustment}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder={texts.startDate}
              value={startDate || ""}
              onChange={(e) => {
                setStartDate(e.target.value || undefined);
                setPage(0);
              }}
              className="w-[180px]"
            />

            <Input
              type="date"
              placeholder={texts.endDate}
              value={endDate || ""}
              onChange={(e) => {
                setEndDate(e.target.value || undefined);
                setPage(0);
              }}
              className="w-[180px]"
            />
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredData || []}
            manualPagination
            pageCount={earningsData?.totalPages || 1}
            pageIndex={page}
            pageSize={pageSize}
            totalRows={earningsData?.totalElements}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
