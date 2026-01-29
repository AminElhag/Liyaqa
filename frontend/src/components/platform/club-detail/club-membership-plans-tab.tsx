"use client";

import { useState } from "react";
import { CreditCard, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useClubMembershipPlans } from "@/queries/platform/use-club-detail";
import type { ClubMembershipPlan, BillingPeriod } from "@/types/platform";
import type { ColumnDef } from "@tanstack/react-table";

interface ClubMembershipPlansTabProps {
  clubId: string;
  locale: string;
}

const BILLING_PERIOD_LABELS: Record<BillingPeriod, { en: string; ar: string }> = {
  DAILY: { en: "Daily", ar: "يومي" },
  WEEKLY: { en: "Weekly", ar: "أسبوعي" },
  BIWEEKLY: { en: "Bi-weekly", ar: "نصف شهري" },
  MONTHLY: { en: "Monthly", ar: "شهري" },
  QUARTERLY: { en: "Quarterly", ar: "ربع سنوي" },
  YEARLY: { en: "Yearly", ar: "سنوي" },
  ONE_TIME: { en: "One-time", ar: "دفعة واحدة" },
};

function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function ClubMembershipPlansTab({ clubId, locale }: ClubMembershipPlansTabProps) {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useClubMembershipPlans(clubId, { page, size: 10 });

  const texts = {
    membershipPlans: locale === "ar" ? "خطط العضوية" : "Membership Plans",
    noPlans: locale === "ar" ? "لا توجد خطط عضوية" : "No membership plans found",
    name: locale === "ar" ? "الاسم" : "Name",
    price: locale === "ar" ? "السعر" : "Price",
    billingPeriod: locale === "ar" ? "فترة الدفع" : "Billing Period",
    duration: locale === "ar" ? "المدة" : "Duration",
    status: locale === "ar" ? "الحالة" : "Status",
    subscribers: locale === "ar" ? "المشتركون" : "Subscribers",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    days: locale === "ar" ? "يوم" : "days",
    unlimited: locale === "ar" ? "غير محدود" : "Unlimited",
  };

  const columns: ColumnDef<ClubMembershipPlan>[] = [
    {
      accessorKey: "name",
      header: texts.name,
      cell: ({ row }) => {
        const name = locale === "ar"
          ? row.original.name.ar || row.original.name.en
          : row.original.name.en;
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "membershipFee",
      header: texts.price,
      cell: ({ row }) => (
        <span className="font-mono">
          {formatCurrency(
            row.original.membershipFee.grossAmount,
            row.original.membershipFee.currency,
            locale
          )}
        </span>
      ),
    },
    {
      accessorKey: "billingPeriod",
      header: texts.billingPeriod,
      cell: ({ row }) => {
        const label = BILLING_PERIOD_LABELS[row.original.billingPeriod];
        return (
          <Badge variant="outline">
            {locale === "ar" ? label?.ar : label?.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "durationDays",
      header: texts.duration,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.durationDays
            ? `${row.original.durationDays} ${texts.days}`
            : texts.unlimited}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: texts.status,
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? texts.active : texts.inactive}
        </Badge>
      ),
    },
    {
      accessorKey: "subscriberCount",
      header: texts.subscribers,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.subscriberCount}</span>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.content.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {texts.noPlans}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{texts.membershipPlans}</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data.content}
          pageCount={data.totalPages}
          pageIndex={page}
          onPageChange={setPage}
          manualPagination
        />
      </CardContent>
    </Card>
  );
}
