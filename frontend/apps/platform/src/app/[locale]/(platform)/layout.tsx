"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { PlatformShell } from "@liyaqa/shared/components/layouts/platform-shell";
import { useAuthStore, useHasHydrated } from "@liyaqa/shared/stores/auth-store";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { isPlatformRole } from "@liyaqa/shared/types/auth";
import { getAccessToken } from "@liyaqa/shared/lib/api/client";

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
    console.log('[Layout] Initialization check:', {
      hasHydrated,
      isLoginPage,
      initializeCalled: initializeCalledRef.current,
    });

    // Wait for hydration before initializing auth
    // Initialize even on login page to detect authenticated users
    if (hasHydrated && !initializeCalledRef.current) {
      console.log('[Layout] Calling initialize()...');
      initializeCalledRef.current = true;
      initialize();
    }
  }, [hasHydrated, initialize, isLoginPage]);

  useEffect(() => {
    console.log('[Layout] Auth check:', {
      isLoginPage,
      hasHydrated,
      isLoading,
      isAuthenticated,
      hasAccessToken: !!getAccessToken(),
    });

    // Skip auth check for login page ONLY when not authenticated
    // This allows navigation away from login when authentication completes
    if (isLoginPage && !isAuthenticated) return;

    // Wait for hydration before making auth decisions
    if (!hasHydrated) return;

    // Check for access token in localStorage directly
    // This prevents redirect if token exists (even if hydration hasn't completed)
    const hasToken = getAccessToken() !== null;

    // Redirect to platform login if not authenticated and not loading and no token
    if (!isLoading && !isAuthenticated && !hasToken) {
      console.log('[Layout] Redirecting to login - no auth');
      router.replace(`/${locale}/platform-login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [hasHydrated, isLoading, isAuthenticated, router, locale, isLoginPage, pathname]);

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
