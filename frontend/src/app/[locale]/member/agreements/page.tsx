"use client";

import { useLocale } from "next-intl";
import { FileCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AgreementList } from "@/components/member/agreement-list";
import { useMyAgreementStatus } from "@/queries/use-agreements";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MemberShell } from "@/components/layouts/member-shell";

export default function MemberAgreementsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: status, isLoading, error } = useMyAgreementStatus();

  const pendingAgreements = status?.pendingMandatoryAgreements || [];
  const signedAgreements = status?.signedAgreements || [];
  const allSigned = status?.allMandatorySigned ?? true;

  return (
    <MemberShell>
      <div className="space-y-6">
        <PageHeader
          title={isArabic ? "الاتفاقيات" : "Agreements"}
          description={
            isArabic
              ? "عرض وتوقيع اتفاقيات العضوية"
              : "View and sign membership agreements"
          }
        >
          {!isLoading && !allSigned && (
            <Badge variant="destructive" className="text-sm">
              {pendingAgreements.length}{" "}
              {isArabic ? "تحتاج توقيع" : "pending"}
            </Badge>
          )}
        </PageHeader>

        {/* Warning Alert for Pending Mandatory Agreements */}
        {!isLoading && !allSigned && (
          <Alert variant="destructive">
            <FileCheck className="h-4 w-4" />
            <AlertTitle>
              {isArabic ? "مطلوب توقيع" : "Signature Required"}
            </AlertTitle>
            <AlertDescription>
              {isArabic
                ? "لديك اتفاقيات إلزامية تحتاج إلى توقيعك للاستمرار في استخدام خدماتنا."
                : "You have mandatory agreements that require your signature to continue using our services."}
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="py-6 text-center text-destructive">
              {isArabic
                ? "حدث خطأ أثناء تحميل الاتفاقيات"
                : "Error loading agreements"}
            </CardContent>
          </Card>
        )}

        {/* Agreement List */}
        <AgreementList
          pendingAgreements={pendingAgreements}
          signedAgreements={signedAgreements}
          isLoading={isLoading}
        />

        {/* All Signed Success State */}
        {!isLoading && allSigned && signedAgreements.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-6 text-center">
              <FileCheck className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="font-medium text-green-900">
                {isArabic
                  ? "لقد وقعت على جميع الاتفاقيات الإلزامية"
                  : "You have signed all mandatory agreements"}
              </p>
              <p className="text-sm text-green-700 mt-1">
                {isArabic
                  ? "شكراً لك على استكمال جميع المتطلبات"
                  : "Thank you for completing all requirements"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MemberShell>
  );
}
