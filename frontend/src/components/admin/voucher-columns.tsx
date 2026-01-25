"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import type { Voucher, DiscountType } from "@/types/voucher";
import { DISCOUNT_TYPE_LABELS } from "@/types/voucher";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface VoucherColumnsProps {
  isArabic: boolean;
  onView: (voucher: Voucher) => void;
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
  onActivate: (voucher: Voucher) => void;
  onDeactivate: (voucher: Voucher) => void;
}

export function getVoucherColumns({
  isArabic,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: VoucherColumnsProps): ColumnDef<Voucher>[] {
  return [
    {
      accessorKey: "code",
      header: isArabic ? "الكود" : "Code",
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "nameEn",
      header: isArabic ? "الاسم" : "Name",
      cell: ({ row }) => (
        <span>{isArabic ? row.original.nameAr || row.original.nameEn : row.original.nameEn}</span>
      ),
    },
    {
      accessorKey: "discountType",
      header: isArabic ? "النوع" : "Type",
      cell: ({ row }) => {
        const type = row.original.discountType as DiscountType;
        const label = DISCOUNT_TYPE_LABELS[type];
        return (
          <Badge variant="outline">
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      id: "value",
      header: isArabic ? "القيمة" : "Value",
      cell: ({ row }) => {
        const voucher = row.original;
        switch (voucher.discountType) {
          case "FIXED_AMOUNT":
            return `${voucher.discountAmount} ${voucher.discountCurrency}`;
          case "PERCENTAGE":
            return `${voucher.discountPercent}%`;
          case "FREE_TRIAL":
            return `${voucher.freeTrialDays} ${isArabic ? "يوم" : "days"}`;
          case "GIFT_CARD":
            return `${voucher.giftCardBalance} ${voucher.discountCurrency}`;
          default:
            return "-";
        }
      },
    },
    {
      id: "usage",
      header: isArabic ? "الاستخدام" : "Usage",
      cell: ({ row }) => {
        const voucher = row.original;
        const max = voucher.maxUses
          ? `/ ${voucher.maxUses}`
          : isArabic
          ? "/ ∞"
          : "/ ∞";
        return `${voucher.currentUseCount} ${max}`;
      },
    },
    {
      accessorKey: "isActive",
      header: isArabic ? "الحالة" : "Status",
      cell: ({ row }) => {
        const voucher = row.original;
        if (!voucher.isActive) {
          return (
            <Badge variant="secondary">
              {isArabic ? "غير نشط" : "Inactive"}
            </Badge>
          );
        }
        if (!voucher.isValidForUse) {
          return (
            <Badge variant="destructive">
              {isArabic ? "منتهي" : "Expired"}
            </Badge>
          );
        }
        return (
          <Badge variant="default">{isArabic ? "نشط" : "Active"}</Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: isArabic ? "تاريخ الإنشاء" : "Created",
      cell: ({ row }) =>
        formatDistanceToNow(new Date(row.original.createdAt), {
          addSuffix: true,
          locale: isArabic ? ar : undefined,
        }),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const voucher = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(voucher)}>
                <Eye className="mr-2 h-4 w-4" />
                {isArabic ? "عرض" : "View"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(voucher)}>
                <Pencil className="mr-2 h-4 w-4" />
                {isArabic ? "تعديل" : "Edit"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {voucher.isActive ? (
                <DropdownMenuItem onClick={() => onDeactivate(voucher)}>
                  <PowerOff className="mr-2 h-4 w-4" />
                  {isArabic ? "تعطيل" : "Deactivate"}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onActivate(voucher)}>
                  <Power className="mr-2 h-4 w-4" />
                  {isArabic ? "تفعيل" : "Activate"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(voucher)}
                className="text-destructive"
                disabled={voucher.currentUseCount > 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isArabic ? "حذف" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
