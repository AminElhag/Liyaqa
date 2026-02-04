"use client";

import { use, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Users, Key, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useUser, useResetUserPassword } from "@liyaqa/shared/queries/use-users";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { getLocalizedText } from "@liyaqa/shared/utils";

interface ResetPasswordPageProps {
  params: Promise<{ id: string }>;
}

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const { data: user, isLoading, error } = useUser(id);
  const resetPassword = useResetUserPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordData) => {
    try {
      await resetPassword.mutateAsync({
        id,
        newPassword: data.newPassword,
      });
      toast({
        title: locale === "ar" ? "تم إعادة التعيين" : "Password Reset",
        description:
          locale === "ar"
            ? "تم إعادة تعيين كلمة المرور بنجاح"
            : "Password has been reset successfully",
      });
      router.push(`/${locale}/users/${id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في إعادة تعيين كلمة المرور"
            : "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/users`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمستخدمين" : "Back to users"}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>
              {locale === "ar"
                ? "لم يتم العثور على المستخدم"
                : "User not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/users/${id}`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمستخدم" : "Back to user"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Key className="h-6 w-6" />
          {locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
        </h1>
        <p className="text-neutral-500">
          {getLocalizedText(user.displayName, locale)} ({user.email})
        </p>
      </div>

      {/* Reset Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "ar" ? "كلمة المرور الجديدة" : "New Password"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {locale === "ar" ? "كلمة المرور الجديدة" : "New Password"} *
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  {...register("newPassword")}
                  placeholder="********"
                  className="pe-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-danger">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"} *
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                {...register("confirmPassword")}
                placeholder="********"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-danger">
                  {locale === "ar"
                    ? "كلمات المرور غير متطابقة"
                    : errors.confirmPassword.message}
                </p>
              )}
            </div>

            <p className="text-xs text-neutral-500">
              {locale === "ar"
                ? "سيتم إرسال إشعار للمستخدم عبر البريد الإلكتروني حول تغيير كلمة المرور"
                : "The user will receive an email notification about the password change"}
            </p>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            {locale === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="submit" disabled={resetPassword.isPending}>
            {resetPassword.isPending
              ? locale === "ar"
                ? "جاري إعادة التعيين..."
                : "Resetting..."
              : locale === "ar"
                ? "إعادة تعيين كلمة المرور"
                : "Reset Password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
