"use client";

import { QrCode } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UUID } from "@/types/api";

interface SessionQrCodeProps {
  sessionId: UUID;
  locale: string;
  className?: string;
}

export function SessionQrCode({
  sessionId,
  locale,
  className,
}: SessionQrCodeProps) {
  const texts = {
    title: locale === "ar" ? "رمز تسجيل الحضور" : "Check-in QR Code",
    description:
      locale === "ar"
        ? "اعرض هذا الرمز للأعضاء للمسح"
        : "Show this code to members to scan",
    comingSoon: locale === "ar" ? "قريباً" : "Coming Soon",
    featureNotAvailable:
      locale === "ar"
        ? "ميزة رمز QR قيد التطوير"
        : "QR code feature under development",
  };

  // TODO: Implement QR code functionality when backend endpoint is available
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          {texts.title}
        </CardTitle>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-52 flex flex-col items-center justify-center bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
          <QrCode className="h-16 w-16 text-neutral-300 mb-3" />
          <p className="text-sm font-medium text-neutral-500">{texts.comingSoon}</p>
          <p className="text-xs text-neutral-400 mt-1">{texts.featureNotAvailable}</p>
        </div>
      </CardContent>
    </Card>
  );
}
