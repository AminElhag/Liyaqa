"use client";

import { useEffect, useState } from "react";
import {
  calculatePasswordStrength,
  getPasswordRequirements,
  getPasswordStrengthInfo,
  type PasswordRequirement,
} from "@/lib/validations/password-schema";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  isPlatformUser?: boolean;
  locale?: "en" | "ar";
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  isPlatformUser = false,
  locale = "en",
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const [score, setScore] = useState(0);
  const [requirements, setRequirements] = useState<PasswordRequirement[]>([]);

  useEffect(() => {
    const newScore = calculatePasswordStrength(password);
    setScore(newScore);
    setRequirements(getPasswordRequirements(isPlatformUser));
  }, [password, isPlatformUser]);

  const strengthInfo = getPasswordStrengthInfo(score);

  // Don't show anything if password is empty
  if (!password) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {locale === "ar" ? "قوة كلمة المرور" : "Password Strength"}
          </span>
          <span className={cn("font-medium", strengthInfo.color)}>
            {locale === "ar" ? strengthInfo.labelAr : strengthInfo.label}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              score >= 80 && "bg-green-600",
              score >= 60 && score < 80 && "bg-green-500",
              score >= 40 && score < 60 && "bg-yellow-500",
              score >= 20 && score < 40 && "bg-orange-500",
              score < 20 && "bg-red-500"
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1.5">
          {requirements.map((req) => {
            const isMet = req.test(password);
            return (
              <div
                key={req.id}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  isMet
                    ? "text-green-600 dark:text-green-500"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {isMet ? (
                  <Check className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{locale === "ar" ? req.labelAr : req.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
