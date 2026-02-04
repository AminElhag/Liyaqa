"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { PlatformShell } from "@/components/layouts/platform-shell";
import { useAuthStore, useHasHydrated } from "@liyaqa/shared/stores/auth-store";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { isPlatformRole } from "@liyaqa/shared/types/auth";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useHasHydrated();
  const { isAuthenticated, isLoading, user, initialize, isPlatformUser } = useAuthStore();
  const initializeCalledRef = useRef(false);

  // Check if we're on the login page
  const isLoginPage = pathname.includes("/platform-login");

  useEffect(() => {
    // Wait for hydration and don't initialize if on login page
    // Only call initialize once
    if (hasHydrated && !isLoginPage && !initializeCalledRef.current) {
      initializeCalledRef.current = true;
      initialize();
    }
  }, [hasHydrated, initialize, isLoginPage]);

  useEffect(() => {
    // Skip auth check for login page
    if (isLoginPage) return;

    // Wait for hydration before making auth decisions
    if (!hasHydrated) return;

    // Redirect to platform login if not authenticated and not loading
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/platform-login`);
    }
  }, [hasHydrated, isLoading, isAuthenticated, router, locale, isLoginPage]);

  // Login page renders without shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading while hydrating or checking auth
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <Loading
          text={locale === "ar" ? "جاري التحميل..." : "Loading..."}
          className="text-white"
        />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check if user is a platform user
  const isValidPlatformUser =
    user?.isPlatformUser || (user?.role && isPlatformRole(user.role));

  if (!isValidPlatformUser) {
    // Redirect non-platform users to client dashboard
    router.push(`/${locale}/dashboard`);
    return null;
  }

  return <PlatformShell>{children}</PlatformShell>;
}
