"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Key, Loader2, Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useAdminResetPassword,
  useAdminSendResetEmail,
} from "@liyaqa/shared/queries/use-employees";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";
import type { UUID } from "@liyaqa/shared/types/api";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

type Mode = "set-password" | "send-email";

interface EmployeeResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: UUID;
  employeeName?: string;
  employeeEmail?: string;
}

export function EmployeeResetPasswordDialog({
  open,
  onOpenChange,
  userId,
  employeeName,
  employeeEmail,
}: EmployeeResetPasswordDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mode, setMode] = useState<Mode>("set-password");

  const resetPassword = useAdminResetPassword();
  const sendResetEmail = useAdminSendResetEmail();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const texts = {
    title: locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password",
    description:
      locale === "ar"
        ? employeeName
          ? `إعادة تعيين كلمة المرور للموظف ${employeeName}`
          : "إعادة تعيين كلمة المرور لهذا الموظف"
        : employeeName
          ? `Reset password for ${employeeName}`
          : "Reset password for this employee",
    setPassword:
      locale === "ar" ? "تعيين كلمة مرور جديدة" : "Set New Password",
    sendEmail:
      locale === "ar" ? "إرسال بريد إعادة التعيين" : "Send Reset Email",
    password: locale === "ar" ? "كلمة المرور الجديدة" : "New Password",
    confirmPassword:
      locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    resetBtn: locale === "ar" ? "إعادة تعيين" : "Reset Password",
    resetting:
      locale === "ar" ? "جاري إعادة التعيين..." : "Resetting...",
    sendBtn: locale === "ar" ? "إرسال البريد" : "Send Email",
    sending: locale === "ar" ? "جاري الإرسال..." : "Sending...",
    successSetTitle:
      locale === "ar" ? "تم إعادة تعيين كلمة المرور" : "Password Reset",
    successSetDescription:
      locale === "ar"
        ? "تم تعيين كلمة المرور الجديدة بنجاح. تم تسجيل خروج جميع الجلسات النشطة."
        : "New password has been set successfully. All active sessions have been logged out.",
    successEmailTitle:
      locale === "ar" ? "تم إرسال البريد" : "Email Sent",
    successEmailDescription:
      locale === "ar"
        ? "تم إرسال بريد إعادة تعيين كلمة المرور بنجاح."
        : "Password reset email has been sent successfully.",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    passwordPlaceholder:
      locale === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter new password",
    confirmPlaceholder:
      locale === "ar" ? "أعد إدخال كلمة المرور" : "Confirm password",
    minChars:
      locale === "ar" ? "8 أحرف على الأقل" : "Minimum 8 characters",
    emailWillBeSent:
      locale === "ar"
        ? "سيتم إرسال رابط إعادة تعيين كلمة المرور إلى:"
        : "A password reset link will be sent to:",
    noEmail:
      locale === "ar"
        ? "لا يوجد بريد إلكتروني مسجل لهذا الموظف."
        : "No email address on file for this employee.",
  };

  const onSubmitPassword = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await resetPassword.mutateAsync({
        userId,
        newPassword: data.password,
      });

      toast({
        title: texts.successSetTitle,
        description: texts.successSetDescription,
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      const apiError = await parseApiError(error);
      toast({
        title: texts.errorTitle,
        description: getLocalizedErrorMessage(apiError, locale),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSendEmail = async () => {
    setIsSubmitting(true);
    try {
      await sendResetEmail.mutateAsync(userId);

      toast({
        title: texts.successEmailTitle,
        description: texts.successEmailDescription,
      });

      onOpenChange(false);
    } catch (error) {
      const apiError = await parseApiError(error);
      toast({
        title: texts.errorTitle,
        description: getLocalizedErrorMessage(apiError, locale),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
      setShowPassword(false);
      setShowConfirmPassword(false);
      setMode("set-password");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 border rounded-lg p-1">
          <Button
            type="button"
            variant={mode === "set-password" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setMode("set-password")}
          >
            <Key className="h-4 w-4 me-2" />
            {texts.setPassword}
          </Button>
          <Button
            type="button"
            variant={mode === "send-email" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setMode("send-email")}
          >
            <Mail className="h-4 w-4 me-2" />
            {texts.sendEmail}
          </Button>
        </div>

        {mode === "set-password" ? (
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="reset-password">{texts.password}</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={texts.passwordPlaceholder}
                  {...register("password")}
                  className="pe-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{texts.minChars}</p>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="reset-confirmPassword">
                {texts.confirmPassword}
              </Label>
              <div className="relative">
                <Input
                  id="reset-confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={texts.confirmPlaceholder}
                  {...register("confirmPassword")}
                  className="pe-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                {texts.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {texts.resetting}
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 me-2" />
                    {texts.resetBtn}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            {employeeEmail ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {texts.emailWillBeSent}
                </p>
                <p className="font-medium">{employeeEmail}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{texts.noEmail}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                {texts.cancel}
              </Button>
              <Button
                type="button"
                onClick={onSendEmail}
                disabled={isSubmitting || !employeeEmail}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {texts.sending}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 me-2" />
                    {texts.sendBtn}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
