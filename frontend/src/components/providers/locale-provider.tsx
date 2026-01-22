"use client";

import { useEffect } from "react";

interface LocaleProviderProps {
  locale: string;
  direction: "ltr" | "rtl";
  children: React.ReactNode;
}

export function LocaleProvider({ locale, direction, children }: LocaleProviderProps) {
  useEffect(() => {
    // Update html attributes on mount and when locale changes
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [locale, direction]);

  return <>{children}</>;
}
