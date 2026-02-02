"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { TrainerShell } from "@/components/layouts/trainer-shell";
import { useAuthStore, useHasHydrated } from "@/stores/auth-store";
import { Loading } from "@/components/ui/spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import { useMyTrainerProfile } from "@/queries/use-trainers";
import { useUnreadNotificationsCount } from "@/queries/use-trainer-portal";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { isAuthenticated, isLoading, user, initialize } = useAuthStore();
  const hasHydrated = useHasHydrated();

  // Fetch trainer profile to get trainerId
  const { data: trainerProfile } = useMyTrainerProfile({
    enabled: isAuthenticated && user?.role === "TRAINER",
  });

  // Fetch unread notifications count for badge
  const { data: unreadData } = useUnreadNotificationsCount(trainerProfile?.id, {
    enabled: !!trainerProfile?.id,
  });

  useEffect(() => {
    // Force light theme for trainer routes
    setTheme("light");
  }, [setTheme]);

  useEffect(() => {
    // Always call initialize on mount to restore tenant context
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

  // Check if user has TRAINER role
  const isTrainer = user?.role === "TRAINER";
  if (!isTrainer) {
    // Redirect to appropriate portal based on role
    if (user?.role === "MEMBER") {
      router.push(`/${locale}/member/dashboard`);
    } else if (
      user?.role &&
      ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF"].includes(user.role)
    ) {
      router.push(`/${locale}/dashboard`);
    } else {
      router.push(`/${locale}/login`);
    }
    return null;
  }

  return (
    <ErrorBoundary>
      <TrainerShell unreadCount={unreadData?.unreadCount ?? 0}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </TrainerShell>
    </ErrorBoundary>
  );
}
