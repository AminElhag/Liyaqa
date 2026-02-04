"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { CertificationStatusBadge } from "./certification-status-badge";
import type { TrainerCertificationResponse } from "@liyaqa/shared/types/trainer-portal";

interface CertificationsColumnsOptions {
  locale: string;
  onEdit?: (certification: TrainerCertificationResponse) => void;
  onDelete?: (certification: TrainerCertificationResponse) => void;
}

export function getCertificationsColumns(
  options: CertificationsColumnsOptions
): ColumnDef<TrainerCertificationResponse>[] {
  const { locale, onEdit, onDelete } = options;

  const texts = {
    name: locale === "ar" ? "الاسم" : "Name",
    organization: locale === "ar" ? "الجهة المصدرة" : "Organization",
    issuedDate: locale === "ar" ? "تاريخ الإصدار" : "Issued Date",
    expiryDate: locale === "ar" ? "تاريخ الانتهاء" : "Expiry Date",
    status: locale === "ar" ? "الحالة" : "Status",
    verified: locale === "ar" ? "موثق" : "Verified",
    notVerified: locale === "ar" ? "غير موثق" : "Not Verified",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    edit: locale === "ar" ? "تعديل" : "Edit",
    delete: locale === "ar" ? "حذف" : "Delete",
    na: locale === "ar" ? "غير محدد" : "N/A",
    noExpiry: locale === "ar" ? "لا ينتهي" : "No Expiry",
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
      accessorKey: "nameEn",
      header: texts.name,
      cell: ({ row }) => {
        const name =
          locale === "ar" ? row.original.nameAr : row.original.nameEn;
        return (
          <div className="max-w-[250px]">
            <p className="font-medium truncate">{name}</p>
            {row.original.certificateNumber && (
              <p className="text-xs text-muted-foreground">
                #{row.original.certificateNumber}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "issuingOrganization",
      header: texts.organization,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.issuingOrganization}</span>
      ),
    },
    {
      accessorKey: "issuedDate",
      header: texts.issuedDate,
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDate(row.original.issuedDate)}
        </span>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: texts.expiryDate,
      cell: ({ row }) => {
        const expiryDate = row.original.expiryDate;
        if (!expiryDate) {
          return (
            <Badge variant="secondary" className="text-xs">
              {texts.noExpiry}
            </Badge>
          );
        }

        const isExpiringSoon =
          new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const isExpired = new Date(expiryDate) < new Date();

        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm">{formatDate(expiryDate)}</span>
            {isExpired && (
              <Badge variant="destructive" className="text-xs w-fit">
                {locale === "ar" ? "منتهي" : "Expired"}
              </Badge>
            )}
            {!isExpired && isExpiringSoon && (
              <Badge variant="warning" className="text-xs w-fit">
                {locale === "ar" ? "ينتهي قريباً" : "Expiring Soon"}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => (
        <CertificationStatusBadge
          status={row.original.status}
          isVerified={row.original.isVerified}
        />
      ),
    },
    {
      id: "verification",
      header: texts.verified,
      cell: ({ row }) => {
        const isVerified = row.original.isVerified;
        return (
          <div className="flex items-center gap-2">
            {isVerified ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600">{texts.verified}</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {texts.notVerified}
                </span>
              </>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const certification = row.original;

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
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(certification)}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(certification)}
                  className="text-destructive"
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {texts.delete}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
