"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { Briefcase, Dumbbell, User, ChevronDown, Loader2, ArrowRightLeft } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuthStore } from "../../stores/auth-store";
import type { AccountType } from "../../types/auth";

interface PortalSwitcherProps {
  className?: string;
  /** Called after switching account type, with the new type. Use to redirect to the new portal URL. */
  onSwitched?: (accountType: AccountType) => void;
}

const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { icon: React.ReactNode; label: string; labelAr: string }
> = {
  EMPLOYEE: {
    icon: <Briefcase className="h-4 w-4" />,
    label: "Employee Portal",
    labelAr: "بوابة الموظف",
  },
  TRAINER: {
    icon: <Dumbbell className="h-4 w-4" />,
    label: "Trainer Portal",
    labelAr: "بوابة المدرب",
  },
  MEMBER: {
    icon: <User className="h-4 w-4" />,
    label: "Member Portal",
    labelAr: "بوابة العضو",
  },
};

/**
 * Portal switcher dropdown shown in the shell header.
 * Allows switching between account types without re-logging in.
 * Only rendered when user has multiple account types.
 */
export function PortalSwitcher({ className, onSwitched }: PortalSwitcherProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const { user, switchAccountType, isLoading } = useAuthStore();
  const [switching, setSwitching] = React.useState(false);

  const accountTypes = user?.accountTypes;
  const activeType = user?.activeAccountType;

  // Only show if user has multiple account types
  if (!accountTypes || accountTypes.length <= 1 || !activeType) {
    return null;
  }

  const activeConfig = ACCOUNT_TYPE_CONFIG[activeType];
  const otherTypes = accountTypes.filter((t) => t !== activeType);

  const handleSwitch = async (type: AccountType) => {
    setSwitching(true);
    try {
      await switchAccountType(type);
      onSwitched?.(type);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${className || ""}`}
          disabled={switching || isLoading}
        >
          {switching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            activeConfig.icon
          )}
          <span className="hidden sm:inline">
            {isAr ? activeConfig.labelAr : activeConfig.label}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isAr ? "start" : "end"}>
        <DropdownMenuLabel className="flex items-center gap-2">
          <ArrowRightLeft className="h-3 w-3" />
          {isAr ? "تبديل البوابة" : "Switch Portal"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {otherTypes.map((type) => {
          const config = ACCOUNT_TYPE_CONFIG[type];
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => handleSwitch(type)}
              className="gap-2 cursor-pointer"
            >
              {config.icon}
              {isAr ? config.labelAr : config.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
