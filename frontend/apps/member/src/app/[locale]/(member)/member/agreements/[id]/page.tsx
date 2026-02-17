"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { PageHeader } from "@liyaqa/shared/components/page-header";
import { AgreementViewer } from "@/components/member/agreement-viewer";
import { SignaturePad } from "@/components/member/signature-pad";
import { useAgreement, useSignMyAgreement } from "@liyaqa/shared/queries/use-agreements";
import { MemberShell } from "@/components/layouts/member-shell";
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

export default function SignAgreementPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const agreementId = params.id as string;

  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: agreement, isLoading } = useAgreement(agreementId);
  const signMutation = useSignMyAgreement();

  const handleSignatureCapture = (data: string) => {
    setSignatureData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSign = async () => {
    if (!signatureData) return;

    try {
      await signMutation.mutateAsync({
        agreementId,
        data: { signatureData },
      });

      toast({
        title: isArabic ? "تم التوقيع بنجاح" : "Successfully Signed",
        description: isArabic
          ? "تم توقيع الاتفاقية بنجاح"
          : "Agreement has been signed successfully",
      });

      router.push(`/${locale}/member/agreements`);
    } catch (error) {
      toast({
        title: isArabic ? "فشل التوقيع" : "Signing Failed",
        description: isArabic
          ? "حدث خطأ أثناء توقيع الاتفاقية. يرجى المحاولة مرة أخرى."
          : "An error occurred while signing the agreement. Please try again.",
        variant: "destructive",
      });
    }

    setShowConfirmDialog(false);
  };

  const title = isArabic
    ? agreement?.title?.ar || agreement?.title?.en
    : agreement?.title?.en;

  return (
    <MemberShell>
      <div className="space-y-6">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/member/agreements`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title={isArabic ? "توقيع الاتفاقية" : "Sign Agreement"}
            description={title || ""}
          />
        </div>

        {/* Agreement Viewer with Signature Pad */}
        <AgreementViewer
          agreement={agreement}
          isLoading={isLoading}
          showSignatureSection={true}
        >
          <SignaturePad
            onSign={handleSignatureCapture}
            onClear={() => setSignatureData(null)}
            disabled={signMutation.isPending}
            width={Math.min(400, typeof window !== "undefined" ? window.innerWidth - 64 : 400)}
            height={200}
          />
        </AgreementViewer>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {isArabic ? "تأكيد التوقيع" : "Confirm Signature"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isArabic
                  ? "بالمتابعة، فإنك توافق على الشروط والأحكام الواردة في هذه الاتفاقية. هذا التوقيع ملزم قانونياً."
                  : "By proceeding, you agree to the terms and conditions outlined in this agreement. This signature is legally binding."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Signature Preview */}
            {signatureData && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground mb-2">
                  {isArabic ? "معاينة التوقيع:" : "Signature Preview:"}
                </p>
                <img
                  src={signatureData}
                  alt="Your signature"
                  className="max-h-24 mx-auto"
                />
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={signMutation.isPending}>
                {isArabic ? "إلغاء" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmSign}
                disabled={signMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {signMutation.isPending ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {isArabic ? "جاري التوقيع..." : "Signing..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="me-2 h-4 w-4" />
                    {isArabic ? "تأكيد ووقّع" : "Confirm & Sign"}
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MemberShell>
  );
}
