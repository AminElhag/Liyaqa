"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { MemberShell } from "@/components/layouts/member-shell";
import { useAuthStore, useHasHydrated } from "@liyaqa/shared/stores/auth-store";
import { getAccessToken } from "@liyaqa/shared/lib/api/client";
import { Loading } from "@liyaqa/shared/components/ui/spinner";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isLoading, user, initialize } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const initializeCalledRef = useRef(false);

  // Guard: call initialize() exactly once after hydration
  useEffect(() => {
    if (hasHydrated && !initializeCalledRef.current) {
      initializeCalledRef.current = true;
      initialize();
    }
  }, [hasHydrated, initialize]);

  // Auth redirect — with localStorage token tiebreaker to prevent loops
  useEffect(() => {
    if (!hasHydrated) return;

    const hasToken = getAccessToken() !== null;

    if (!isLoading && !isAuthenticated && !hasToken) {
      router.replace(`/${locale}/login`);
    }
  }, [hasHydrated, isLoading, isAuthenticated, router, locale]);

  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const hasMemberAccess =
    user?.activeAccountType === "MEMBER" ||
    user?.accountTypes?.includes("MEMBER") ||
    user?.role === "MEMBER" ||
    (user?.role && ["SUPER_ADMIN", "CLUB_ADMIN"].includes(user.role));

  if (!hasMemberAccess) {
    router.replace(`/${locale}/login?wrong_portal=true`);
    return null;
  }

  return <MemberShell>{children}</MemberShell>;
}
