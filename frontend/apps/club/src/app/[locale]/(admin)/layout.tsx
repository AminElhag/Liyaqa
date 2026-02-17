"use client";

// Force all admin pages to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AdminShell } from "@/components/layouts/admin-shell";
import { useAuthStore, useHasHydrated } from "@liyaqa/shared/stores/auth-store";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { CommandPaletteProvider, CommandPalette } from "@/components/command-palette";
import { ErrorBoundary } from "@liyaqa/shared/components/error-boundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isLoading, user, initialize } = useAuthStore();
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    // Always call initialize on mount to restore tenant context
    // The initialize function handles the case where user is already authenticated
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!hasHydrated) return;

    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [hasHydrated, isLoading, isAuthenticated, router, locale]);

  // Show loading while hydrating or checking auth
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check if user has employee/admin access (account type or legacy role)
  const hasEmployeeAccess =
    user?.activeAccountType === "EMPLOYEE" ||
    user?.accountTypes?.includes("EMPLOYEE") ||
    (user?.role && ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF"].includes(user.role));

  if (!hasEmployeeAccess) {
    // Redirect members to their portal, trainers to theirs, others to login
    if (user?.activeAccountType === "MEMBER" || user?.role === "MEMBER") {
      router.push(`/${locale}/member/dashboard`);
    } else if (user?.activeAccountType === "TRAINER" || user?.role === "TRAINER") {
      router.push(`/${locale}/trainer/dashboard`);
    } else {
      router.push(`/${locale}/login`);
    }
    return null;
  }

  return (
    <ErrorBoundary>
      <CommandPaletteProvider>
        <AdminShell>
          <ErrorBoundary>{children}</ErrorBoundary>
        </AdminShell>
        <CommandPalette />
      </CommandPaletteProvider>
    </ErrorBoundary>
  );
}
