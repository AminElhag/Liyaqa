"use client";

import { cn } from "@/lib/utils";
import { Delete, Check } from "lucide-react";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  maxLength?: number;
  showSubmit?: boolean;
  submitLabel?: string;
  isArabic?: boolean;
  className?: string;
}

export function NumericKeypad({
  value,
  onChange,
  onSubmit,
  maxLength = 10,
  showSubmit = true,
  submitLabel,
  isArabic = false,
  className,
}: NumericKeypadProps) {
  const handleDigit = (digit: string) => {
    if (value.length < maxLength) {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  const buttonClass = cn(
    "flex items-center justify-center rounded-xl text-3xl font-semibold",
    "h-20 transition-all touch-manipulation select-none",
    "bg-white border-2 border-gray-200 text-gray-800",
    "hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98]",
    "focus:outline-none focus:ring-2 focus:ring-primary/30"
  );

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className={cn("w-full max-w-sm mx-auto", className)}>
      {/* Display */}
      <div
        className={cn(
          "mb-6 px-6 py-4 bg-gray-100 rounded-xl text-center",
          "text-4xl font-mono tracking-widest min-h-[72px]",
          "flex items-center justify-center"
        )}
        dir="ltr"
      >
        {value || <span className="text-gray-400">---</span>}
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-3">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            className={buttonClass}
            onClick={() => handleDigit(digit)}
          >
            {digit}
          </button>
        ))}

        {/* Bottom row */}
        <button
          type="button"
          className={cn(buttonClass, "text-red-600 border-red-200")}
          onClick={handleClear}
        >
          {isArabic ? "مسح" : "C"}
        </button>

        <button
          type="button"
          className={buttonClass}
          onClick={() => handleDigit("0")}
        >
          0
        </button>

        <button
          type="button"
          className={cn(buttonClass, "text-gray-600")}
          onClick={handleBackspace}
        >
          <Delete className="h-7 w-7" />
        </button>
      </div>

      {/* Submit Button */}
      {showSubmit && (
        <button
          type="button"
          className={cn(
            "w-full mt-4 h-16 rounded-xl text-2xl font-semibold",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 active:bg-primary/80 active:scale-[0.99]",
            "transition-all touch-manipulation select-none",
            "focus:outline-none focus:ring-4 focus:ring-primary/30",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-3"
          )}
          onClick={onSubmit}
          disabled={!value}
        >
          <Check className="h-6 w-6" />
          {submitLabel || (isArabic ? "تأكيد" : "Confirm")}
        </button>
      )}
    </div>
  );
}
