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

  // Trainers should have TRAINER or STAFF role; redirect others
  const isTrainer =
    user?.role &&
    ["TRAINER", "STAFF", "SUPER_ADMIN", "CLUB_ADMIN"].includes(user.role);
  if (!isTrainer) {
    router.push(`/${locale}/login`);
    return null;
  }

  return (
    <ErrorBoundary>
      <TrainerShell>{children}</TrainerShell>
    </ErrorBoundary>
  );
}
