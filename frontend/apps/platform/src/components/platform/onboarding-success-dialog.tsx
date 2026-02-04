"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { CheckCircle2, Copy, Check, ArrowRight, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Label } from "@liyaqa/shared/components/ui/label";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import type { OnboardingResult } from "@liyaqa/shared/types/platform/client";

interface OnboardingSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: OnboardingResult | null;
  adminEmail: string;
  onViewClient: () => void;
}

/**
 * Dialog shown after successful client onboarding.
 * Displays login credentials for the client admin to use.
 */
export function OnboardingSuccessDialog({
  open,
  onOpenChange,
  result,
  adminEmail,
  onViewClient,
}: OnboardingSuccessDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const texts = {
    title: locale === "ar" ? "تم إنشاء العميل بنجاح" : "Client Created Successfully",
    description:
      locale === "ar"
        ? "شارك بيانات الدخول هذه مع مسؤول العميل:"
        : "Share these credentials with the client admin:",
    loginUrl: locale === "ar" ? "رابط تسجيل الدخول" : "Login URL",
    adminEmail: locale === "ar" ? "البريد الإلكتروني للمسؤول" : "Admin Email",
    tenantId: locale === "ar" ? "معرف النادي (Tenant ID)" : "Tenant ID (Club ID)",
    copy: locale === "ar" ? "نسخ" : "Copy",
    copied: locale === "ar" ? "تم النسخ!" : "Copied!",
    viewClient: locale === "ar" ? "عرض العميل" : "View Client",
    passwordNote:
      locale === "ar"
        ? "كلمة المرور: تم إدخالها أثناء التسجيل - يرجى مشاركتها بشكل آمن"
        : "Password: Was entered during onboarding - please share it securely",
    copySuccess: locale === "ar" ? "تم نسخ القيمة" : "Value copied to clipboard",
    copyError: locale === "ar" ? "فشل النسخ" : "Failed to copy",
    tenantIdNotNeeded:
      locale === "ar"
        ? "غير مطلوب عند استخدام رابط النطاق الفرعي"
        : "Not needed when using subdomain URL",
  };

  // Use subdomain URL if available, otherwise fall back to current origin
  const loginUrl = result?.subdomainUrl
    ? `${result.subdomainUrl}/${locale}/login`
    : typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/login`
      : `/${locale}/login`;

  // Check if subdomain URL is available (no tenant ID needed when using subdomain)
  const hasSubdomainUrl = !!result?.subdomainUrl;

  const tenantId = result?.club?.id || "";

  /**
   * Copy text to clipboard and show feedback.
   */
  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: texts.copySuccess,
        description: text.length > 50 ? `${text.substring(0, 50)}...` : text,
      });
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        title: texts.copyError,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle View Client button click.
   */
  const handleViewClient = () => {
    onOpenChange(false);
    onViewClient();
  };

  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-xl">{texts.title}</DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Login URL */}
          <CredentialField
            label={texts.loginUrl}
            value={loginUrl}
            fieldName="loginUrl"
            copiedField={copiedField}
            onCopy={handleCopy}
            copyText={texts.copy}
            copiedText={texts.copied}
          />

          {/* Admin Email */}
          <CredentialField
            label={texts.adminEmail}
            value={adminEmail}
            fieldName="adminEmail"
            copiedField={copiedField}
            onCopy={handleCopy}
            copyText={texts.copy}
            copiedText={texts.copied}
          />

          {/* Tenant ID */}
          <div className="space-y-1.5">
            <CredentialField
              label={texts.tenantId}
              value={tenantId}
              fieldName="tenantId"
              copiedField={copiedField}
              onCopy={handleCopy}
              copyText={texts.copy}
              copiedText={texts.copied}
              isMonospace
            />
            {hasSubdomainUrl && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {texts.tenantIdNotNeeded}
              </p>
            )}
          </div>

          {/* Password Note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">{texts.passwordNote}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleViewClient} className="gap-2">
            {texts.viewClient}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Individual credential field with copy button.
 */
interface CredentialFieldProps {
  label: string;
  value: string;
  fieldName: string;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
  copyText: string;
  copiedText: string;
  isMonospace?: boolean;
}

function CredentialField({
  label,
  value,
  fieldName,
  copiedField,
  onCopy,
  copyText,
  copiedText,
  isMonospace = false,
}: CredentialFieldProps) {
  const isCopied = copiedField === fieldName;

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 px-3 py-2 rounded-md border bg-muted/50 text-sm ${
            isMonospace ? "font-mono text-xs" : ""
          } break-all`}
        >
          {value}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => onCopy(value, fieldName)}
        >
          {isCopied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-600">{copiedText}</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              {copyText}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
