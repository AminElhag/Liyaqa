"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { LanguageToggle } from "@liyaqa/shared/components/ui/language-toggle";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-100 flex flex-col">
      <header className="flex items-center justify-between p-4">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <span className="font-bold text-xl text-neutral-800">Liyaqa</span>
        </Link>
        <LanguageToggle />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="p-4 text-center text-sm text-neutral-500">
        &copy; {new Date().getFullYear()} Liyaqa. All rights reserved.
      </footer>
    </div>
  );
}
