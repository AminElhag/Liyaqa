"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { InvoiceForm } from "@liyaqa/shared/components/platform/invoice-form";

export default function NewClientInvoicePage() {
  const locale = useLocale();

  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    title: locale === "ar" ? "إنشاء فاتورة جديدة" : "Create New Invoice",
    description:
      locale === "ar"
        ? "أنشئ فاتورة جديدة لعميل"
        : "Create a new invoice for a client",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/client-invoices`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Form */}
      <InvoiceForm mode="create" />
    </div>
  );
}
