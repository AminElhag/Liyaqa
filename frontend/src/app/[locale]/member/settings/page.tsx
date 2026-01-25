"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Lock,
  Bell,
  Mail,
  Smartphone,
  Loader2,
  Check,
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
import { Switch } from "@/components/ui/switch";
import { useChangePassword } from "@/queries/use-member-portal";
import { toast } from "sonner";

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
  const t = useTranslations("member.settings");
  const locale = useLocale();

  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);

  // Notification preferences (local state for now - would connect to API)
  const [notificationPrefs, setNotificationPrefs] = React.useState({
    email: true,
    sms: false,
    push: true,
    inApp: true,
    bookingReminders: true,
    subscriptionAlerts: true,
    invoiceNotifications: true,
    marketing: false,
  });

  const changePasswordMutation = useChangePassword({
    onSuccess: () => {
      toast.success(
        locale === "ar"
          ? "تم تغيير كلمة المرور بنجاح"
          : "Password changed successfully"
      );
      reset();
    },
    onError: () => {
      toast.error(
        locale === "ar"
          ? "فشل في تغيير كلمة المرور"
          : "Failed to change password. Check your current password."
      );
    },
  });

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

  const onSubmitPassword = async (data: PasswordFormData) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const handleNotificationToggle = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {locale === "ar" ? "تغيير كلمة المرور" : "Change Password"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "أدخل كلمة المرور الحالية وكلمة المرور الجديدة"
              : "Enter your current password and a new password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {locale === "ar" ? "كلمة المرور الحالية" : "Current Password"}
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
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
                <p className="text-sm text-danger">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {locale === "ar" ? "كلمة المرور الجديدة" : "New Password"}
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
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
                <p className="text-sm text-danger">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-danger">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!isDirty || changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {locale === "ar" ? "جاري التغيير..." : "Changing..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 me-2" />
                  {locale === "ar" ? "تغيير كلمة المرور" : "Change Password"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t("channels")}
          </CardTitle>
          <CardDescription>{t("channelsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium">{t("email")}</p>
                <p className="text-sm text-neutral-500">{t("emailDesc")}</p>
              </div>
            </div>
            <Switch
              checked={notificationPrefs.email}
              onCheckedChange={() => handleNotificationToggle("email")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium">{t("sms")}</p>
                <p className="text-sm text-neutral-500">{t("smsDesc")}</p>
              </div>
            </div>
            <Switch
              checked={notificationPrefs.sms}
              onCheckedChange={() => handleNotificationToggle("sms")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="font-medium">{t("push")}</p>
                <p className="text-sm text-neutral-500">{t("pushDesc")}</p>
              </div>
            </div>
            <Switch
              checked={notificationPrefs.push}
              onCheckedChange={() => handleNotificationToggle("push")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("types")}</CardTitle>
          <CardDescription>{t("typesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("bookingReminders")}</p>
              <p className="text-sm text-neutral-500">{t("bookingRemindersDesc")}</p>
            </div>
            <Switch
              checked={notificationPrefs.bookingReminders}
              onCheckedChange={() => handleNotificationToggle("bookingReminders")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("subscriptionAlerts")}</p>
              <p className="text-sm text-neutral-500">{t("subscriptionAlertsDesc")}</p>
            </div>
            <Switch
              checked={notificationPrefs.subscriptionAlerts}
              onCheckedChange={() => handleNotificationToggle("subscriptionAlerts")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("invoiceNotifications")}</p>
              <p className="text-sm text-neutral-500">{t("invoiceNotificationsDesc")}</p>
            </div>
            <Switch
              checked={notificationPrefs.invoiceNotifications}
              onCheckedChange={() => handleNotificationToggle("invoiceNotifications")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("marketing")}</p>
              <p className="text-sm text-neutral-500">{t("marketingDesc")}</p>
            </div>
            <Switch
              checked={notificationPrefs.marketing}
              onCheckedChange={() => handleNotificationToggle("marketing")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Settings Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            toast.success(
              locale === "ar"
                ? "تم حفظ الإعدادات بنجاح"
                : "Settings saved successfully"
            );
          }}
        >
          <Check className="h-4 w-4 me-2" />
          {t("saveSettings")}
        </Button>
      </div>
    </div>
  );
}
