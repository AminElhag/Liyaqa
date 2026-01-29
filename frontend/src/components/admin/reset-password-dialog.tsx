"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Key, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useResetMemberPassword } from "@/queries/use-members";
import type { UUID } from "@/types/api";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: UUID;
  memberName?: string;
  onSuccess?: () => void;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  onSuccess,
}: ResetPasswordDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetPassword = useResetMemberPassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const texts = {
    title: locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password",
    description:
      locale === "ar"
        ? memberName
          ? `قم بتعيين كلمة مرور جديدة للعضو ${memberName}. سيتم تسجيل خروجه من جميع الأجهزة.`
          : "قم بتعيين كلمة مرور جديدة للعضو. سيتم تسجيل خروجه من جميع الأجهزة."
        : memberName
          ? `Set a new password for ${memberName}. They will be logged out of all devices.`
          : "Set a new password for this member. They will be logged out of all devices.",
    newPassword: locale === "ar" ? "كلمة المرور الجديدة" : "New Password",
    confirmPassword:
      locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    reset: locale === "ar" ? "إعادة تعيين" : "Reset Password",
    resetting: locale === "ar" ? "جاري التعيين..." : "Resetting...",
    successTitle:
      locale === "ar" ? "تم إعادة تعيين كلمة المرور" : "Password Reset",
    successDescription:
      locale === "ar"
        ? "تم إعادة تعيين كلمة المرور بنجاح"
        : "Password has been reset successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    passwordPlaceholder:
      locale === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter new password",
    confirmPlaceholder:
      locale === "ar" ? "أعد إدخال كلمة المرور" : "Confirm new password",
    minChars:
      locale === "ar"
        ? "8 أحرف على الأقل"
        : "Minimum 8 characters",
    passwordsDoNotMatch:
      locale === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match",
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await resetPassword.mutateAsync({
        memberId,
        newPassword: data.newPassword,
      });

      toast({
        title: texts.successTitle,
        description: texts.successDescription,
      });

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description:
          error instanceof Error ? error.message : "An error occurred",
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
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-500" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{texts.newPassword}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder={texts.passwordPlaceholder}
                {...register("newPassword")}
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
            {errors.newPassword && (
              <p className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{texts.confirmPassword}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
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
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {texts.reset}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
