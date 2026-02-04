"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Award, Plus, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
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
  useTrainerCertifications,
  useCreateCertification,
  useUpdateCertification,
  useDeleteCertification,
} from "@liyaqa/shared/queries/use-trainer-portal";
import { useMyTrainerProfile } from "@liyaqa/shared/queries/use-trainers";
import { getCertificationsColumns } from "@/components/trainer/certifications-columns";
import { CertificationDialog } from "@/components/trainer/certification-dialog";
import type {
  TrainerCertificationResponse,
  CreateCertificationRequest,
  UpdateCertificationRequest,
} from "@liyaqa/shared/types/trainer-portal";
import type { CertificationFormValues } from "@liyaqa/shared/lib/validations/trainer-certification";
import { cn } from "@liyaqa/shared/utils";

export default function CertificationsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();

  // Get trainer profile
  const { data: trainerProfile } = useMyTrainerProfile();
  const trainerId = trainerProfile?.id;

  // State
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] =
    useState<TrainerCertificationResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [certificationToDelete, setCertificationToDelete] =
    useState<TrainerCertificationResponse | null>(null);

  // Fetch certifications
  const { data: certificationsData, isLoading } = useTrainerCertifications(
    trainerId,
    { page, size: pageSize }
  );

  // Mutations
  const createCertification = useCreateCertification();
  const updateCertification = useUpdateCertification();
  const deleteCertification = useDeleteCertification();

  const texts = {
    title: locale === "ar" ? "الشهادات والمؤهلات" : "Certifications & Qualifications",
    description:
      locale === "ar"
        ? "إدارة شهاداتك المهنية ومؤهلاتك"
        : "Manage your professional certifications and qualifications",
    addCertification: locale === "ar" ? "إضافة شهادة" : "Add Certification",
    noCertifications: locale === "ar" ? "لا توجد شهادات" : "No certifications found",
    error: locale === "ar" ? "خطأ" : "Error",
    created: locale === "ar" ? "تم إنشاء الشهادة بنجاح" : "Certification created successfully",
    updated: locale === "ar" ? "تم تحديث الشهادة بنجاح" : "Certification updated successfully",
    deleted: locale === "ar" ? "تم حذف الشهادة بنجاح" : "Certification deleted successfully",
    // Delete dialog
    deleteTitle: locale === "ar" ? "حذف الشهادة" : "Delete Certification",
    deleteDescription:
      locale === "ar"
        ? "هل أنت متأكد من حذف هذه الشهادة؟ لا يمكن التراجع عن هذا الإجراء."
        : "Are you sure you want to delete this certification? This action cannot be undone.",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    delete: locale === "ar" ? "حذف" : "Delete",
    // Expiry warnings
    expiringWarning: locale === "ar" ? "شهادات تنتهي قريباً" : "Certifications Expiring Soon",
    expiredWarning: locale === "ar" ? "شهادات منتهية" : "Expired Certifications",
    certificationsExpiring:
      locale === "ar"
        ? "لديك شهادات تنتهي خلال 30 يوماً"
        : "You have certifications expiring within 30 days",
    certificationsExpired:
      locale === "ar"
        ? "لديك شهادات منتهية"
        : "You have expired certifications",
  };

  // Calculate expiring/expired certifications
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const certifications = certificationsData?.content || [];

  const expiringCertifications = certifications.filter((cert) => {
    if (!cert.expiryDate) return false;
    const expiryDate = new Date(cert.expiryDate);
    return expiryDate > now && expiryDate <= thirtyDaysFromNow;
  });

  const expiredCertifications = certifications.filter((cert) => {
    if (!cert.expiryDate) return false;
    return new Date(cert.expiryDate) < now;
  });

  const handleAdd = () => {
    setSelectedCertification(null);
    setDialogOpen(true);
  };

  const handleEdit = (certification: TrainerCertificationResponse) => {
    setSelectedCertification(certification);
    setDialogOpen(true);
  };

  const handleDeleteClick = (certification: TrainerCertificationResponse) => {
    setCertificationToDelete(certification);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = (data: CertificationFormValues) => {
    if (!trainerId) return;

    if (selectedCertification) {
      // Update existing certification
      const updateData: UpdateCertificationRequest = data;
      updateCertification.mutate(
        { certificationId: selectedCertification.id, data: updateData },
        {
          onSuccess: () => {
            toast({ title: texts.updated });
            setDialogOpen(false);
            setSelectedCertification(null);
          },
          onError: (error: Error) => {
            toast({
              title: texts.error,
              description: error.message,
              variant: "destructive",
            });
          },
        }
      );
    } else {
      // Create new certification
      const createData: CreateCertificationRequest = data;
      createCertification.mutate(
        { trainerId, data: createData },
        {
          onSuccess: () => {
            toast({ title: texts.created });
            setDialogOpen(false);
          },
          onError: (error: Error) => {
            toast({
              title: texts.error,
              description: error.message,
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!certificationToDelete) return;

    deleteCertification.mutate(
      certificationToDelete.id,
      {
        onSuccess: () => {
          toast({ title: texts.deleted });
          setDeleteDialogOpen(false);
          setCertificationToDelete(null);
        },
        onError: (error: Error) => {
          toast({
            title: texts.error,
            description: error.message,
            variant: "destructive",
          });
          setDeleteDialogOpen(false);
          setCertificationToDelete(null);
        },
      }
    );
  };

  // Columns
  const columns = getCertificationsColumns({
    locale,
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
  });

  if (isLoading && !certificationsData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between",
          isRtl && "flex-row-reverse"
        )}
      >
        <div className={cn(isRtl && "text-right")}>
          <h1 className="text-3xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className={cn("h-4 w-4", !isRtl && "me-2", isRtl && "ms-2")} />
          {texts.addCertification}
        </Button>
      </div>

      {/* Warning Cards */}
      {expiredCertifications.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {texts.expiredWarning}
            </CardTitle>
            <CardDescription>
              {texts.certificationsExpired}: {expiredCertifications.length}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {expiringCertifications.length > 0 && !expiredCertifications.length && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              {texts.expiringWarning}
            </CardTitle>
            <CardDescription>
              {texts.certificationsExpiring}: {expiringCertifications.length}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Certifications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {texts.title}
          </CardTitle>
          <CardDescription>
            {certificationsData?.totalElements || 0} {texts.title.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={certifications}
            manualPagination
            pageCount={certificationsData?.totalPages || 1}
            pageIndex={page}
            pageSize={pageSize}
            totalRows={certificationsData?.totalElements}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <CertificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        certification={selectedCertification}
        isLoading={
          createCertification.isPending || updateCertification.isPending
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{texts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {texts.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{texts.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {texts.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
