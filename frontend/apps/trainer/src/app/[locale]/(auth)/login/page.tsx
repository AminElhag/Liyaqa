"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Building2, AlertCircle } from "lucide-react";
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
import { useAuthStore, useHasHydrated } from "@liyaqa/shared/stores/auth-store";
import { authApi } from "@liyaqa/shared/lib/api/auth";
import { isSubdomainAccess } from "@liyaqa/shared/lib/subdomain";
import type { LocalizedText } from "@liyaqa/shared/types/api";
import type { AccountType } from "@liyaqa/shared/types/auth";
import { AccountTypeSelector } from "@liyaqa/shared/components/auth/account-type-selector";

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

export default function TrainerLoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasHydrated = useHasHydrated();
  const {
    login,
    isLoading,
    error,
    clearError,
    accountTypeSelectionRequired,
    availableAccountTypes,
    user,
  } = useAuthStore();

  const [showPassword, setShowPassword] = React.useState(false);
  const [subdomainTenant, setSubdomainTenant] =
    React.useState<SubdomainTenant | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = React.useState(true);
  const [roleError, setRoleError] = React.useState<string | null>(null);
  const [wrongPortal, setWrongPortal] = React.useState(false);
  const [redirecting, setRedirecting] = React.useState(false);

  // Localized texts
  const texts = {
    title: locale === "ar" ? "تسجيل دخول المدرب" : "Trainer Login",
    description:
      locale === "ar"
        ? "ادخل بيانات الدخول الخاصة بك"
        : "Enter your credentials to access your trainer account",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    password: locale === "ar" ? "كلمة المرور" : "Password",
    forgotPassword: locale === "ar" ? "نسيت كلمة المرور؟" : "Forgot Password?",
    tenantId: locale === "ar" ? "معرّف المنشأة" : "Tenant ID",
    signIn: locale === "ar" ? "تسجيل الدخول" : "Sign In",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    invalidCredentials:
      locale === "ar" ? "بيانات اعتماد غير صالحة" : "Invalid credentials",
    wrongPortalTitle:
      locale === "ar"
        ? "هذا الحساب غير مخصص للمدربين"
        : "This account is not a trainer account",
    wrongPortalMessage:
      locale === "ar"
        ? "هذا الحساب مخصص لنوع آخر من المستخدمين. يرجى استخدام البوابة الصحيحة."
        : "This account is for a different type of user. Please use the correct portal.",
    redirectingToCorrectPortal:
      locale === "ar"
        ? "جاري إعادة التوجيه إلى البوابة الصحيحة..."
        : "Redirecting to the correct portal...",
    clubStaffPortal:
      locale === "ar" ? "بوابة موظفي النادي" : "Club Staff Portal",
    memberPortal: locale === "ar" ? "بوابة الأعضاء" : "Member Portal",
    wrongPortalQueryParam:
      locale === "ar"
        ? "هذا الحساب غير مخصص للمدربين. يرجى استخدام البوابة الصحيحة لنوع حسابك."
        : "This account is not for trainers. Please use the correct portal for your account type.",
  };

  // Check for wrong_portal query param
  React.useEffect(() => {
    if (searchParams.get("wrong_portal") === "true") {
      setWrongPortal(true);
    }
  }, [searchParams]);

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

  // Handle account type selection
  const handleAccountTypeSelected = async (accountType: AccountType) => {
    if (accountType === "TRAINER") {
      // Small delay for store to update
      await new Promise((resolve) => setTimeout(resolve, 100));
      router.replace(`/${locale}/trainer/dashboard`);
    } else {
      // Wrong account type selected - show message and redirect to correct portal
      setRedirecting(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redirect to correct portal based on account type
      if (accountType === "EMPLOYEE") {
        window.location.href = `/${locale}/dashboard`;
      } else if (accountType === "MEMBER") {
        window.location.href = `/${locale}/member/dashboard`;
      }
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    setRoleError(null);
    setWrongPortal(false);

    try {
      // Use subdomain tenant if available, otherwise use form input
      const tenantId = subdomainTenant?.tenantId || data.tenantId;
      if (!tenantId) {
        // This shouldn't happen if validation is correct
        return;
      }

      await login({ ...data, tenantId });

      // Small delay to ensure Zustand persist writes to localStorage
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if account type selection is required
      const state = useAuthStore.getState();
      if (state.accountTypeSelectionRequired) {
        // AccountTypeSelector will be shown automatically
        return;
      }

      // Get the user from the store to determine redirect
      const currentUser = state.user;
      if (!currentUser) {
        return;
      }

      // Check if the user's active account type is TRAINER
      if (currentUser.accountType === "TRAINER") {
        router.replace(`/${locale}/trainer/dashboard`);
      } else {
        // Wrong account type - show error
        setRoleError(texts.wrongPortalTitle);
        // Logout to clear invalid session
        state.logout();
      }
    } catch {
      // Error is handled in store
    }
  };

  // Helper to get localized club name
  const getClubName = (clubName: LocalizedText): string => {
    return locale === "ar" ? clubName.ar || clubName.en : clubName.en;
  };

  // Show loading state while hydrating
  if (!hasHydrated) {
    return (
      <Card className="shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show account type selector if required
  if (accountTypeSelectionRequired && availableAccountTypes.length > 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <AccountTypeSelector onSelected={handleAccountTypeSelected} />
          {redirecting && (
            <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center gap-2 text-primary-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{texts.redirectingToCorrectPortal}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{texts.title}</CardTitle>
        <CardDescription>{texts.description}</CardDescription>
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
          {/* Wrong portal warning from query param */}
          {wrongPortal && (
            <div className="p-3 bg-warning-50 border border-warning-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning-800">
                    {texts.wrongPortalQueryParam}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* General errors */}
          {(error || roleError) && (
            <div className="p-3 text-sm text-danger bg-danger-50 rounded-lg border border-danger-500/20">
              {roleError || texts.invalidCredentials}
              {roleError && (
                <div className="mt-2 pt-2 border-t border-danger-200">
                  <p className="text-xs text-danger-700">
                    {texts.wrongPortalMessage}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{texts.email}</Label>
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
              <Label htmlFor="password">{texts.password}</Label>
              <Link
                href={`/${locale}/forgot-password`}
                className="text-sm text-primary hover:underline"
              >
                {texts.forgotPassword}
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
              <Label htmlFor="tenantId">{texts.tenantId}</Label>
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
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                {texts.loading}
              </>
            ) : (
              texts.signIn
            )}
          </Button>
          <p className="text-sm text-center text-neutral-600">
            {locale === "ar" ? "هل لديك نوع حساب مختلف؟" : "Have a different account type?"}
          </p>
          <div className="flex flex-col gap-2 w-full text-sm">
            <Link
              href={`/${locale}/login`}
              className="text-primary font-medium hover:underline text-center"
            >
              {texts.clubStaffPortal}
            </Link>
            <Link
              href={`/${locale}/member/login`}
              className="text-primary font-medium hover:underline text-center"
            >
              {texts.memberPortal}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
