"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Copy, Share2, Check, Link2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ReferralCode } from "@/types/referral";

interface ReferralLinkCardProps {
  referralCode?: ReferralCode | null;
  isLoading?: boolean;
}

export function ReferralLinkCard({ referralCode, isLoading }: ReferralLinkCardProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const referralUrl = referralCode
    ? `${baseUrl}/${locale}/ref/${referralCode.code}`
    : "";

  const handleCopyLink = async () => {
    if (!referralUrl) return;

    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success(isArabic ? "تم نسخ الرابط" : "Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isArabic ? "فشل في نسخ الرابط" : "Failed to copy link");
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode?.code) return;

    try {
      await navigator.clipboard.writeText(referralCode.code);
      toast.success(isArabic ? "تم نسخ الكود" : "Code copied!");
    } catch {
      toast.error(isArabic ? "فشل في نسخ الكود" : "Failed to copy code");
    }
  };

  const handleShare = async () => {
    if (!referralUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isArabic ? "انضم إلى نادينا!" : "Join our club!",
          text: isArabic
            ? "استخدم رابط الإحالة الخاص بي للحصول على خصم"
            : "Use my referral link to get a discount",
          url: referralUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {isArabic ? "رابط الإحالة" : "Your Referral Link"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!referralCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {isArabic ? "رابط الإحالة" : "Your Referral Link"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {isArabic
              ? "رابط الإحالة غير متاح حالياً"
              : "Referral link is not available"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            {isArabic ? "رابط الإحالة" : "Your Referral Link"}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? "شارك هذا الرابط مع أصدقائك واحصل على مكافآت"
              : "Share this link with friends and earn rewards"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {isArabic ? "كود الإحالة" : "Referral Code"}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-2 bg-primary/10 rounded-lg font-mono text-lg font-bold text-center">
                {referralCode.code}
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Referral URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {isArabic ? "رابط الإحالة" : "Referral Link"}
            </label>
            <div className="flex gap-2">
              <Input
                value={referralUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleShare} className="flex-1">
              <Share2 className="h-4 w-4 me-2" />
              {isArabic ? "مشاركة" : "Share"}
            </Button>
            <Button variant="outline" onClick={() => setShowQR(true)}>
              <QrCode className="h-4 w-4" />
            </Button>
          </div>

          {/* Click count */}
          <div className="text-center text-sm text-muted-foreground pt-2 border-t">
            {isArabic
              ? `${referralCode.clickCount} نقرة`
              : `${referralCode.clickCount} clicks`}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isArabic ? "كود QR للإحالة" : "Referral QR Code"}
            </DialogTitle>
            <DialogDescription>
              {isArabic
                ? "امسح هذا الكود للانتقال إلى صفحة التسجيل"
                : "Scan this code to go to the registration page"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="p-4 bg-white rounded-lg">
              {/* Simple QR placeholder - in production use a QR library */}
              <div className="w-48 h-48 flex items-center justify-center bg-muted rounded">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {referralCode.code}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
