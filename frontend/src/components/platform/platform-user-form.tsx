"use client";

import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Shield, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlatformUser, PlatformUserRole } from "@/types/platform/platform-user";

/**
 * Zod validation schema for platform user form.
 */
const platformUserFormSchema = z
  .object({
    // Account
    email: z.string().email("Invalid email address"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),

    // Profile
    displayNameEn: z.string().min(1, "English name is required"),
    displayNameAr: z.string().optional(),
    phoneNumber: z.string().optional(),

    // Role
    role: z.enum(["PLATFORM_ADMIN", "SALES_REP", "SUPPORT_REP"] as const),
  })
  .refine(
    (data) => {
      // Password required for create mode, handled by parent validation
      return true;
    },
    { message: "Password confirmation must match" }
  );

export type PlatformUserFormValues = z.infer<typeof platformUserFormSchema>;

interface PlatformUserFormProps {
  defaultValues?: Partial<PlatformUserFormValues>;
  user?: PlatformUser;
  onSubmit: (data: PlatformUserFormValues) => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

/**
 * Form component for creating and editing platform users.
 */
export function PlatformUserForm({
  defaultValues,
  user,
  onSubmit,
  isLoading = false,
  mode,
}: PlatformUserFormProps) {
  const locale = useLocale();

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlatformUserFormValues>({
    resolver: zodResolver(platformUserFormSchema),
    defaultValues: {
      email: user?.email || "",
      password: "",
      confirmPassword: "",
      displayNameEn: user?.displayNameEn || "",
      displayNameAr: user?.displayNameAr || "",
      phoneNumber: user?.phoneNumber || "",
      role: user?.role || "SUPPORT_REP",
      ...defaultValues,
    },
  });

  // Watch role value
  const watchRole = watch("role");

  const texts = {
    // Section headers
    accountSection: locale === "ar" ? "معلومات الحساب" : "Account Information",
    accountSectionDesc:
      locale === "ar"
        ? "بيانات تسجيل الدخول للمستخدم"
        : "Login credentials for the user",
    profileSection: locale === "ar" ? "الملف الشخصي" : "Profile",
    profileSectionDesc:
      locale === "ar"
        ? "الاسم ومعلومات الاتصال"
        : "Name and contact information",
    roleSection: locale === "ar" ? "الدور والصلاحيات" : "Role & Permissions",
    roleSectionDesc:
      locale === "ar"
        ? "مستوى الوصول للمستخدم"
        : "User access level",

    // Fields
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    emailPlaceholder: locale === "ar" ? "أدخل البريد الإلكتروني" : "Enter email address",
    password: locale === "ar" ? "كلمة المرور" : "Password",
    passwordPlaceholder: locale === "ar" ? "أدخل كلمة المرور" : "Enter password",
    confirmPassword: locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    confirmPasswordPlaceholder: locale === "ar" ? "أعد إدخال كلمة المرور" : "Re-enter password",
    passwordHintEdit:
      locale === "ar"
        ? "اتركه فارغاً للإبقاء على كلمة المرور الحالية"
        : "Leave blank to keep current password",
    displayNameEn: locale === "ar" ? "الاسم (بالإنجليزية)" : "Display Name (English)",
    displayNameEnPlaceholder: locale === "ar" ? "أدخل الاسم بالإنجليزية" : "Enter English name",
    displayNameAr: locale === "ar" ? "الاسم (بالعربية)" : "Display Name (Arabic)",
    displayNameArPlaceholder: locale === "ar" ? "أدخل الاسم بالعربية" : "Enter Arabic name",
    phoneNumber: locale === "ar" ? "رقم الهاتف" : "Phone Number",
    phoneNumberPlaceholder: locale === "ar" ? "+966 5X XXX XXXX" : "+966 5X XXX XXXX",
    role: locale === "ar" ? "الدور" : "Role",
    selectRole: locale === "ar" ? "اختر الدور" : "Select role",

    // Role options
    platformAdmin: locale === "ar" ? "مدير المنصة" : "Platform Admin",
    platformAdminDesc:
      locale === "ar"
        ? "وصول كامل لجميع ميزات المنصة"
        : "Full access to all platform features",
    salesRep: locale === "ar" ? "مندوب مبيعات" : "Sales Rep",
    salesRepDesc:
      locale === "ar"
        ? "إدارة الصفقات والعملاء"
        : "Manage deals and clients",
    supportRep: locale === "ar" ? "مندوب دعم" : "Support Rep",
    supportRepDesc:
      locale === "ar"
        ? "إدارة تذاكر الدعم"
        : "Manage support tickets",

    // Buttons
    submit:
      mode === "create"
        ? locale === "ar"
          ? "إنشاء المستخدم"
          : "Create User"
        : locale === "ar"
          ? "حفظ التغييرات"
          : "Save Changes",
    submitting: locale === "ar" ? "جاري الحفظ..." : "Saving...",
  };

  const roleOptions: { value: PlatformUserRole; label: string; description: string }[] = [
    { value: "PLATFORM_ADMIN", label: texts.platformAdmin, description: texts.platformAdminDesc },
    { value: "SALES_REP", label: texts.salesRep, description: texts.salesRepDesc },
    { value: "SUPPORT_REP", label: texts.supportRep, description: texts.supportRepDesc },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>{texts.accountSection}</CardTitle>
          </div>
          <CardDescription>{texts.accountSectionDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              {texts.email} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={texts.emailPlaceholder}
              disabled={mode === "edit"}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {texts.password}{" "}
                {mode === "create" && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={texts.passwordPlaceholder}
                {...register("password")}
              />
              {mode === "edit" && (
                <p className="text-xs text-muted-foreground">
                  {texts.passwordHintEdit}
                </p>
              )}
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{texts.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={texts.confirmPasswordPlaceholder}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>{texts.profileSection}</CardTitle>
          </div>
          <CardDescription>{texts.profileSectionDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayNameEn">
                {texts.displayNameEn} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayNameEn"
                placeholder={texts.displayNameEnPlaceholder}
                {...register("displayNameEn")}
              />
              {errors.displayNameEn && (
                <p className="text-sm text-destructive">
                  {errors.displayNameEn.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayNameAr">{texts.displayNameAr}</Label>
              <Input
                id="displayNameAr"
                placeholder={texts.displayNameArPlaceholder}
                dir="rtl"
                {...register("displayNameAr")}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">{texts.phoneNumber}</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                id="phoneNumber"
                placeholder={texts.phoneNumberPlaceholder}
                {...register("phoneNumber")}
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>{texts.roleSection}</CardTitle>
          </div>
          <CardDescription>{texts.roleSectionDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">
              {texts.role} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watchRole}
              onValueChange={(value) => setValue("role", value as PlatformUserRole)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder={texts.selectRole} />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-muted-foreground text-sm ms-2">
                        - {opt.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Role description cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {roleOptions.map((opt) => (
              <div
                key={opt.value}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  watchRole === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/50"
                }`}
              >
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {opt.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? texts.submitting : texts.submit}
        </Button>
      </div>
    </form>
  );
}
