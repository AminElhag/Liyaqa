"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import { PasswordStrengthIndicator } from "@liyaqa/shared/components/auth/password-strength-indicator";
import { passwordSchema } from "@liyaqa/shared/lib/validations/password-schema";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tMembers = useTranslations("members");
  const locale = useLocale();
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Watch password field for strength indicator
  const password = watch("password", "");

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: { en: data.firstName },
        lastName: { en: data.lastName },
      });
      router.push(`/${locale}/dashboard`);
    } catch {
      // Error is handled in store
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t("register")}</CardTitle>
        <CardDescription>
          {locale === "ar"
            ? "انشئ حسابك الجديد"
            : "Create your new account"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-danger bg-danger-50 rounded-lg border border-danger-500/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{tMembers("firstName")}</Label>
              <Input
                id="firstName"
                placeholder={locale === "ar" ? "الاسم الأول" : "John"}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-sm text-danger">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{tMembers("lastName")}</Label>
              <Input
                id="lastName"
                placeholder={locale === "ar" ? "اسم العائلة" : "Doe"}
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-sm text-danger">{errors.lastName.message}</p>
              )}
            </div>
          </div>

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
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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
            {/* Password Strength Indicator */}
            {password && (
              <PasswordStrengthIndicator
                password={password}
                isPlatformUser={false}
                locale={locale as "en" | "ar"}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-danger">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {locale === "ar" ? "جاري التحميل..." : "Loading..."}
              </>
            ) : (
              t("signUp")
            )}
          </Button>
          <p className="text-sm text-center text-neutral-600">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href={`/${locale}/login`}
              className="text-primary font-medium hover:underline"
            >
              {t("signIn")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
