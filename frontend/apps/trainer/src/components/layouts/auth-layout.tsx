"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { LanguageToggle } from "@liyaqa/shared/components/ui/language-toggle";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <Image
            src="/assets/logo-liyaqa-primary.svg"
            alt="Liyaqa"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
          <span className="text-sm font-medium text-primary ms-1">
            {locale === "ar" ? "المدربون" : "Trainers"}
          </span>
        </Link>
        <LanguageToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-neutral-500">
        &copy; {new Date().getFullYear()} Liyaqa. All rights reserved.
      </footer>
    </div>
  );
}
