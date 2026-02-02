"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EarningsStatusBadge } from "./earnings-status-badge";
import { EarningTypeBadge } from "./earning-type-badge";
import type { TrainerEarningsResponse } from "@/types/trainer-portal";
import type { Money } from "@/types/api";

interface EarningsColumnsOptions {
  locale: string;
  onView?: (earning: TrainerEarningsResponse) => void;
}

function formatMoney(money: Money | null | undefined, locale: string): string {
  if (!money) return "—";

  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: money.currency || "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(money.amount);
}

export function getEarningsColumns(
  options: EarningsColumnsOptions
): ColumnDef<TrainerEarningsResponse>[] {
  const { locale, onView } = options;

  const texts = {
    earningDate: locale === "ar" ? "تاريخ الإيراد" : "Earning Date",
    type: locale === "ar" ? "النوع" : "Type",
    amount: locale === "ar" ? "المبلغ" : "Amount",
    deductions: locale === "ar" ? "الخصومات" : "Deductions",
    netAmount: locale === "ar" ? "الصافي" : "Net Amount",
    status: locale === "ar" ? "الحالة" : "Status",
    paymentDate: locale === "ar" ? "تاريخ الدفع" : "Payment Date",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    na: locale === "ar" ? "غير محدد" : "N/A",
    notPaid: locale === "ar" ? "غير مدفوع" : "Not Paid",
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return texts.na;
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch {
      return texts.na;
    }
  };

  return [
    {
      accessorKey: "earningDate",
      header: texts.earningDate,
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formatDate(row.original.earningDate)}
        </span>
      ),
    },
    {
      accessorKey: "earningType",
      header: texts.type,
      cell: ({ row }) => <EarningTypeBadge type={row.original.earningType} />,
    },
    {
      accessorKey: "amount",
      header: texts.amount,
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formatMoney(row.original.amount, locale)}
        </span>
      ),
    },
    {
      id: "deductions",
      header: texts.deductions,
      cell: ({ row }) => {
        const deductions = row.original.deductions;
        if (!deductions || deductions.amount === 0) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        return (
          <span className="text-sm font-medium text-red-600">
            {formatMoney(deductions, locale)}
          </span>
        );
      },
    },
    {
      accessorKey: "netAmount",
      header: texts.netAmount,
      cell: ({ row }) => (
        <span className="text-sm font-bold text-teal-600">
          {formatMoney(row.original.netAmount, locale)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <EarningsStatusBadge status={row.original.status} />,
    },
    {
      id: "paymentDate",
      header: texts.paymentDate,
      cell: ({ row }) => {
        const paymentDate = row.original.paymentDate;
        if (!paymentDate) {
          return (
            <span className="text-sm text-muted-foreground">{texts.notPaid}</span>
          );
        }
        return <span className="text-sm">{formatDate(paymentDate)}</span>;
      },
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const earning = row.original;

        if (!onView) {
          return null;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
              <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(earning)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
