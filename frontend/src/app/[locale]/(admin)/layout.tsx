"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AdminShell } from "@/components/layouts/admin-shell";
import { useAuthStore, useHasHydrated } from "@/stores/auth-store";
import { Loading } from "@/components/ui/spinner";

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

  // Check if user has admin role
  const isAdmin = user?.role && ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF"].includes(user.role);
  if (!isAdmin) {
    router.push(`/${locale}/login`);
    return null;
  }

  return <AdminShell>{children}</AdminShell>;
}
