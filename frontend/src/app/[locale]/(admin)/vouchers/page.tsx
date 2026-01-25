"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Plus, Ticket, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { getVoucherColumns } from "@/components/admin/voucher-columns";
import {
  useVouchers,
  useDeleteVoucher,
  useActivateVoucher,
  useDeactivateVoucher,
} from "@/queries/use-vouchers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Voucher } from "@/types/voucher";
import { toast } from "sonner";

export default function VouchersPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const [page, setPage] = useState(0);
  const [deleteVoucher, setDeleteVoucher] = useState<Voucher | null>(null);

  const { data, isLoading, refetch } = useVouchers({ page, size: 20 });
  const deleteMutation = useDeleteVoucher();
  const activateMutation = useActivateVoucher();
  const deactivateMutation = useDeactivateVoucher();

  const handleView = (voucher: Voucher) => {
    router.push(`/${locale}/vouchers/${voucher.id}`);
  };

  const handleEdit = (voucher: Voucher) => {
    router.push(`/${locale}/vouchers/${voucher.id}?edit=true`);
  };

  const handleDelete = async () => {
    if (!deleteVoucher) return;
    try {
      await deleteMutation.mutateAsync(deleteVoucher.id);
      toast.success(isArabic ? "تم حذف القسيمة" : "Voucher deleted");
    } catch {
      toast.error(isArabic ? "فشل في الحذف" : "Failed to delete");
    } finally {
      setDeleteVoucher(null);
    }
  };

  const handleActivate = async (voucher: Voucher) => {
    try {
      await activateMutation.mutateAsync(voucher.id);
      toast.success(isArabic ? "تم تفعيل القسيمة" : "Voucher activated");
    } catch {
      toast.error(isArabic ? "فشل في التفعيل" : "Failed to activate");
    }
  };

  const handleDeactivate = async (voucher: Voucher) => {
    try {
      await deactivateMutation.mutateAsync(voucher.id);
      toast.success(isArabic ? "تم تعطيل القسيمة" : "Voucher deactivated");
    } catch {
      toast.error(isArabic ? "فشل في التعطيل" : "Failed to deactivate");
    }
  };

  const columns = getVoucherColumns({
    isArabic,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: setDeleteVoucher,
    onActivate: handleActivate,
    onDeactivate: handleDeactivate,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "القسائم" : "Vouchers"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة أكواد الخصم والعروض الترويجية"
              : "Manage discount codes and promotional offers"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href={`/${locale}/vouchers/new`}>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {isArabic ? "إضافة قسيمة" : "Add Voucher"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            {isArabic ? "القسائم النشطة" : "Active Vouchers"}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? "أكواد الخصم المتاحة للأعضاء"
              : "Discount codes available for members"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.content ?? []}
            isLoading={isLoading}
            pageCount={data?.totalPages ?? 0}
            pageIndex={page}
            onPageChange={setPage}
            manualPagination
          />
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteVoucher} onOpenChange={() => setDeleteVoucher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabic ? "حذف القسيمة؟" : "Delete Voucher?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? `هل أنت متأكد من حذف "${deleteVoucher?.code}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${deleteVoucher?.code}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isArabic ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
