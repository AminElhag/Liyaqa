"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Building2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { authApi } from "@liyaqa/shared/lib/api/auth";
import { isSubdomainAccess } from "@liyaqa/shared/lib/subdomain";
import type { LocalizedText } from "@liyaqa/shared/types/api";
import { MfaVerificationModal } from "@liyaqa/shared/components/auth/mfa-verification-modal";
import { OAuthLoginButtons } from "@liyaqa/shared/components/auth/oauth-login-buttons";

// Schema when subdomain is detected (tenantId optional)
const loginSchemaWithSubdomain = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
});

// Schema when no subdomain (tenantId required)
const loginSchemaWithoutSubdomain = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  tenantId: z.string().uuid("Invalid tenant ID"),
});

type LoginFormData = z.infer<typeof loginSchemaWithSubdomain>;

interface SubdomainTenant {
  tenantId: string;
  clubName: LocalizedText;
  slug: string;
}

export default function LoginPage() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const {
    login,
    verifyMfaAndLogin,
    isLoading,
    error,
    clearError,
    mfaRequired,
    mfaEmail,
    clearMfaState,
  } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [subdomainTenant, setSubdomainTenant] =
    React.useState<SubdomainTenant | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = React.useState(true);
  const [roleError, setRoleError] = React.useState<string | null>(null);
  const [mfaError, setMfaError] = React.useState<string | null>(null);

  // Localized texts for staff-only validation
  const texts = {
    wrongRole:
      locale === "ar"
        ? "هذا الحساب غير مصرح له بالوصول إلى لوحة تحكم الموظفين. يرجى استخدام تسجيل دخول الأعضاء."
        : "This account cannot access the staff portal. Please use the member login.",
    memberLoginLink:
      locale === "ar"
        ? "هل أنت عضو؟ تسجيل دخول الأعضاء"
        : "Are you a member? Member Login",
  };

  // Check for subdomain-based tenant on mount
  React.useEffect(() => {
    async function resolveTenant() {
      if (isSubdomainAccess()) {
        try {
          const info = await authApi.getTenantInfo();
          if (info.resolved && info.tenantId && info.clubName && info.slug) {
            setSubdomainTenant({
              tenantId: info.tenantId,
              clubName: info.clubName,
              slug: info.slug,
            });
          }
        } catch (err) {
          // Only log in development
          if (process.env.NODE_ENV === "development") {
            console.error("Failed to resolve tenant from subdomain:", err);
          }
        }
      }
      setIsLoadingTenant(false);
    }
    resolveTenant();
  }, []);

  // Use appropriate schema based on subdomain detection
  const schema = subdomainTenant
    ? loginSchemaWithSubdomain
    : loginSchemaWithoutSubdomain;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    setRoleError(null);
    setMfaError(null);

    try {
      // Use subdomain tenant if available, otherwise use form input
      const tenantId = subdomainTenant?.tenantId || data.tenantId;
      if (!tenantId) {
        // This shouldn't happen if validation is correct
        return;
      }

      await login({ ...data, tenantId });

      // Check if MFA is required - if so, modal will open automatically
      const { mfaRequired: isMfaRequired } = useAuthStore.getState();
      if (isMfaRequired) {
        return; // Wait for MFA verification
      }

      // Small delay to ensure Zustand persist writes to localStorage
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get the user from the store to determine redirect
      const { user, logout } = useAuthStore.getState();

      // Validate role - only staff roles can use this login
      const allowedRoles = ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF"];
      if (!user?.role || !allowedRoles.includes(user.role)) {
        setRoleError(texts.wrongRole);
        // Logout to clear invalid session
        logout();
        return;
      }

      // Redirect to staff dashboard
      router.replace(`/${locale}/dashboard`);
    } catch {
      // Error is handled in store
    }
  };

  const handleMfaVerify = async (code: string) => {
    setMfaError(null);
    try {
      await verifyMfaAndLogin(code);

      // Small delay to ensure Zustand persist writes to localStorage
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get the user from the store to determine redirect
      const { user, logout } = useAuthStore.getState();

      // Validate role - only staff roles can use this login
      const allowedRoles = ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF"];
      if (!user?.role || !allowedRoles.includes(user.role)) {
        setRoleError(texts.wrongRole);
        // Logout to clear invalid session
        logout();
        return;
      }

      // Redirect to staff dashboard
      router.replace(`/${locale}/dashboard`);
    } catch (err) {
      const error = err as Error & { message?: string };
      setMfaError(error.message || (locale === "ar" ? "رمز MFA غير صالح" : "Invalid MFA code"));
    }
  };

  const handleMfaCancel = () => {
    clearMfaState();
    setMfaError(null);
  };

  // Helper to get localized club name
  const getClubName = (clubName: LocalizedText): string => {
    return locale === "ar" ? clubName.ar || clubName.en : clubName.en;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t("login")}</CardTitle>
        <CardDescription>
          {locale === "ar"
            ? "ادخل بيانات الدخول الخاصة بك"
            : "Enter your credentials to access your account"}
        </CardDescription>
        {/* Show club name if subdomain detected */}
        {subdomainTenant && (
          <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-primary-700">
              <Building2 className="h-5 w-5" />
              <span className="font-medium">
                {getClubName(subdomainTenant.clubName)}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* OAuth Login Buttons */}
          <OAuthLoginButtons organizationId={subdomainTenant?.tenantId} />

          {(error || roleError) && (
            <div className="p-3 text-sm text-danger bg-danger-50 rounded-lg border border-danger-500/20">
              {roleError || t("invalidCredentials")}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("password")}</Label>
              <Link
                href={`/${locale}/forgot-password`}
                className="text-sm text-primary hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-neutral-500" />
                ) : (
                  <Eye className="h-4 w-4 text-neutral-500" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-danger">{errors.password.message}</p>
            )}
          </div>

          {/* Only show tenant ID field if no subdomain detected */}
          {!subdomainTenant && !isLoadingTenant && (
            <div className="space-y-2">
              <Label htmlFor="tenantId">
                {locale === "ar" ? "معرّف المنشأة" : "Tenant ID"}
              </Label>
              <Input
                id="tenantId"
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                {...register("tenantId")}
              />
              {errors.tenantId && (
                <p className="text-sm text-danger">{errors.tenantId.message}</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {locale === "ar" ? "جاري التحميل..." : "Loading..."}
              </>
            ) : (
              t("signIn")
            )}
          </Button>
          <p className="text-sm text-center text-neutral-600">
            {t("dontHaveAccount")}{" "}
            <Link
              href={`/${locale}/register`}
              className="text-primary font-medium hover:underline"
            >
              {t("signUp")}
            </Link>
          </p>
          <p className="text-sm text-center text-neutral-600">
            <Link
              href={`/${locale}/member/login`}
              className="text-primary font-medium hover:underline"
            >
              {texts.memberLoginLink}
            </Link>
          </p>
        </CardFooter>
      </form>

      {/* MFA Verification Modal */}
      <MfaVerificationModal
        open={mfaRequired}
        onOpenChange={(open) => !open && handleMfaCancel()}
        onVerify={handleMfaVerify}
        isLoading={isLoading}
        error={mfaError}
        email={mfaEmail || undefined}
      />
    </Card>
  );
}
