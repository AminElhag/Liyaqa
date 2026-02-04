"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import type { User } from "@liyaqa/shared/types/auth";

/**
 * Client roles that can be assigned in the admin panel.
 * Platform roles are not available for user creation here.
 */
type ClientRole = "SUPER_ADMIN" | "CLUB_ADMIN" | "STAFF" | "MEMBER";

const userFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  displayName: z.object({
    en: z.string().min(1, "English display name is required"),
    ar: z.string().nullish(),
  }),
  role: z.enum(["SUPER_ADMIN", "CLUB_ADMIN", "STAFF", "MEMBER"] as const),
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User;
  onSubmit: (data: UserFormData) => void;
  isPending?: boolean;
}

const ROLES: { value: ClientRole; labelEn: string; labelAr: string }[] = [
  { value: "SUPER_ADMIN", labelEn: "Super Admin", labelAr: "مدير النظام" },
  { value: "CLUB_ADMIN", labelEn: "Club Admin", labelAr: "مدير النادي" },
  { value: "STAFF", labelEn: "Staff", labelAr: "موظف" },
  { value: "MEMBER", labelEn: "Member", labelAr: "عضو" },
];

/**
 * Check if a role is a valid client role
 */
function isClientRole(role: string): role is ClientRole {
  return ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF", "MEMBER"].includes(role);
}

export function UserForm({ user, onSubmit, isPending }: UserFormProps) {
  const locale = useLocale();

  // Get default role - only use if it's a client role
  const defaultRole: ClientRole =
    user?.role && isClientRole(user.role) ? user.role : "STAFF";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: user?.email || "",
      password: "",
      displayName: {
        en: user?.displayName?.en || "",
        ar: user?.displayName?.ar || "",
      },
      role: defaultRole,
    },
  });

  const selectedRole = watch("role");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "معلومات الحساب" : "Account Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">
                {locale === "ar" ? "البريد الإلكتروني" : "Email"} *
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="user@example.com"
                disabled={!!user} // Email can't be changed for existing users
              />
              {errors.email && (
                <p className="text-sm text-danger">{errors.email.message}</p>
              )}
            </div>
            {!user && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  {locale === "ar" ? "كلمة المرور" : "Password"} *
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="********"
                />
                {errors.password && (
                  <p className="text-sm text-danger">{errors.password.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              {locale === "ar" ? "الدور" : "Role"} *
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue("role", value as ClientRole)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={locale === "ar" ? "اختر الدور" : "Select role"}
                />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {locale === "ar" ? role.labelAr : role.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-danger">{errors.role.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "المعلومات الشخصية" : "Personal Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName.en">
                {locale === "ar" ? "الاسم (إنجليزي)" : "Display Name (English)"} *
              </Label>
              <Input
                id="displayName.en"
                {...register("displayName.en")}
                placeholder="John Doe"
              />
              {errors.displayName?.en && (
                <p className="text-sm text-danger">{errors.displayName.en.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName.ar">
                {locale === "ar" ? "الاسم (عربي)" : "Display Name (Arabic)"}
              </Label>
              <Input
                id="displayName.ar"
                {...register("displayName.ar")}
                placeholder="أحمد محمد"
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? locale === "ar"
              ? "جاري الحفظ..."
              : "Saving..."
            : user
              ? locale === "ar"
                ? "حفظ التغييرات"
                : "Save Changes"
              : locale === "ar"
                ? "إنشاء المستخدم"
                : "Create User"}
        </Button>
      </div>
    </form>
  );
}
