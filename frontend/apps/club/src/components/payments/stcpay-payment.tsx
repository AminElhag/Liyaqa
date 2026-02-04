"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@liyaqa/shared/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Smartphone } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { saudiPaymentTexts } from "@liyaqa/shared/types/saudi-payments";
import {
  useInitiateSTCPayPayment,
  useConfirmSTCPayPayment,
} from "@liyaqa/shared/queries/use-saudi-payments";

interface STCPayPaymentProps {
  invoiceId: string;
  amount: number;
  currency?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

type PaymentStep = "mobile" | "otp" | "success" | "error";

export function STCPayPayment({
  invoiceId,
  amount,
  currency = "SAR",
  onSuccess,
  onError,
  className,
}: STCPayPaymentProps) {
  const locale = useLocale();
  const texts = saudiPaymentTexts[locale as "en" | "ar"];
  const isRtl = locale === "ar";

  const [step, setStep] = useState<PaymentStep>("mobile");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initiateMutation = useInitiateSTCPayPayment();
  const confirmMutation = useConfirmSTCPayPayment();

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (expiresIn && expiresIn > 0 && step === "otp") {
      const timer = setTimeout(() => {
        setExpiresIn(expiresIn - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [expiresIn, step]);

  const handleInitiate = async () => {
    setError(null);
    try {
      const result = await initiateMutation.mutateAsync({
        invoiceId,
        request: { mobileNumber },
      });

      if (result.success) {
        setTransactionId(result.transactionId || null);
        setExpiresIn(result.expiresIn || 300);
        setStep("otp");
      } else {
        setError(locale === "ar" ? result.messageAr : result.messageEn);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : texts.common.error;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    try {
      const result = await confirmMutation.mutateAsync({
        invoiceId,
        request: { otp },
      });

      if (result.success) {
        setStep("success");
        onSuccess?.();
      } else {
        setError(locale === "ar" ? result.messageAr : result.messageEn);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : texts.common.error;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const formatMobileNumber = (value: string) => {
    // Remove non-digits and format as Saudi mobile
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 10) {
      return digits;
    }
    return digits.slice(0, 10);
  };

  if (step === "success") {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardContent className="pt-6">
          <div
            className={cn(
              "flex flex-col items-center text-center gap-4",
              isRtl && "text-right"
            )}
          >
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">
                {texts.stcPay.paymentSuccess}
              </h3>
              <p className="text-sm text-green-600 mt-1">
                {amount.toLocaleString(locale === "ar" ? "ar-SA" : "en-SA")} {currency}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={cn(isRtl && "text-right")}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#4F008C] flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>{texts.stcPay.name}</CardTitle>
            <CardDescription>{texts.stcPay.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{texts.common.error}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "mobile" && (
          <div className="space-y-4">
            <p className={cn("text-sm text-muted-foreground", isRtl && "text-right")}>
              {texts.stcPay.enterMobile}
            </p>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber" className={cn(isRtl && "text-right block")}>
                {texts.stcPay.mobileNumber}
              </Label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder={texts.stcPay.mobilePlaceholder}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(formatMobileNumber(e.target.value))}
                className={cn("text-lg tracking-wider", isRtl && "text-right")}
                dir="ltr"
              />
            </div>
            <Button
              onClick={handleInitiate}
              disabled={mobileNumber.length < 10 || initiateMutation.isPending}
              className="w-full bg-[#4F008C] hover:bg-[#3D0070]"
            >
              {initiateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="mx-2">{texts.common.processing}</span>
                </>
              ) : (
                texts.stcPay.initiatePayment
              )}
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <p className={cn("text-sm text-muted-foreground", isRtl && "text-right")}>
              {texts.stcPay.enterOtp}
            </p>

            {expiresIn !== null && expiresIn > 0 && (
              <div className={cn("text-sm text-amber-600 font-medium", isRtl && "text-right")}>
                {texts.stcPay.expiresIn}: {Math.floor(expiresIn / 60)}:
                {String(expiresIn % 60).padStart(2, "0")} {texts.stcPay.seconds}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp" className={cn(isRtl && "text-right block")}>
                {texts.stcPay.otp}
              </Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder={texts.stcPay.otpPlaceholder}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-2xl tracking-[0.5em] text-center font-mono"
                dir="ltr"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("mobile");
                  setOtp("");
                  setError(null);
                }}
                className="flex-1"
              >
                {texts.common.back}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={otp.length < 6 || confirmMutation.isPending}
                className="flex-1 bg-[#4F008C] hover:bg-[#3D0070]"
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="mx-2">{texts.common.processing}</span>
                  </>
                ) : (
                  texts.stcPay.confirmPayment
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
