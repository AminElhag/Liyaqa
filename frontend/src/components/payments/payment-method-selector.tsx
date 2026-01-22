"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  saudiPaymentTexts,
  type SaudiPaymentMethod,
} from "@/types/saudi-payments";

interface PaymentMethodOption {
  id: SaudiPaymentMethod | "CARD";
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod: SaudiPaymentMethod | "CARD" | null;
  onSelect: (method: SaudiPaymentMethod | "CARD") => void;
  enabledMethods?: {
    stcPay?: boolean;
    sadad?: boolean;
    tamara?: boolean;
    card?: boolean;
  };
  className?: string;
}

// Icons for payment methods
const STCPayIcon = () => (
  <svg
    viewBox="0 0 40 40"
    className="h-8 w-8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="40" height="40" rx="8" fill="#4F008C" />
    <text
      x="50%"
      y="50%"
      dominantBaseline="middle"
      textAnchor="middle"
      fill="white"
      fontSize="12"
      fontWeight="bold"
    >
      STC
    </text>
  </svg>
);

const SadadIcon = () => (
  <svg
    viewBox="0 0 40 40"
    className="h-8 w-8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="40" height="40" rx="8" fill="#00529B" />
    <path d="M10 20h20M20 10v20" stroke="white" strokeWidth="3" />
  </svg>
);

const TamaraIcon = () => (
  <svg
    viewBox="0 0 40 40"
    className="h-8 w-8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="40" height="40" rx="8" fill="#3DCEA3" />
    <text
      x="50%"
      y="50%"
      dominantBaseline="middle"
      textAnchor="middle"
      fill="white"
      fontSize="10"
      fontWeight="bold"
    >
      T
    </text>
  </svg>
);

const CardIcon = () => (
  <svg
    viewBox="0 0 40 40"
    className="h-8 w-8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="40" height="40" rx="8" fill="#1A1A1A" />
    <rect x="8" y="12" width="24" height="16" rx="2" fill="white" />
    <rect x="8" y="16" width="24" height="4" fill="#333" />
    <rect x="10" y="22" width="8" height="3" rx="1" fill="#DDD" />
  </svg>
);

export function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  enabledMethods = {
    stcPay: true,
    sadad: true,
    tamara: true,
    card: true,
  },
  className,
}: PaymentMethodSelectorProps) {
  const locale = useLocale();
  const texts = saudiPaymentTexts[locale as "en" | "ar"];
  const isRtl = locale === "ar";

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: "STC_PAY",
      nameEn: texts.stcPay.name,
      nameAr: texts.stcPay.name,
      descriptionEn: texts.stcPay.description,
      descriptionAr: texts.stcPay.description,
      icon: <STCPayIcon />,
      enabled: enabledMethods.stcPay ?? true,
    },
    {
      id: "SADAD",
      nameEn: texts.sadad.name,
      nameAr: texts.sadad.name,
      descriptionEn: texts.sadad.description,
      descriptionAr: texts.sadad.description,
      icon: <SadadIcon />,
      enabled: enabledMethods.sadad ?? true,
    },
    {
      id: "TAMARA",
      nameEn: texts.tamara.name,
      nameAr: texts.tamara.name,
      descriptionEn: texts.tamara.description,
      descriptionAr: texts.tamara.description,
      icon: <TamaraIcon />,
      enabled: enabledMethods.tamara ?? true,
    },
    {
      id: "CARD",
      nameEn: "Credit/Debit Card",
      nameAr: "بطاقة ائتمان/خصم",
      descriptionEn: "Pay with Visa, Mastercard, or Mada",
      descriptionAr: "ادفع ببطاقة فيزا، ماستركارد، أو مدى",
      icon: <CardIcon />,
      enabled: enabledMethods.card ?? true,
    },
  ];

  const enabledPaymentMethods = paymentMethods.filter((m) => m.enabled);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className={cn(isRtl && "text-right")}>
          {texts.selectPaymentMethod}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMethod || ""}
          onValueChange={(value) =>
            onSelect(value as SaudiPaymentMethod | "CARD")
          }
          className="space-y-3"
        >
          {enabledPaymentMethods.map((method) => (
            <div
              key={method.id}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-all",
                selectedMethod === method.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                isRtl && "flex-row-reverse"
              )}
              onClick={() => onSelect(method.id)}
            >
              <RadioGroupItem
                value={method.id}
                id={method.id}
                className={cn(isRtl && "order-last")}
              />
              <div className="flex-shrink-0">{method.icon}</div>
              <div
                className={cn("flex-1 min-w-0", isRtl && "text-right")}
              >
                <Label
                  htmlFor={method.id}
                  className="text-base font-medium cursor-pointer"
                >
                  {locale === "ar" ? method.nameAr : method.nameEn}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? method.descriptionAr
                    : method.descriptionEn}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
