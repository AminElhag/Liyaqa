"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoucherForm } from "@/components/forms/voucher-form";
import { useCreateVoucher } from "@/queries/use-vouchers";
import type { CreateVoucherRequest } from "@/types/voucher";
import { toast } from "sonner";

export default function NewVoucherPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const createMutation = useCreateVoucher();

  const handleSubmit = async (data: CreateVoucherRequest) => {
    try {
      const result = await createMutation.mutateAsync(data);
      toast.success(
        isArabic ? "تم إنشاء القسيمة بنجاح" : "Voucher created successfully"
      );
      router.push(`/${locale}/vouchers/${result.id}`);
    } catch {
      toast.error(isArabic ? "فشل في إنشاء القسيمة" : "Failed to create voucher");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/vouchers`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "إضافة قسيمة جديدة" : "Add New Voucher"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إنشاء كود خصم أو عرض ترويجي جديد"
              : "Create a new discount code or promotional offer"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <VoucherForm onSubmit={handleSubmit} isPending={createMutation.isPending} />
      </div>
    </div>
  );
}
