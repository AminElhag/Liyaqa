"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
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
import { useCreateUserForMember } from "@liyaqa/shared/queries/use-members";
import type { UUID } from "@liyaqa/shared/types/api";

const createUserSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: UUID;
  memberName?: string;
  memberEmail?: string;
  onSuccess?: () => void;
}

export function CreateUserAccountDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  memberEmail,
  onSuccess,
}: CreateUserAccountDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const createUser = useCreateUserForMember();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const texts = {
    title: locale === "ar" ? "إنشاء حساب مستخدم" : "Create User Account",
    description:
      locale === "ar"
        ? memberName
          ? `إنشاء حساب تسجيل دخول للعضو ${memberName}. سيتمكن من تسجيل الدخول باستخدام بريده الإلكتروني${memberEmail ? ` (${memberEmail})` : ""}.`
          : "إنشاء حساب تسجيل دخول لهذا العضو. سيتمكن من تسجيل الدخول باستخدام بريده الإلكتروني."
        : memberName
          ? `Create a login account for ${memberName}. They will be able to sign in using their email${memberEmail ? ` (${memberEmail})` : ""}.`
          : "Create a login account for this member. They will be able to sign in using their email.",
    password: locale === "ar" ? "كلمة المرور" : "Password",
    confirmPassword:
      locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    create: locale === "ar" ? "إنشاء الحساب" : "Create Account",
    creating: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
    successTitle:
      locale === "ar" ? "تم إنشاء الحساب" : "Account Created",
    successDescription:
      locale === "ar"
        ? "تم إنشاء حساب المستخدم بنجاح. يمكن للعضو الآن تسجيل الدخول."
        : "User account has been created successfully. The member can now sign in.",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    passwordPlaceholder:
      locale === "ar" ? "أدخل كلمة المرور" : "Enter password",
    confirmPlaceholder:
      locale === "ar" ? "أعد إدخال كلمة المرور" : "Confirm password",
    minChars:
      locale === "ar"
        ? "8 أحرف على الأقل"
        : "Minimum 8 characters",
    passwordsDoNotMatch:
      locale === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match",
  };

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    try {
      await createUser.mutateAsync({
        memberId,
        password: data.password,
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
            <UserPlus className="h-5 w-5 text-primary" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{texts.password}</Label>
            <div className="relative">
              <Input
                id="password"
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
                  {texts.creating}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 me-2" />
                  {texts.create}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
