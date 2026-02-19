"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Building2 } from "lucide-react";

import { useAuthStore, useHasHydrated } from "@liyaqa/shared/stores/auth-store";
import { AccountTypeSelector } from "@liyaqa/shared/components/auth/account-type-selector";
import { isSubdomainAccess } from "@liyaqa/shared/lib/subdomain";
import { getAccessToken, setAccessToken } from "@liyaqa/shared/lib/api/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Alert, AlertDescription } from "@liyaqa/shared/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  tenantId: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function MemberLoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const hasHydrated = useHasHydrated();

  const {
    login,
    initialize,
    isAuthenticated,
    accountTypeSelectionRequired,
    availableAccountTypes,
    accountTypeSessionToken,
    user,
    isLoading,
  } = useAuthStore();

  const [showPassword, setShowPassword] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [wrongPortal, setWrongPortal] = React.useState(false);
  const initRef = React.useRef(false);
  const [authChecked, setAuthChecked] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      tenantId: isSubdomainAccess() ? window.location.hostname.split('.')[0] : "",
    },
  });

  // Check for wrong_portal query param
  React.useEffect(() => {
    if (searchParams.get("wrong_portal") === "true") {
      setWrongPortal(true);
    }
  }, [searchParams]);

  // Verify auth session on mount before trusting hydrated state
  React.useEffect(() => {
    if (hasHydrated && !initRef.current) {
      initRef.current = true;
      initialize()
        .then(() => {
          // Re-sync session_meta cookie from localStorage token
          const token = getAccessToken();
          if (token) setAccessToken(token);
        })
        .finally(() => setAuthChecked(true));
    }
  }, [hasHydrated, initialize]);

  // Only auto-redirect after auth has been verified (not just hydrated)
  React.useEffect(() => {
    if (!authChecked || isLoading) return;
    if (!isAuthenticated || user?.activeAccountType !== "MEMBER") return;
    const redirectPath = searchParams.get("redirect");
    const target = redirectPath || `/${locale}/member/dashboard`;
    router.replace(target);
  }, [authChecked, isLoading, isAuthenticated, user, locale, router, searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError(null);
      setWrongPortal(false);

      await login({
        email: data.email,
        password: data.password,
        tenantId: data.tenantId || undefined,
      });

      // After login, check if account type selection is required
      // If not, the login hook will have set the user, and the effect above will redirect
    } catch (error: any) {
      setLoginError(
        error?.message ||
          (locale === "ar"
            ? "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك."
            : "Login failed. Please check your credentials.")
      );
    }
  };

  const handleAccountTypeSelected = (accountType: "EMPLOYEE" | "TRAINER" | "MEMBER") => {
    if (accountType === "MEMBER") {
      router.replace(`/${locale}/member/dashboard`);
    } else {
      // Selected a non-member account type — redirect to correct portal
      setLoginError(
        locale === "ar"
          ? "يتم إعادة التوجيه إلى البوابة الصحيحة..."
          : "Redirecting to the correct portal..."
      );
      setTimeout(() => {
        if (accountType === "EMPLOYEE") {
          router.replace(`/${locale}/dashboard`);
        } else if (accountType === "TRAINER") {
          router.replace(`/${locale}/trainer/dashboard`);
        }
      }, 1500);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show account type selector if required
  if (accountTypeSelectionRequired && availableAccountTypes && accountTypeSessionToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "اختر نوع الحساب" : "Select Account Type"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "لديك أنواع حسابات متعددة. يرجى اختيار واحد للمتابعة."
              : "You have multiple account types. Please select one to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountTypeSelector onSelected={handleAccountTypeSelected} />
          {loginError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === "ar" ? "تسجيل دخول الأعضاء" : "Member Login"}
        </CardTitle>
        <CardDescription>
          {locale === "ar"
            ? "قم بتسجيل الدخول إلى حساب العضو الخاص بك"
            : "Sign in to your member account"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {wrongPortal && (
            <Alert variant="destructive">
              <AlertDescription>
                {locale === "ar"
                  ? "هذه البوابة مخصصة للأعضاء. إذا كنت مسؤولاً أو مدربًا، يرجى استخدام البوابة الصحيحة."
                  : "This portal is for members. If you're an admin or trainer, please use the correct portal."}
              </AlertDescription>
            </Alert>
          )}

          {loginError && (
            <Alert variant="destructive">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          {!isSubdomainAccess() && (
            <div className="space-y-2">
              <Label htmlFor="tenantId">
                {locale === "ar" ? "معرف النادي" : "Club ID"}
              </Label>
              <div className="relative">
                <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tenantId"
                  type="text"
                  placeholder={locale === "ar" ? "معرف النادي الخاص بك" : "Your club ID"}
                  className="ps-10"
                  {...register("tenantId")}
                />
              </div>
              {errors.tenantId && (
                <p className="text-sm text-destructive">{errors.tenantId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">
              {locale === "ar" ? "البريد الإلكتروني" : "Email"}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={
                locale === "ar" ? "name@example.com" : "name@example.com"
              }
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {locale === "ar" ? "كلمة المرور" : "Password"}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {locale === "ar" ? "جاري تسجيل الدخول..." : "Signing in..."}
              </>
            ) : locale === "ar" ? (
              "تسجيل الدخول"
            ) : (
              "Sign in"
            )}
          </Button>

          <div className="text-sm text-center text-muted-foreground">
            {locale === "ar" ? (
              <>
                نسيت كلمة المرور؟{" "}
                <a
                  href={`/${locale}/forgot-password`}
                  className="text-primary hover:underline"
                >
                  إعادة تعيين
                </a>
              </>
            ) : (
              <>
                Forgot password?{" "}
                <a
                  href={`/${locale}/forgot-password`}
                  className="text-primary hover:underline"
                >
                  Reset
                </a>
              </>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
