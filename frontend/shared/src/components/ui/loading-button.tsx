"use client";

import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./button";
import { cn } from "../lib/utils";

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || isLoading}
      className={cn(isLoading && "cursor-wait", className)}
      {...props}
    >
      {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
}
