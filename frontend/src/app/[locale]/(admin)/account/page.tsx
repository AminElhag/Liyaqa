"use client";

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Building2,
  Lock,
  Shield,
  Mail,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import { authApi } from "@/lib/api/auth";
import { getLocalizedText } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { tenantName, organizationName } = useTenantStore();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const texts = {
    title: locale === "ar" ? "الإعدادات" : "Settings",
    description:
      locale === "ar"
        ? "إدارة ملفك الشخصي وإعدادات الأمان"
        : "Manage your profile and security settings",

    // Profile section
    profileTitle: locale === "ar" ? "الملف الشخصي" : "Profile",
    profileDescription:
      locale === "ar"
        ? "معلومات حسابك الأساسية"
        : "Your basic account information",
    name: locale === "ar" ? "الاسم" : "Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    role: locale === "ar" ? "الدور" : "Role",

    // Organization section
    organizationTitle: locale === "ar" ? "المنظمة" : "Organization",
    organizationDescription:
      locale === "ar"
        ? "معلومات المنظمة والنادي"
        : "Organization and club information",
    organization: locale === "ar" ? "المنظمة" : "Organization",
    club: locale === "ar" ? "النادي" : "Club",
    notSet: locale === "ar" ? "غير محدد" : "Not set",

    // Password section
    passwordTitle: locale === "ar" ? "تغيير كلمة المرور" : "Change Password",
    passwordDescription:
      locale === "ar"
        ? "تحديث كلمة المرور الخاصة بك"
        : "Update your password",
    currentPassword:
      locale === "ar" ? "كلمة المرور الحالية" : "Current Password",
    newPassword: locale === "ar" ? "كلمة المرور الجديدة" : "New Password",
    confirmPassword:
      locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    changePassword: locale === "ar" ? "تغيير كلمة المرور" : "Change Password",
    changing: locale === "ar" ? "جاري التغيير..." : "Changing...",

    // Messages
    passwordChanged:
      locale === "ar"
        ? "تم تغيير كلمة المرور بنجاح"
        : "Password changed successfully",
    passwordChangeFailed:
      locale === "ar"
        ? "فشل تغيير كلمة المرور"
        : "Failed to change password",
    success: locale === "ar" ? "نجاح" : "Success",
    error: locale === "ar" ? "خطأ" : "Error",

    // Validation
    currentPasswordRequired:
      locale === "ar"
        ? "كلمة المرور الحالية مطلوبة"
        : "Current password is required",
    passwordMin:
      locale === "ar"
        ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
        : "Password must be at least 8 characters",
    confirmPasswordRequired:
      locale === "ar"
        ? "يرجى تأكيد كلمة المرور"
        : "Please confirm your password",
    passwordsDoNotMatch:
      locale === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match",
  };

  const getRoleBadgeVariant = (
    role?: UserRole
  ): "default" | "secondary" | "success" | "warning" => {
    switch (role) {
      case "SUPER_ADMIN":
        return "default";
      case "CLUB_ADMIN":
        return "success";
      case "STAFF":
        return "secondary";
      case "MEMBER":
        return "warning";
      default:
        return "default";
    }
  };

  const getRoleLabel = (role?: UserRole): string => {
    if (!role) return texts.notSet;

    const labels: Record<string, { en: string; ar: string }> = {
      SUPER_ADMIN: { en: "Super Admin", ar: "مدير عام" },
      CLUB_ADMIN: { en: "Club Admin", ar: "مدير النادي" },
      STAFF: { en: "Staff", ar: "موظف" },
      MEMBER: { en: "Member", ar: "عضو" },
    };

    return locale === "ar"
      ? labels[role]?.ar || role
      : labels[role]?.en || role;
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast({
        title: texts.success,
        description: texts.passwordChanged,
      });
      reset();
    } catch (error) {
      toast({
        title: texts.error,
        description: texts.passwordChangeFailed,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{texts.title}</h1>
        <p className="text-neutral-500">{texts.description}</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {texts.profileTitle}
          </CardTitle>
          <CardDescription>{texts.profileDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-500">
                {texts.name}
              </span>
            </div>
            <span className="font-medium">
              {user
                ? getLocalizedText(user.displayName, locale)
                : texts.notSet}
            </span>
          </div>

          <Separator />

          {/* Email */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-500">
                {texts.email}
              </span>
            </div>
            <span className="font-medium">{user?.email || texts.notSet}</span>
          </div>

          <Separator />

          {/* Role */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-500">
                {texts.role}
              </span>
            </div>
            <Badge variant={getRoleBadgeVariant(user?.role)}>
              {getRoleLabel(user?.role)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {texts.organizationTitle}
          </CardTitle>
          <CardDescription>{texts.organizationDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Organization */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-500">
                {texts.organization}
              </span>
            </div>
            <span className="font-medium">
              {organizationName || texts.notSet}
            </span>
          </div>

          <Separator />

          {/* Club */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-500">
                {texts.club}
              </span>
            </div>
            <span className="font-medium">{tenantName || texts.notSet}</span>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {texts.passwordTitle}
          </CardTitle>
          <CardDescription>{texts.passwordDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmitPassword)}
            className="space-y-4"
          >
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{texts.currentPassword}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  {...register("currentPassword")}
                  className="pe-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                <p className="text-sm text-destructive">
                  {locale === "ar"
                    ? texts.currentPasswordRequired
                    : errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">{texts.newPassword}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...register("newPassword")}
                  className="pe-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                <p className="text-sm text-destructive">
                  {locale === "ar"
                    ? texts.passwordMin
                    : errors.newPassword.message}
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
                  {...register("confirmPassword")}
                  className="pe-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-neutral-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-500" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {locale === "ar"
                    ? texts.passwordsDoNotMatch
                    : errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={!isDirty || isChangingPassword}>
                <Save className="h-4 w-4 me-2" />
                {isChangingPassword ? texts.changing : texts.changePassword}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
