"use client";

// Force all admin pages to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { AdminShell } from "@/components/layouts/admin-shell";
import { useAuthStore, useHasHydrated } from "@/stores/auth-store";
import { Loading } from "@/components/ui/spinner";
import { CommandPaletteProvider, CommandPalette } from "@/components/command-palette";
import { ErrorBoundary } from "@/components/error-boundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { isAuthenticated, isLoading, user, initialize } = useAuthStore();
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    // Force light theme for admin routes regardless of OS preference or localStorage
    setTheme("light");
  }, [setTheme]);

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

  // Check if user has admin role
  const isAdmin = user?.role && ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF"].includes(user.role);
  if (!isAdmin) {
    // Redirect members to their portal, others to staff login
    const isMember = user?.role === "MEMBER";
    if (isMember) {
      router.push(`/${locale}/member/dashboard`);
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
