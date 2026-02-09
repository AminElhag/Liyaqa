import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Copy, Check, ArrowRight, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/stores/toast-store";
import type { OnboardingResult } from "@/types";

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
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const toast = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const texts = {
    title: locale === "ar" ? "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0639\u0645\u064A\u0644 \u0628\u0646\u062C\u0627\u062D" : "Client Created Successfully",
    description:
      locale === "ar"
        ? "\u0634\u0627\u0631\u0643 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u0647\u0630\u0647 \u0645\u0639 \u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0639\u0645\u064A\u0644:"
        : "Share these credentials with the client admin:",
    loginUrl: locale === "ar" ? "\u0631\u0627\u0628\u0637 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" : "Login URL",
    adminEmail: locale === "ar" ? "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0644\u0644\u0645\u0633\u0624\u0648\u0644" : "Admin Email",
    tenantId: locale === "ar" ? "\u0645\u0639\u0631\u0641 \u0627\u0644\u0646\u0627\u062F\u064A (Tenant ID)" : "Tenant ID (Club ID)",
    copy: locale === "ar" ? "\u0646\u0633\u062E" : "Copy",
    copied: locale === "ar" ? "\u062A\u0645 \u0627\u0644\u0646\u0633\u062E!" : "Copied!",
    viewClient: locale === "ar" ? "\u0639\u0631\u0636 \u0627\u0644\u0639\u0645\u064A\u0644" : "View Client",
    passwordNote:
      locale === "ar"
        ? "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631: \u062A\u0645 \u0625\u062F\u062E\u0627\u0644\u0647\u0627 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 - \u064A\u0631\u062C\u0649 \u0645\u0634\u0627\u0631\u0643\u062A\u0647\u0627 \u0628\u0634\u0643\u0644 \u0622\u0645\u0646"
        : "Password: Was entered during onboarding - please share it securely",
    copySuccess: locale === "ar" ? "\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0642\u064A\u0645\u0629" : "Value copied to clipboard",
    copyError: locale === "ar" ? "\u0641\u0634\u0644 \u0627\u0644\u0646\u0633\u062E" : "Failed to copy",
    tenantIdNotNeeded:
      locale === "ar"
        ? "\u063A\u064A\u0631 \u0645\u0637\u0644\u0648\u0628 \u0639\u0646\u062F \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0631\u0627\u0628\u0637 \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0641\u0631\u0639\u064A"
        : "Not needed when using subdomain URL",
  };

  // Use subdomain URL if available, otherwise fall back to current origin
  const loginUrl = result?.subdomainUrl
    ? `${result.subdomainUrl}/login`
    : typeof window !== "undefined"
      ? `${window.location.origin}/login`
      : `/login`;

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
      toast.success(texts.copySuccess);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error(texts.copyError);
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
