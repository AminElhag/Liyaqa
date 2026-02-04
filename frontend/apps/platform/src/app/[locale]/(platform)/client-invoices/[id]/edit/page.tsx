"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { InvoiceForm } from "@liyaqa/shared/components/platform/invoice-form";
import { useClientInvoice } from "@liyaqa/shared/queries/platform/use-client-invoices";

export default function EditClientInvoicePage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const locale = useLocale();

  const { data: invoice, isLoading, error } = useClientInvoice(invoiceId);

  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    title: locale === "ar" ? "تعديل الفاتورة" : "Edit Invoice",
    description:
      locale === "ar"
        ? "تعديل ملاحظات الفاتورة"
        : "Edit invoice notes",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    notFound: locale === "ar" ? "الفاتورة غير موجودة" : "Invoice not found",
    errorLoading:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    cannotEdit:
      locale === "ar"
        ? "لا يمكن تعديل هذه الفاتورة"
        : "This invoice cannot be edited",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorLoading : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  // Only draft invoices can be fully edited, others can only have notes edited
  const canEdit = invoice.status === "DRAFT";

  if (!canEdit && invoice.status !== "ISSUED") {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {texts.cannotEdit}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/client-invoices/${invoiceId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">
            {texts.description} - <span className="font-mono">{invoice.invoiceNumber}</span>
          </p>
        </div>
      </div>

      {/* Form */}
      <InvoiceForm invoice={invoice} mode="edit" />
    </div>
  );
}
