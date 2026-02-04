"use client";

import * as React from "react";
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
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { PasswordStrengthIndicator } from "@liyaqa/shared/components/auth/password-strength-indicator";
import { passwordSchema } from "@liyaqa/shared/lib/validations/password-schema";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Watch new password field for strength indicator
  const newPassword = watch("newPassword", "");

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }

      toast({
        title: locale === "ar" ? "تم تغيير كلمة المرور" : "Password Changed",
        description:
          locale === "ar"
            ? "تم تغيير كلمة المرور بنجاح. سيتم تسجيل خروجك من جميع الأجهزة."
            : "Your password has been changed successfully. You will be logged out from all devices.",
      });

      reset();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          error instanceof Error
            ? error.message
            : locale === "ar"
            ? "فشل تغيير كلمة المرور"
            : "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "تغيير كلمة المرور" : "Change Password"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "قم بتحديث كلمة المرور الخاصة بك لتحسين أمان حسابك"
              : "Update your password to improve your account security"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {locale === "ar" ? "كلمة المرور الحالية" : "Current Password"}
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("currentPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-neutral-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-500" />
                  )}
                </Button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-danger">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {locale === "ar" ? "كلمة المرور الجديدة" : "New Password"}
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("newPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-neutral-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-500" />
                  )}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-danger">
                  {errors.newPassword.message}
                </p>
              )}
              {/* Password Strength Indicator */}
              {newPassword && (
                <PasswordStrengthIndicator
                  password={newPassword}
                  isPlatformUser={false}
                  locale={locale as "en" | "ar"}
                />
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {locale === "ar"
                  ? "تأكيد كلمة المرور الجديدة"
                  : "Confirm New Password"}
              </Label>
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

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    {locale === "ar" ? "جاري التحميل..." : "Loading..."}
                  </>
                ) : locale === "ar" ? (
                  "تغيير كلمة المرور"
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
