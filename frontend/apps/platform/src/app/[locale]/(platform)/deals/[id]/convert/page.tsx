"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { ConvertDealWizard } from "@liyaqa/shared/components/platform/convert-deal-wizard";
import { useDeal, useConvertDeal } from "@liyaqa/shared/queries/platform/use-deals";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api/client";
import type { ConvertDealRequest, DealConversionResult } from "@liyaqa/shared/types/platform/deal";

export default function ConvertDealPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  // Safely extract dealId - handle case where params might not be ready
  const dealId = typeof params?.id === "string" ? params.id : "";

  const { data: deal, isPending, error } = useDeal(dealId);
  const convertDeal = useConvertDeal();

  const texts = {
    back: locale === "ar" ? "العودة إلى الصفقة" : "Back to Deal",
    title: locale === "ar" ? "تحويل إلى عميل" : "Convert to Client",
    description:
      locale === "ar"
        ? "تحويل هذه الصفقة إلى عميل جديد"
        : "Convert this deal into a new client",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل الصفقة" : "Error loading deal",
    notFound: locale === "ar" ? "الصفقة غير موجودة" : "Deal not found",
    cannotConvert:
      locale === "ar"
        ? "لا يمكن تحويل هذه الصفقة"
        : "This deal cannot be converted",
    mustBeNegotiation:
      locale === "ar"
        ? "يجب أن تكون الصفقة في مرحلة التفاوض للتحويل"
        : "Deal must be in negotiation stage to convert",
    successTitle: locale === "ar" ? "تم التحويل بنجاح" : "Conversion Successful",
    successDesc:
      locale === "ar"
        ? "تم تحويل الصفقة إلى عميل جديد"
        : "Deal has been converted to a new client",
    errorTitle: locale === "ar" ? "فشل التحويل" : "Conversion Failed",
    errorDesc:
      locale === "ar"
        ? "حدث خطأ أثناء تحويل الصفقة"
        : "An error occurred while converting the deal",
  };

  const handleSubmit = (data: ConvertDealRequest) => {
    convertDeal.mutate(
      { id: dealId, data },
      {
        onSuccess: (result: DealConversionResult) => {
          toast({
            title: texts.successTitle,
            description: (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>
                  {locale === "ar"
                    ? `تم إنشاء: ${result.organizationName}`
                    : `Created: ${result.organizationName}`}
                </span>
              </div>
            ),
          });
          // Redirect to the new client detail page
          router.push(`/${locale}/clients/${result.organizationId}`);
        },
        onError: async (error) => {
          const apiError = await parseApiError(error);
          const errorMessage = getLocalizedErrorMessage(apiError, locale);
          toast({
            title: texts.errorTitle,
            description: errorMessage || texts.errorDesc,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCancel = () => {
    router.push(`/${locale}/deals/${dealId}`);
  };

  // Show loading while params or data are loading
  if (!dealId || isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.error : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  // Can only convert deals in NEGOTIATION status
  if (deal.status !== "NEGOTIATION") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/deals/${dealId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{texts.title}</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>{texts.cannotConvert}</p>
            <p className="text-sm mt-2">{texts.mustBeNegotiation}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/deals/${dealId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">
            {deal.facilityName || deal.contactName}
          </p>
        </div>
      </div>

      {/* Wizard */}
      <ConvertDealWizard
        deal={deal}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={convertDeal.isPending}
      />
    </div>
  );
}
