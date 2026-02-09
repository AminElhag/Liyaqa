import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { UserCog, Eye, EyeOff, Shield, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OnboardingFormValues } from "./types";

interface AdminStepProps {
  form: UseFormReturn<OnboardingFormValues>;
  locale: string;
}

export function AdminStep({ form, locale }: AdminStepProps) {
  const isRtl = locale === "ar";
  const { register, formState: { errors } } = form;
  const [showPassword, setShowPassword] = useState(false);

  const texts = {
    title: locale === "ar" ? "\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u0624\u0648\u0644" : "Admin Account",
    description:
      locale === "ar"
        ? "\u0623\u0646\u0634\u0626 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0644\u0644\u0639\u0645\u064A\u0644. \u0633\u064A\u062A\u0645\u0643\u0646 \u0645\u0646 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0646\u0627\u062F\u064A \u0628\u0627\u0644\u0643\u0627\u0645\u0644."
        : "Create the primary admin account for the client. They will have full club management access.",
    email: locale === "ar" ? "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Email Address",
    emailPlaceholder: "admin@company.com",
    password: locale === "ar" ? "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Password",
    passwordPlaceholder: locale === "ar" ? "\u0668 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" : "At least 8 characters",
    displayNameEn: locale === "ar" ? "\u0627\u0633\u0645 \u0627\u0644\u0639\u0631\u0636 (\u0625\u0646\u062C\u0644\u064A\u0632\u064A)" : "Display Name (English)",
    displayNameAr: locale === "ar" ? "\u0627\u0633\u0645 \u0627\u0644\u0639\u0631\u0636 (\u0639\u0631\u0628\u064A)" : "Display Name (Arabic)",
    displayNamePlaceholderEn: "John Smith",
    displayNamePlaceholderAr: "\u0623\u062D\u0645\u062F \u0645\u062D\u0645\u062F",
    securityNote: locale === "ar"
      ? "\u0633\u064A\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0628\u0631\u064A\u062F \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A. \u062A\u0623\u0643\u062F \u0645\u0646 \u0635\u062D\u0629 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A."
      : "Login credentials will be sent to the admin's email. Make sure the email is correct.",
    permissionsNote: locale === "ar"
      ? "\u0633\u064A\u062D\u0635\u0644 \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0639\u0644\u0649 \u0635\u0644\u0627\u062D\u064A\u0627\u062A CLUB_ADMIN \u0627\u0644\u0643\u0627\u0645\u0644\u0629."
      : "This user will be granted full CLUB_ADMIN permissions.",
  };

  return (
    <Card className="border-amber-500/20 dark:border-amber-500/30">
      <CardHeader className={cn(isRtl && "text-right")}>
        <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
          <div className="p-2 rounded-lg bg-amber-500/20">
            <UserCog className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-lg">{texts.title}</CardTitle>
            <CardDescription className="mt-1">{texts.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="adminEmail" className={cn(isRtl && "text-right block")}>
            {texts.email} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="adminEmail"
            type="email"
            {...register("adminEmail")}
            className={cn(errors.adminEmail && "border-destructive")}
            placeholder={texts.emailPlaceholder}
          />
          {errors.adminEmail && (
            <p className={cn("text-sm text-destructive", isRtl && "text-right")}>
              {errors.adminEmail.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="adminPassword" className={cn(isRtl && "text-right block")}>
            {texts.password} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="adminPassword"
              type={showPassword ? "text" : "password"}
              {...register("adminPassword")}
              className={cn(
                errors.adminPassword && "border-destructive",
                "pe-10"
              )}
              placeholder={texts.passwordPlaceholder}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
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
          {errors.adminPassword && (
            <p className={cn("text-sm text-destructive", isRtl && "text-right")}>
              {errors.adminPassword.message}
            </p>
          )}
        </div>

        {/* Display Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adminDisplayNameEn" className={cn(isRtl && "text-right block")}>
              {texts.displayNameEn} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="adminDisplayNameEn"
              {...register("adminDisplayNameEn")}
              className={cn(errors.adminDisplayNameEn && "border-destructive")}
              placeholder={texts.displayNamePlaceholderEn}
            />
            {errors.adminDisplayNameEn && (
              <p className={cn("text-sm text-destructive", isRtl && "text-right")}>
                {errors.adminDisplayNameEn.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminDisplayNameAr" className={cn(isRtl && "text-right block")}>
              {texts.displayNameAr}
            </Label>
            <Input
              id="adminDisplayNameAr"
              {...register("adminDisplayNameAr")}
              dir="rtl"
              placeholder={texts.displayNamePlaceholderAr}
              className="text-right"
            />
          </div>
        </div>

        {/* Info Banners */}
        <div className="space-y-3">
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900",
            isRtl && "flex-row-reverse text-right"
          )}>
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              {texts.securityNote}
            </div>
          </div>

          <div className={cn(
            "flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800",
            isRtl && "flex-row-reverse text-right"
          )}>
            <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-700 dark:text-slate-300">
              {texts.permissionsNote}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
