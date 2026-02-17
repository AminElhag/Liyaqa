"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { MemberShell } from "@/components/layouts/member-shell";
import { useAuthStore, useHasHydrated } from "@liyaqa/shared/stores/auth-store";
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

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/login`);
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

  // Check account type: MEMBER type, or legacy MEMBER role, or admin override
  const hasMemberAccess =
    user?.activeAccountType === "MEMBER" ||
    user?.accountTypes?.includes("MEMBER") ||
    user?.role === "MEMBER" ||
    (user?.role && ["SUPER_ADMIN", "CLUB_ADMIN"].includes(user.role));

  if (!hasMemberAccess) {
    router.push(`/${locale}/login?wrong_portal=true`);
    return null;
  }

  return <MemberShell>{children}</MemberShell>;
}
