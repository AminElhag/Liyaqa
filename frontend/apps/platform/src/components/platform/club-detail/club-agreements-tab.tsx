"use client";

import { useState } from "react";
import {
  FileSignature,
  Loader2,
  Plus,
  CheckCircle2,
  Heart,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@liyaqa/shared/components/ui/alert-dialog";
import {
  useClubAgreements,
  useActivateClubAgreement,
  useDeactivateClubAgreement,
  useDeleteClubAgreement,
} from "@liyaqa/shared/queries/platform/use-club-agreements";
import { AgreementFormDialog } from "./agreement-form-dialog";
import type { Agreement, AgreementType } from "@liyaqa/shared/types/agreement";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";

interface ClubAgreementsTabProps {
  clubId: string;
  locale: string;
}

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

export function ClubAgreementsTab({ clubId, locale }: ClubAgreementsTabProps) {
  const [page, setPage] = useState(0);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [deleteAgreement, setDeleteAgreement] = useState<Agreement | null>(null);
  const [pendingAgreementId, setPendingAgreementId] = useState<string | null>(null);

  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const { data, isLoading } = useClubAgreements(clubId, { page, size: 10 });
  const activateMutation = useActivateClubAgreement(clubId);
  const deactivateMutation = useDeactivateClubAgreement(clubId);
  const deleteMutation = useDeleteClubAgreement(clubId);

  const texts = {
    agreements: isArabic ? "الاتفاقيات" : "Agreements",
    noAgreements: isArabic ? "لا توجد اتفاقيات" : "No agreements found",
    addAgreement: isArabic ? "إضافة اتفاقية" : "Add Agreement",
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
    healthQuestions: isArabic ? "أسئلة صحية" : "Health Questions",
    deleteTitle: isArabic ? "حذف الاتفاقية؟" : "Delete Agreement?",
    deleteDesc: isArabic
      ? "هل أنت متأكد من حذف هذه الاتفاقية؟"
      : "Are you sure you want to delete this agreement?",
    cancel: isArabic ? "إلغاء" : "Cancel",
    agreementDeleted: isArabic ? "تم حذف الاتفاقية" : "Agreement deleted",
    agreementActivated: isArabic ? "تم تفعيل الاتفاقية" : "Agreement activated",
    agreementDeactivated: isArabic ? "تم إلغاء تفعيل الاتفاقية" : "Agreement deactivated",
    actionFailed: isArabic ? "فشل في تنفيذ الإجراء" : "Action failed",
  };

  const handleActivate = async (agreement: Agreement) => {
    setPendingAgreementId(agreement.id);
    try {
      await activateMutation.mutateAsync(agreement.id);
      toast.success(texts.agreementActivated);
    } catch {
      toast.error(texts.actionFailed);
    } finally {
      setPendingAgreementId(null);
    }
  };

  const handleDeactivate = async (agreement: Agreement) => {
    setPendingAgreementId(agreement.id);
    try {
      await deactivateMutation.mutateAsync(agreement.id);
      toast.success(texts.agreementDeactivated);
    } catch {
      toast.error(texts.actionFailed);
    } finally {
      setPendingAgreementId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteAgreement) return;
    setPendingAgreementId(deleteAgreement.id);
    try {
      await deleteMutation.mutateAsync(deleteAgreement.id);
      toast.success(texts.agreementDeleted);
    } catch {
      toast.error(texts.actionFailed);
    } finally {
      setDeleteAgreement(null);
      setPendingAgreementId(null);
    }
  };

  const handleView = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setFormDialogOpen(true);
  };

  const handleEdit = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setFormDialogOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedAgreement(null);
    setFormDialogOpen(true);
  };

  const columns: ColumnDef<Agreement>[] = [
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
                  {texts.healthQuestions}
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
        const isAnyPending = pendingAgreementId !== null;

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
              <DropdownMenuItem onClick={() => handleView(agreement)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(agreement)}>
                <Edit className="me-2 h-4 w-4" />
                {texts.edit}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(agreement.isActive ?? agreement.active ?? false) && (
                <DropdownMenuItem onClick={() => handleDeactivate(agreement)}>
                  <PauseCircle className="me-2 h-4 w-4" />
                  {texts.deactivate}
                </DropdownMenuItem>
              )}
              {!(agreement.isActive ?? agreement.active ?? false) && (
                <DropdownMenuItem onClick={() => handleActivate(agreement)}>
                  <PlayCircle className="me-2 h-4 w-4" />
                  {texts.activate}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteAgreement(agreement)}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {texts.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{texts.agreements}</CardTitle>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 me-2" />
            {texts.addAgreement}
          </Button>
        </CardHeader>
        <CardContent>
          {!data?.content.length ? (
            <div className="py-10 text-center text-muted-foreground">
              {texts.noAgreements}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data.content}
              pageCount={data.totalPages}
              pageIndex={page}
              onPageChange={setPage}
              manualPagination
            />
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <AgreementFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        agreement={selectedAgreement}
        clubId={clubId}
        locale={locale}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAgreement} onOpenChange={() => setDeleteAgreement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{texts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {texts.deleteDesc}
              {deleteAgreement && (
                <span className="block mt-2 font-medium">
                  {isArabic
                    ? deleteAgreement.title.ar || deleteAgreement.title.en
                    : deleteAgreement.title.en}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{texts.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {texts.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
