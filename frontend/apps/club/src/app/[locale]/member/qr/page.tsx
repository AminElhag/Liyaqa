"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { QrCode, RefreshCw, Lightbulb, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useMyProfile } from "@liyaqa/shared/queries/use-member-portal";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import QRCode from "qrcode";

export default function QRCodePage() {
  const t = useTranslations("member.qr");
  const locale = useLocale();
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useMyProfile();

  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [expiresAt, setExpiresAt] = React.useState<Date | null>(null);
  const [isExpired, setIsExpired] = React.useState(false);

  const generateQRCode = React.useCallback(async () => {
    if (!profile?.id) return;

    // Create a token that includes member ID and expiry
    // In production, this would be a signed JWT from the backend
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5); // 5 minute expiry

    const qrData = JSON.stringify({
      memberId: profile.id,
      exp: expiry.getTime(),
      type: "checkin",
    });

    try {
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0F766E", // primary color
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(dataUrl);
      setExpiresAt(expiry);
      setIsExpired(false);
    } catch (err) {
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to generate QR code:", err);
      }
    }
  }, [profile?.id]);

  // Generate QR code on mount and when profile changes
  React.useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  // Check expiry every second
  React.useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      if (new Date() > expiresAt) {
        setIsExpired(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const getTimeRemaining = () => {
    if (!expiresAt) return "";
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return "0:00";

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-neutral-500">{t("subtitle")}</p>
      </div>

      {/* QR Code Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-6 text-center">
            <p className="font-medium">
              {locale === "ar"
                ? profile?.fullName
                : profile?.fullName}
            </p>
            <p className="text-sm opacity-90">{user?.email}</p>
          </div>

          <div className="p-6 text-center">
            {qrDataUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Check-in QR Code"
                  className={`mx-auto rounded-lg ${isExpired ? "opacity-30" : ""}`}
                />
                {isExpired && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center">
                      <p className="text-danger font-medium mb-2">{t("expired")}</p>
                      <Button size="sm" onClick={generateQRCode}>
                        <RefreshCw className="h-4 w-4 me-2" />
                        {t("refresh")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <QrCode className="h-16 w-16 text-neutral-300 animate-pulse" />
              </div>
            )}

            {!isExpired && expiresAt && (
              <div className="mt-4 text-sm text-neutral-600">
                {t("validFor")}{" "}
                <span className="font-mono font-medium">{getTimeRemaining()}</span>
              </div>
            )}

            <Button
              variant="outline"
              className="mt-4"
              onClick={generateQRCode}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 me-2" />
              {t("refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How to use */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            {t("howToUse")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-medium">
              1
            </div>
            <p className="text-sm text-neutral-600">{t("step1")}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-medium">
              2
            </div>
            <p className="text-sm text-neutral-600">{t("step2")}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-medium">
              3
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-sm text-neutral-600">{t("step3")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tip */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
          {t("brightnessTip")}
        </p>
      </div>
    </div>
  );
}
