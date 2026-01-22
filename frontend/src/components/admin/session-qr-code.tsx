"use client";

import { useEffect, useState } from "react";
import { QrCode, RefreshCw, Clock, Printer } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionQrCode } from "@/queries/use-sessions";
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
  const {
    data: qrData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useSessionQrCode(sessionId);

  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Update countdown timer
  useEffect(() => {
    if (!qrData?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(qrData.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(locale === "ar" ? "منتهي" : "Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(
          `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      } else {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [qrData?.expiresAt, locale]);

  // Generate QR code image URL using a QR code API
  const getQrCodeUrl = (token: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(token)}`;
  };

  const isExpired = qrData?.expiresAt
    ? new Date(qrData.expiresAt) <= new Date()
    : false;

  const handlePrint = () => {
    if (!qrData) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Session QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            img { margin: 20px 0; }
            h2 { margin: 0 0 10px; }
            p { margin: 0; color: #666; }
          </style>
        </head>
        <body>
          <h2>${locale === "ar" ? "رمز تسجيل الحضور" : "Session Check-in QR"}</h2>
          <img src="${getQrCodeUrl(qrData.token)}" alt="QR Code" />
          <p>${locale === "ar" ? "امسح للتسجيل" : "Scan to check in"}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const texts = {
    title: locale === "ar" ? "رمز تسجيل الحضور" : "Check-in QR Code",
    description:
      locale === "ar"
        ? "اعرض هذا الرمز للأعضاء للمسح"
        : "Show this code to members to scan",
    validFor: locale === "ar" ? "صالح لمدة:" : "Valid for:",
    expired: locale === "ar" ? "منتهي الصلاحية" : "Expired",
    refresh: locale === "ar" ? "تحديث الرمز" : "Refresh Code",
    refreshing: locale === "ar" ? "جاري التحديث..." : "Refreshing...",
    print: locale === "ar" ? "طباعة" : "Print",
    loadError:
      locale === "ar" ? "فشل في تحميل رمز QR" : "Failed to load QR code",
    tryAgain: locale === "ar" ? "إعادة المحاولة" : "Try again",
    instructions:
      locale === "ar"
        ? "يمكن للأعضاء مسح هذا الرمز لتسجيل حضورهم في الجلسة"
        : "Members can scan this code to check in to the session",
  };

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
        {/* QR Code Display */}
        <div className="flex justify-center">
          {isLoading || isRefetching ? (
            <Skeleton className="h-52 w-52 rounded-lg" />
          ) : error ? (
            <div className="h-52 w-52 flex flex-col items-center justify-center bg-neutral-100 rounded-lg">
              <QrCode className="h-16 w-16 text-neutral-400 mb-3" />
              <p className="text-sm text-neutral-500 text-center px-4">
                {texts.loadError}
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => refetch()}
                className="mt-2"
              >
                {texts.tryAgain}
              </Button>
            </div>
          ) : qrData ? (
            <div className={`relative ${isExpired ? "opacity-50" : ""}`}>
              <img
                src={getQrCodeUrl(qrData.token)}
                alt="Session QR Code"
                className="h-52 w-52 rounded-lg border"
              />
              {isExpired && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <p className="text-danger font-medium">{texts.expired}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Timer */}
        {qrData && !error && (
          <div className="flex items-center justify-center gap-2 text-neutral-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              {texts.validFor}{" "}
              <span
                className={`font-medium ${
                  isExpired ? "text-danger" : "text-neutral-900"
                }`}
              >
                {timeRemaining}
              </span>
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex-1"
          >
            <RefreshCw
              className={`h-4 w-4 me-2 ${isRefetching ? "animate-spin" : ""}`}
            />
            {isRefetching ? texts.refreshing : texts.refresh}
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={!qrData || isExpired}
          >
            <Printer className="h-4 w-4 me-2" />
            {texts.print}
          </Button>
        </div>

        {/* Instructions */}
        <p className="text-sm text-center text-neutral-500">
          {texts.instructions}
        </p>
      </CardContent>
    </Card>
  );
}
