"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Shield, Key, AlertCircle } from "lucide-react";

interface MfaVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (code: string) => void;
  isLoading?: boolean;
  error?: string | null;
  email?: string;
}

export function MfaVerificationModal({
  open,
  onOpenChange,
  onVerify,
  isLoading = false,
  error = null,
  email,
}: MfaVerificationModalProps) {
  const locale = useLocale();
  const [code, setCode] = React.useState("");
  const [useBackupCode, setUseBackupCode] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onVerify(code.trim());
    }
  };

  const handleCodeChange = (value: string) => {
    // If using TOTP, only allow digits and max 6 characters
    if (!useBackupCode) {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
      setCode(digitsOnly);
    } else {
      // Backup codes can have letters and dashes
      setCode(value.toUpperCase().slice(0, 14)); // XXXX-XXXX-XXXX format
    }
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setCode("");
  };

  React.useEffect(() => {
    if (!open) {
      setCode("");
      setUseBackupCode(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {locale === "ar" ? "التحقق الثنائي" : "Two-Factor Authentication"}
            </DialogTitle>
            <DialogDescription>
              {locale === "ar"
                ? `أدخل رمز التحقق من تطبيق المصادقة لـ ${email || "حسابك"}`
                : `Enter the verification code from your authenticator app for ${email || "your account"}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="mfa-code">
                {useBackupCode
                  ? locale === "ar"
                    ? "رمز احتياطي"
                    : "Backup Code"
                  : locale === "ar"
                  ? "رمز التحقق"
                  : "Verification Code"}
              </Label>
              <Input
                id="mfa-code"
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder={useBackupCode ? "XXXX-XXXX-XXXX" : "000000"}
                className="text-center text-2xl tracking-widest font-mono"
                autoComplete="off"
                autoFocus
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 text-center">
                {useBackupCode
                  ? locale === "ar"
                    ? "أدخل أحد رموزك الاحتياطية المكونة من 12 حرفًا"
                    : "Enter one of your 12-character backup codes"
                  : locale === "ar"
                  ? "أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة"
                  : "Enter the 6-digit code from your authenticator app"}
              </p>
            </div>

            <div className="flex items-center justify-center">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={toggleBackupCode}
                className="text-xs"
                disabled={isLoading}
              >
                <Key className="h-3 w-3 me-1" />
                {useBackupCode
                  ? locale === "ar"
                    ? "استخدم رمز التطبيق بدلاً من ذلك"
                    : "Use authenticator app instead"
                  : locale === "ar"
                  ? "استخدم رمز احتياطي"
                  : "Use backup code"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                (useBackupCode ? code.length < 8 : code.length !== 6)
              }
            >
              {isLoading
                ? locale === "ar"
                  ? "جاري التحقق..."
                  : "Verifying..."
                : locale === "ar"
                ? "تحقق"
                : "Verify"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
