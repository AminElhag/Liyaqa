"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { MemberShell } from "@/components/layouts/member-shell";
import { useAuthStore, useHasHydrated } from "@/stores/auth-store";
import { Loading } from "@/components/ui/spinner";

export default function MemberLayout({
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
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!hasHydrated) return;

    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/member/login`);
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

  // Check if user has MEMBER role
  const isMember = user?.role === "MEMBER";
  if (!isMember) {
    // Redirect admins to admin dashboard
    const isAdmin = user?.role && ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF"].includes(user.role);
    if (isAdmin) {
      router.push(`/${locale}/dashboard`);
    } else {
      router.push(`/${locale}/member/login`);
    }
    return null;
  }

  return <MemberShell>{children}</MemberShell>;
}
