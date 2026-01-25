"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Gift, ArrowRight } from "lucide-react";
import { trackReferralClick, getReferralCodeInfo } from "@/lib/api/referrals";

export default function ReferralLandingPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const isArabic = locale === "ar";
  const code = params.code as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    const validateAndTrack = async () => {
      try {
        // First get info about the code
        const info = await getReferralCodeInfo(code);

        if (!info.valid) {
          setIsValid(false);
          setIsLoading(false);
          return;
        }

        setIsValid(true);
        setReferrerName(info.referrerName || null);

        // Track the click
        const result = await trackReferralClick(code);
        setTracked(result.success);

        // Store referral code in session for signup
        if (result.success && result.referralId) {
          sessionStorage.setItem("referralCode", code);
          sessionStorage.setItem("referralId", result.referralId);
        }
      } catch (error) {
        console.error("Failed to validate referral code:", error);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateAndTrack();
  }, [code]);

  const handleSignUp = () => {
    // Navigate to signup with referral code
    router.push(`/${locale}/signup?ref=${code}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">
              {isArabic ? "جاري التحقق من الرابط..." : "Validating referral link..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 to-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle>
              {isArabic ? "رابط غير صالح" : "Invalid Referral Link"}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? "هذا الرابط غير صالح أو قد انتهت صلاحيته"
                : "This referral link is invalid or has expired"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push(`/${locale}`)}>
              {isArabic ? "الذهاب للرئيسية" : "Go to Homepage"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Gift className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {isArabic ? "مرحباً بك!" : "Welcome!"}
          </CardTitle>
          {referrerName && (
            <CardDescription className="text-lg">
              {isArabic
                ? `تمت دعوتك من قبل ${referrerName}`
                : `You've been invited by ${referrerName}`}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {isArabic ? "كود الإحالة" : "Referral Code"}
            </p>
            <p className="text-2xl font-mono font-bold tracking-wider">{code}</p>
          </div>

          {tracked && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              {isArabic ? "تم تسجيل الإحالة" : "Referral tracked"}
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={handleSignUp} className="w-full" size="lg">
              {isArabic ? "إنشاء حساب" : "Create Account"}
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {isArabic
                ? "سجّل الآن واستفد من مزايا الإحالة"
                : "Sign up now and enjoy referral benefits"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
