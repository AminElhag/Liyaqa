"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Edit, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { VoucherForm } from "@/components/forms/voucher-form";
import {
  useVoucher,
  useUpdateVoucher,
  useVoucherUsage,
  useActivateVoucher,
  useDeactivateVoucher,
} from "@/queries/use-vouchers";
import { DISCOUNT_TYPE_LABELS } from "@/types/voucher";
import type { CreateVoucherRequest } from "@/types/voucher";
import { toast } from "sonner";

export default function VoucherDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const voucherId = params.id as string;
  const isEditMode = searchParams.get("edit") === "true";

  const { data: voucher, isLoading } = useVoucher(voucherId);
  const { data: usageData } = useVoucherUsage(voucherId);
  const updateMutation = useUpdateVoucher();
  const activateMutation = useActivateVoucher();
  const deactivateMutation = useDeactivateVoucher();

  const handleUpdate = async (data: CreateVoucherRequest) => {
    try {
      await updateMutation.mutateAsync({ id: voucherId, data });
      toast.success(isArabic ? "تم تحديث القسيمة" : "Voucher updated");
      router.push(`/${locale}/vouchers/${voucherId}`);
    } catch {
      toast.error(isArabic ? "فشل في التحديث" : "Failed to update");
    }
  };

  const handleToggleActive = async () => {
    try {
      if (voucher?.isActive) {
        await deactivateMutation.mutateAsync(voucherId);
        toast.success(isArabic ? "تم تعطيل القسيمة" : "Voucher deactivated");
      } else {
        await activateMutation.mutateAsync(voucherId);
        toast.success(isArabic ? "تم تفعيل القسيمة" : "Voucher activated");
      }
    } catch {
      toast.error(isArabic ? "فشل في العملية" : "Operation failed");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isArabic ? "القسيمة غير موجودة" : "Voucher not found"}
        </p>
      </div>
    );
  }

  const discountLabel = DISCOUNT_TYPE_LABELS[voucher.discountType];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/vouchers`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {voucher.code}
              </h1>
              <Badge variant={voucher.isActive ? "default" : "secondary"}>
                {voucher.isActive
                  ? isArabic ? "نشط" : "Active"
                  : isArabic ? "غير نشط" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {isArabic ? voucher.nameAr || voucher.nameEn : voucher.nameEn}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleToggleActive}>
            {voucher.isActive ? (
              <>
                <PowerOff className="h-4 w-4 me-2" />
                {isArabic ? "تعطيل" : "Deactivate"}
              </>
            ) : (
              <>
                <Power className="h-4 w-4 me-2" />
                {isArabic ? "تفعيل" : "Activate"}
              </>
            )}
          </Button>
          {!isEditMode && (
            <Link href={`/${locale}/vouchers/${voucherId}?edit=true`}>
              <Button>
                <Edit className="h-4 w-4 me-2" />
                {isArabic ? "تعديل" : "Edit"}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isEditMode ? (
        <div className="max-w-3xl">
          <VoucherForm
            voucher={voucher}
            onSubmit={handleUpdate}
            isPending={updateMutation.isPending}
          />
        </div>
      ) : (
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">
              {isArabic ? "التفاصيل" : "Details"}
            </TabsTrigger>
            <TabsTrigger value="usage">
              {isArabic ? "سجل الاستخدام" : "Usage History"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{isArabic ? "تفاصيل الخصم" : "Discount Details"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? "النوع" : "Type"}</span>
                    <Badge>{isArabic ? discountLabel.ar : discountLabel.en}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? "القيمة" : "Value"}</span>
                    <span className="font-medium">
                      {voucher.discountType === "PERCENTAGE"
                        ? `${voucher.discountPercent}%`
                        : voucher.discountType === "FREE_TRIAL"
                        ? `${voucher.freeTrialDays} ${isArabic ? "يوم" : "days"}`
                        : `${voucher.discountAmount || voucher.giftCardBalance} ${voucher.discountCurrency}`}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{isArabic ? "إحصائيات الاستخدام" : "Usage Stats"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {isArabic ? "عدد الاستخدامات" : "Times Used"}
                    </span>
                    <span className="font-medium">{voucher.currentUseCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {isArabic ? "الحد الأقصى" : "Max Uses"}
                    </span>
                    <span className="font-medium">
                      {voucher.maxUses || (isArabic ? "غير محدود" : "Unlimited")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? "سجل الاستخدام" : "Usage History"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {usageData?.content?.length === 0
                    ? isArabic ? "لا يوجد استخدام بعد" : "No usage yet"
                    : `${usageData?.totalElements || 0} ${isArabic ? "استخدام" : "uses"}`}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
