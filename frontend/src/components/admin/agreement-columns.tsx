"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  PlayCircle,
  PauseCircle,
  Loader2,
  FileSignature,
  Heart,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { Agreement, AgreementType } from "@/types/agreement";

// Type badge colors
const TYPE_COLORS: Record<AgreementType, string> = {
  LIABILITY_WAIVER: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  TERMS_CONDITIONS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HEALTH_DISCLOSURE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  PRIVACY_POLICY: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  PHOTO_CONSENT: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  MARKETING_CONSENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  RULES_REGULATIONS: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CUSTOM: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

// Type labels
const TYPE_LABELS: Record<AgreementType, { en: string; ar: string }> = {
  LIABILITY_WAIVER: { en: "Liability Waiver", ar: "إخلاء المسؤولية" },
  TERMS_CONDITIONS: { en: "Terms & Conditions", ar: "الشروط والأحكام" },
  HEALTH_DISCLOSURE: { en: "Health Disclosure", ar: "الإفصاح الصحي" },
  PRIVACY_POLICY: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  PHOTO_CONSENT: { en: "Photo Consent", ar: "موافقة التصوير" },
  MARKETING_CONSENT: { en: "Marketing Consent", ar: "موافقة التسويق" },
  RULES_REGULATIONS: { en: "Rules & Regulations", ar: "القواعد واللوائح" },
  CUSTOM: { en: "Custom", ar: "مخصص" },
};

interface AgreementColumnsOptions {
  locale: string;
  onView: (agreement: Agreement) => void;
  onEdit: (agreement: Agreement) => void;
  onDelete: (agreement: Agreement) => void;
  onActivate: (agreement: Agreement) => void;
  onDeactivate: (agreement: Agreement) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  pendingAgreementId?: string | null;
}

export function getAgreementColumns(
  options: AgreementColumnsOptions
): ColumnDef<Agreement>[] {
  const {
    locale,
    onView,
    onEdit,
    onDelete,
    onActivate,
    onDeactivate,
    canEdit = true,
    canDelete = true,
    pendingAgreementId,
  } = options;

  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const texts = {
    title: isArabic ? "العنوان" : "Title",
    type: isArabic ? "النوع" : "Type",
    mandatory: isArabic ? "إلزامي" : "Mandatory",
    status: isArabic ? "الحالة" : "Status",
    version: isArabic ? "الإصدار" : "Version",
    effectiveDate: isArabic ? "تاريخ السريان" : "Effective Date",
    actions: isArabic ? "الإجراءات" : "Actions",
    view: isArabic ? "عرض" : "View",
    edit: isArabic ? "تعديل" : "Edit",
    delete: isArabic ? "حذف" : "Delete",
    activate: isArabic ? "تفعيل" : "Activate",
    deactivate: isArabic ? "إلغاء التفعيل" : "Deactivate",
    active: isArabic ? "مفعل" : "Active",
    inactive: isArabic ? "غير مفعل" : "Inactive",
    yes: isArabic ? "نعم" : "Yes",
    no: isArabic ? "لا" : "No",
    hasHealthQuestions: isArabic ? "أسئلة صحية" : "Health Questions",
  };

  return [
    {
      accessorKey: "title",
      header: texts.title,
      cell: ({ row }) => {
        const title = isArabic
          ? row.original.title.ar || row.original.title.en
          : row.original.title.en;
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileSignature className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="font-medium truncate block max-w-[200px]">
                {title}
              </span>
              {row.original.hasHealthQuestions && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3" />
                  {texts.hasHealthQuestions}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: texts.type,
      cell: ({ row }) => {
        const type = row.original.type;
        const label = TYPE_LABELS[type];
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[type]}`}
          >
            {isArabic ? label.ar : label.en}
          </span>
        );
      },
    },
    {
      accessorKey: "isMandatory",
      header: texts.mandatory,
      cell: ({ row }) => {
        const isMandatory = row.original.isMandatory ?? row.original.mandatory ?? false;
        return (
          <div className="flex items-center gap-1">
            {isMandatory ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">{texts.yes}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{texts.no}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: texts.status,
      cell: ({ row }) => {
        const isActive = row.original.isActive ?? row.original.active ?? false;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? texts.active : texts.inactive}
          </Badge>
        );
      },
    },
    {
      accessorKey: "version",
      header: texts.version,
      cell: ({ row }) => (
        <span className="text-sm font-mono">v{row.original.agreementVersion}</span>
      ),
    },
    {
      accessorKey: "effectiveDate",
      header: texts.effectiveDate,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.effectiveDate), "PP", {
            locale: dateLocale,
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const agreement = row.original;
        const isPendingForThis = pendingAgreementId === agreement.id;
        const isAnyPending =
          pendingAgreementId !== null && pendingAgreementId !== undefined;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isAnyPending}>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                {isPendingForThis ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isArabic ? "start" : "end"}>
              <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(agreement)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(agreement)}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canEdit && (agreement.isActive ?? agreement.active ?? false) && (
                <DropdownMenuItem onClick={() => onDeactivate(agreement)}>
                  <PauseCircle className="me-2 h-4 w-4" />
                  {texts.deactivate}
                </DropdownMenuItem>
              )}
              {canEdit && !(agreement.isActive ?? agreement.active ?? false) && (
                <DropdownMenuItem onClick={() => onActivate(agreement)}>
                  <PlayCircle className="me-2 h-4 w-4" />
                  {texts.activate}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(agreement)}
                  >
                    <Trash2 className="me-2 h-4 w-4" />
                    {texts.delete}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

// Export type labels for use in form
export { TYPE_LABELS, TYPE_COLORS };
