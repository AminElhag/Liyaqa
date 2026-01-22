"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { saudiPaymentTexts } from "@/types/saudi-payments";
import {
  useTamaraPaymentOptions,
  useCreateTamaraCheckout,
} from "@/queries/use-saudi-payments";

interface TamaraWidgetProps {
  invoiceId: string;
  amount: number;
  currency?: string;
  onCheckoutCreated?: (checkoutUrl: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function TamaraWidget({
  invoiceId,
  amount,
  currency = "SAR",
  onCheckoutCreated,
  onError,
  className,
}: TamaraWidgetProps) {
  const locale = useLocale();
  const texts = saudiPaymentTexts[locale as "en" | "ar"];
  const isRtl = locale === "ar";

  const [selectedInstalments, setSelectedInstalments] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);

  const { data: options, isLoading: optionsLoading } = useTamaraPaymentOptions(
    amount,
    amount > 0
  );
  const checkoutMutation = useCreateTamaraCheckout();

  const handleCheckout = async () => {
    setError(null);
    try {
      const result = await checkoutMutation.mutateAsync({
        invoiceId,
        request: { instalments: selectedInstalments },
      });

      if (result.success && result.checkoutUrl) {
        onCheckoutCreated?.(result.checkoutUrl);
        // Redirect to Tamara checkout
        window.location.href = result.checkoutUrl;
      } else {
        const errorMessage = locale === "ar" ? result.messageAr : result.messageEn;
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : texts.common.error;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const formatAmount = (value: number) => {
    return value.toLocaleString(locale === "ar" ? "ar-SA" : "en-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (optionsLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[#3DCEA3]" />
            <span className="text-muted-foreground">{texts.common.processing}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!options?.available) {
    return (
      <Card className={cn("border-amber-200 bg-amber-50", className)}>
        <CardContent className="py-6">
          <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div className={cn(isRtl && "text-right")}>
              <p className="font-medium text-amber-700">
                {texts.tamara.notEligible}
              </p>
              <p className="text-sm text-amber-600">
                {texts.tamara.minAmount}: {formatAmount(options?.minAmount || 100)} {currency} -{" "}
                {texts.tamara.maxAmount}: {formatAmount(options?.maxAmount || 5000)} {currency}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-[#3DCEA3]/30", className)}>
      <CardHeader className={cn(isRtl && "text-right")}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#3DCEA3] flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              {texts.tamara.name}
              <Badge variant="secondary" className="bg-[#3DCEA3]/10 text-[#3DCEA3]">
                {texts.tamara.noInterest}
              </Badge>
            </CardTitle>
            <CardDescription>{texts.tamara.description}</CardDescription>
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

        <RadioGroup
          value={String(selectedInstalments)}
          onValueChange={(value) => setSelectedInstalments(Number(value))}
          className="space-y-3"
        >
          {/* Pay in 3 option */}
          {options.payIn3 && (
            <InstalmentOption
              id="3"
              instalments={3}
              amount={options.payIn3.instalmentsAmount}
              currency={currency}
              label={texts.tamara.payIn3}
              isSelected={selectedInstalments === 3}
              isRtl={isRtl}
              locale={locale}
              texts={texts}
            />
          )}

          {/* Pay in 4 option */}
          {options.payIn4 && (
            <InstalmentOption
              id="4"
              instalments={4}
              amount={options.payIn4.instalmentsAmount}
              currency={currency}
              label={texts.tamara.payIn4}
              isSelected={selectedInstalments === 4}
              isRtl={isRtl}
              locale={locale}
              texts={texts}
            />
          )}
        </RadioGroup>

        <div className={cn("pt-2", isRtl && "text-right")}>
          <p className="text-xs text-muted-foreground mb-3">
            {locale === "ar"
              ? "سيتم تحويلك إلى تمارا لإكمال عملية الدفع"
              : "You will be redirected to Tamara to complete payment"}
          </p>
          <Button
            onClick={handleCheckout}
            disabled={checkoutMutation.isPending}
            className="w-full bg-[#3DCEA3] hover:bg-[#35B890] text-white"
          >
            {checkoutMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="mx-2">{texts.common.processing}</span>
              </>
            ) : (
              <>
                <span>{texts.tamara.checkout}</span>
                <ExternalLink className="h-4 w-4 mx-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface InstalmentOptionProps {
  id: string;
  instalments: number;
  amount: number;
  currency: string;
  label: string;
  isSelected: boolean;
  isRtl: boolean;
  locale: string;
  texts: typeof saudiPaymentTexts.en;
}

function InstalmentOption({
  id,
  instalments,
  amount,
  currency,
  label,
  isSelected,
  isRtl,
  locale,
  texts,
}: InstalmentOptionProps) {
  const formatAmount = (value: number) => {
    return value.toLocaleString(locale === "ar" ? "ar-SA" : "en-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-all",
        isSelected
          ? "border-[#3DCEA3] bg-[#3DCEA3]/5"
          : "border-border hover:border-[#3DCEA3]/50",
        isRtl && "flex-row-reverse"
      )}
    >
      <RadioGroupItem value={id} id={`tamara-${id}`} className="text-[#3DCEA3]" />
      <div className={cn("flex-1", isRtl && "text-right")}>
        <Label htmlFor={`tamara-${id}`} className="text-base font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">
          {instalments} {texts.tamara.instalmentsOf}{" "}
          <span className="font-semibold text-foreground">
            {formatAmount(amount)} {texts.tamara.sar}
          </span>
        </p>
      </div>
      <div
        className={cn(
          "flex gap-1",
          isRtl && "flex-row-reverse"
        )}
      >
        {Array.from({ length: instalments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-6 h-2 rounded-full",
              i === 0 ? "bg-[#3DCEA3]" : "bg-[#3DCEA3]/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
