import { useTranslation } from "react-i18next";
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
import type { PlatformUser, PlatformUserRole } from "@/types";

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
    () => {
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
  const { i18n } = useTranslation();
  const locale = i18n.language;

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
    accountSection: locale === "ar" ? "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0628" : "Account Information",
    accountSectionDesc:
      locale === "ar"
        ? "\u0628\u064A\u0627\u0646\u0627\u062A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645"
        : "Login credentials for the user",
    profileSection: locale === "ar" ? "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A" : "Profile",
    profileSectionDesc:
      locale === "ar"
        ? "\u0627\u0644\u0627\u0633\u0645 \u0648\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644"
        : "Name and contact information",
    roleSection: locale === "ar" ? "\u0627\u0644\u062F\u0648\u0631 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A" : "Role & Permissions",
    roleSectionDesc:
      locale === "ar"
        ? "\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645"
        : "User access level",

    // Fields
    email: locale === "ar" ? "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Email",
    emailPlaceholder: locale === "ar" ? "\u0623\u062F\u062E\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Enter email address",
    password: locale === "ar" ? "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Password",
    passwordPlaceholder: locale === "ar" ? "\u0623\u062F\u062E\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Enter password",
    confirmPassword: locale === "ar" ? "\u062A\u0623\u0643\u064A\u062F \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Confirm Password",
    confirmPasswordPlaceholder: locale === "ar" ? "\u0623\u0639\u062F \u0625\u062F\u062E\u0627\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Re-enter password",
    passwordHintEdit:
      locale === "ar"
        ? "\u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u0627\u064B \u0644\u0644\u0625\u0628\u0642\u0627\u0621 \u0639\u0644\u0649 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629"
        : "Leave blank to keep current password",
    displayNameEn: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 (\u0628\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629)" : "Display Name (English)",
    displayNameEnPlaceholder: locale === "ar" ? "\u0623\u062F\u062E\u0644 \u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629" : "Enter English name",
    displayNameAr: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 (\u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629)" : "Display Name (Arabic)",
    displayNameArPlaceholder: locale === "ar" ? "\u0623\u062F\u062E\u0644 \u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629" : "Enter Arabic name",
    phoneNumber: locale === "ar" ? "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641" : "Phone Number",
    phoneNumberPlaceholder: locale === "ar" ? "+966 5X XXX XXXX" : "+966 5X XXX XXXX",
    role: locale === "ar" ? "\u0627\u0644\u062F\u0648\u0631" : "Role",
    selectRole: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u062F\u0648\u0631" : "Select role",

    // Role options
    platformAdmin: locale === "ar" ? "\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0635\u0629" : "Platform Admin",
    platformAdminDesc:
      locale === "ar"
        ? "\u0648\u0635\u0648\u0644 \u0643\u0627\u0645\u0644 \u0644\u062C\u0645\u064A\u0639 \u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629"
        : "Full access to all platform features",
    salesRep: locale === "ar" ? "\u0645\u0646\u062F\u0648\u0628 \u0645\u0628\u064A\u0639\u0627\u062A" : "Sales Rep",
    salesRepDesc:
      locale === "ar"
        ? "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0635\u0641\u0642\u0627\u062A \u0648\u0627\u0644\u0639\u0645\u0644\u0627\u0621"
        : "Manage deals and clients",
    supportRep: locale === "ar" ? "\u0645\u0646\u062F\u0648\u0628 \u062F\u0639\u0645" : "Support Rep",
    supportRepDesc:
      locale === "ar"
        ? "\u0625\u062F\u0627\u0631\u0629 \u062A\u0630\u0627\u0643\u0631 \u0627\u0644\u062F\u0639\u0645"
        : "Manage support tickets",

    // Buttons
    submit:
      mode === "create"
        ? locale === "ar"
          ? "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645"
          : "Create User"
        : locale === "ar"
          ? "\u062D\u0641\u0638 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A"
          : "Save Changes",
    submitting: locale === "ar" ? "\u062C\u0627\u0631\u064A \u0627\u0644\u062D\u0641\u0638..." : "Saving...",
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
