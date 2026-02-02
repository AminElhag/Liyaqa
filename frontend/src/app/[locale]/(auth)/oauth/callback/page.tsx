"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOAuthCallback } from "@/queries/use-oauth";
import { useAuthStore } from "@/stores/auth-store";
import {
  setAccessToken,
  setRefreshToken,
  setTenantContext,
  setPlatformMode,
} from "@/lib/api/client";
import { useTenantStore } from "@/stores/tenant-store";
import { isPlatformRole } from "@/types/auth";
import { toast } from "sonner";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { mutateAsync: handleCallback, isPending } = useOAuthCallback();
  const { setUser } = useAuthStore();
  const [error, setError] = React.useState<string | null>(null);

  // Texts
  const texts = {
    title: locale === "ar" ? "جاري تسجيل الدخول..." : "Signing you in...",
    description:
      locale === "ar"
        ? "الرجاء الانتظار بينما نكمل عملية المصادقة"
        : "Please wait while we complete the authentication",
    errorTitle: locale === "ar" ? "فشل تسجيل الدخول" : "Authentication Failed",
    errorDescription:
      locale === "ar"
        ? "حدث خطأ أثناء محاولة تسجيل الدخول باستخدام OAuth"
        : "An error occurred while trying to sign in with OAuth",
    backToLogin: locale === "ar" ? "العودة إلى تسجيل الدخول" : "Back to Login",
    invalidParameters:
      locale === "ar"
        ? "معاملات OAuth غير صالحة أو مفقودة"
        : "Invalid or missing OAuth parameters",
  };

  React.useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      // Validate parameters
      if (!code || !state) {
        setError(texts.invalidParameters);
        return;
      }

      try {
        // Call backend to exchange code for tokens
        const response = await handleCallback({ code, state });

        // Store tokens
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);

        // Check if platform user and set appropriate mode
        if (response.user.isPlatformUser || isPlatformRole(response.user.role)) {
          setPlatformMode(true);
          setTenantContext(null);
        } else {
          setPlatformMode(false);
          if (response.user.tenantId) {
            setTenantContext(
              response.user.tenantId,
              response.user.organizationId || null,
              response.user.role === "SUPER_ADMIN"
            );
            // Update tenant store for display purposes
            useTenantStore.getState().setTenant(
              response.user.tenantId,
              undefined,
              response.user.organizationId || undefined
            );
          }
        }

        // Update auth store
        setUser(response.user);

        // Show success toast
        toast.success(
          locale === "ar"
            ? "تم تسجيل الدخول بنجاح"
            : "Successfully signed in"
        );

        // Small delay to ensure state is persisted
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Redirect based on user role
        const isPlatform = response.user.isPlatformUser || isPlatformRole(response.user.role);
        if (isPlatform) {
          router.replace(`/${locale}/platform`);
        } else {
          router.replace(`/${locale}/dashboard`);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : locale === "ar"
              ? "حدث خطأ غير متوقع"
              : "An unexpected error occurred";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    processCallback();
  }, [searchParams, handleCallback, setUser, router, locale, texts.invalidParameters]);

  const handleBackToLogin = () => {
    router.push(`/${locale}/login`);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-100">
              <AlertCircle className="h-6 w-6 text-danger-600" />
            </div>
            <CardTitle className="text-2xl">{texts.errorTitle}</CardTitle>
            <CardDescription>{texts.errorDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-danger-50 p-4 text-sm text-danger-700">
              {error}
            </div>
            <Button
              onClick={handleBackToLogin}
              className="w-full"
              variant="outline"
            >
              {texts.backToLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <CardTitle className="text-2xl">{texts.title}</CardTitle>
          <CardDescription>{texts.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full w-2/3 animate-pulse bg-primary"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
