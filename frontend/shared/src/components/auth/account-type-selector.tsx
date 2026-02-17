"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { Briefcase, Dumbbell, User, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthStore } from "../../stores/auth-store";
import type { AccountType, AccountTypeInfo } from "../../types/auth";

interface AccountTypeSelectorProps {
  className?: string;
  onSelected?: (accountType: AccountType) => void;
}

const ACCOUNT_TYPE_ICONS: Record<AccountType, React.ReactNode> = {
  EMPLOYEE: <Briefcase className="h-6 w-6" />,
  TRAINER: <Dumbbell className="h-6 w-6" />,
  MEMBER: <User className="h-6 w-6" />,
};

/**
 * Account type selector shown after login when user has multiple account types.
 * Displays card-based UI for selecting which portal to access.
 * Bilingual (EN/AR), RTL-safe, dark mode compatible.
 */
export function AccountTypeSelector({
  className,
  onSelected,
}: AccountTypeSelectorProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const {
    availableAccountTypes,
    pendingUser,
    selectAccountType,
    clearAccountTypeSelection,
    isLoading,
    error,
  } = useAuthStore();

  const handleSelect = async (info: AccountTypeInfo) => {
    await selectAccountType(info.accountType);
    onSelected?.(info.accountType);
  };

  if (!availableAccountTypes.length || !pendingUser) {
    return null;
  }

  const displayName = isAr
    ? pendingUser.displayName.ar || pendingUser.displayName.en
    : pendingUser.displayName.en;

  return (
    <div className={className}>
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          {isAr ? "اختر البوابة" : "Choose Your Portal"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isAr
            ? `مرحبًا ${displayName}، لديك عدة حسابات. اختر البوابة التي تريد الدخول إليها.`
            : `Welcome ${displayName}, you have multiple accounts. Select which portal to access.`}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive text-center mb-4">{error}</p>
      )}

      <div className="grid gap-3">
        {availableAccountTypes.map((info) => (
          <Button
            key={info.accountType}
            variant="outline"
            className="h-auto py-4 px-5 flex items-center gap-4 justify-start hover:bg-accent/50 transition-colors"
            onClick={() => handleSelect(info)}
            disabled={isLoading}
          >
            <div className="flex-shrink-0 text-primary">
              {ACCOUNT_TYPE_ICONS[info.accountType]}
            </div>
            <div className="text-start">
              <div className="font-medium text-foreground">
                {isAr ? info.labelAr : info.label}
              </div>
            </div>
            {isLoading && (
              <Loader2 className="ms-auto h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </Button>
        ))}
      </div>

      <div className="mt-4 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAccountTypeSelection}
          disabled={isLoading}
        >
          {isAr ? "تسجيل الدخول بحساب آخر" : "Login with a different account"}
        </Button>
      </div>
    </div>
  );
}
