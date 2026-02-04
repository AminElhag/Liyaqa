"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
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
import { authApi } from "@liyaqa/shared/lib/api/auth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(data);
      setIsSuccess(true);
    } catch {
      setError(
        locale === "ar"
          ? "حدث خطأ. يرجى المحاولة مرة أخرى."
          : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-success-50 flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {locale === "ar" ? "تحقق من بريدك الإلكتروني" : "Check Your Email"}
          </CardTitle>
          <CardDescription>{t("resetLinkSent")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/${locale}/login`}>
              <ArrowLeft className="h-4 w-4 me-2" />
              {t("backToLogin")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">
          {t("forgotPassword").replace("?", "")}
        </CardTitle>
        <CardDescription>
          {locale === "ar"
            ? "ادخل بريدك الإلكتروني لإعادة تعيين كلمة المرور"
            : "Enter your email to reset your password"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-danger bg-danger-50 rounded-lg border border-danger-500/20">
              {error}
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {locale === "ar" ? "جاري الإرسال..." : "Sending..."}
              </>
            ) : (
              t("sendResetLink")
            )}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href={`/${locale}/login`}>
              <ArrowLeft className="h-4 w-4 me-2" />
              {t("backToLogin")}
            </Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
