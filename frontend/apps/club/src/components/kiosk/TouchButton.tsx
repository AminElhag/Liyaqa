"use client";

import { forwardRef } from "react";
import { cn } from "@liyaqa/shared/utils";
import { LucideIcon } from "lucide-react";

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  label: string;
  labelAr?: string;
  description?: string;
  descriptionAr?: string;
  variant?: "primary" | "secondary" | "outline" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  isArabic?: boolean;
}

const variantStyles = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
  outline: "border-2 border-primary text-primary hover:bg-primary/10 active:bg-primary/20",
  success: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800",
  warning: "bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
};

const sizeStyles = {
  sm: "min-h-[80px] px-4 py-3 text-lg",
  md: "min-h-[120px] px-6 py-4 text-xl",
  lg: "min-h-[160px] px-8 py-6 text-2xl",
  xl: "min-h-[200px] px-10 py-8 text-3xl",
};

const iconSizes = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      icon: Icon,
      label,
      labelAr,
      description,
      descriptionAr,
      variant = "primary",
      size = "lg",
      isArabic = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const displayLabel = isArabic && labelAr ? labelAr : label;
    const displayDesc = isArabic && descriptionAr ? descriptionAr : description;

    return (
      <button
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl font-semibold transition-all",
          "touch-manipulation select-none",
          "focus:outline-none focus:ring-4 focus:ring-primary/30",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "shadow-lg hover:shadow-xl active:shadow-md active:scale-[0.98]",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        dir={isArabic ? "rtl" : "ltr"}
        {...props}
      >
        {Icon && <Icon className={cn(iconSizes[size], "mb-3")} strokeWidth={1.5} />}
        <span className="leading-tight">{displayLabel}</span>
        {displayDesc && (
          <span className="mt-1 text-sm opacity-80 font-normal">{displayDesc}</span>
        )}
      </button>
    );
  }
);

TouchButton.displayName = "TouchButton";
