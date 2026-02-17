"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { TrainerShell } from "@/components/layouts/trainer-shell";
import { useAuthStore, useHasHydrated } from "@liyaqa/shared/stores/auth-store";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { ErrorBoundary } from "@liyaqa/shared/components/error-boundary";

export default function TrainerLayout({
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

  // Check account type: TRAINER type, or legacy TRAINER role, or admin override
  const hasTrainerAccess =
    user?.activeAccountType === "TRAINER" ||
    user?.accountTypes?.includes("TRAINER") ||
    user?.role === "TRAINER" ||
    (user?.role && ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF"].includes(user.role));

  if (!hasTrainerAccess) {
    router.push(`/${locale}/login?wrong_portal=true`);
    return null;
  }

  return (
    <ErrorBoundary>
      <TrainerShell>{children}</TrainerShell>
    </ErrorBoundary>
  );
}
