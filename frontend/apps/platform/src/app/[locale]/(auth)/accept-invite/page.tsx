"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { cn } from "@liyaqa/shared/utils";
import { acceptInvite } from "@liyaqa/shared/lib/api/platform/team-auth";

export default function AcceptInvitePage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayNameEn, setDisplayNameEn] = useState("");
  const [displayNameAr, setDisplayNameAr] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const texts = {
    title: isRtl ? "قبول الدعوة" : "Accept Invitation",
    subtitle: isRtl ? "أنشئ حسابك للانضمام إلى المنصة" : "Create your account to join the platform",
    password: isRtl ? "كلمة المرور" : "Password",
    confirmPassword: isRtl ? "تأكيد كلمة المرور" : "Confirm Password",
    displayNameEn: isRtl ? "الاسم (إنجليزي)" : "Display Name (English)",
    displayNameAr: isRtl ? "الاسم (عربي)" : "Display Name (Arabic)",
    submit: isRtl ? "قبول الدعوة" : "Accept Invitation",
    submitting: isRtl ? "جاري الإرسال..." : "Submitting...",
    success: isRtl ? "تم قبول الدعوة بنجاح! يمكنك تسجيل الدخول الآن." : "Invitation accepted! You can now log in.",
    goToLogin: isRtl ? "الذهاب لتسجيل الدخول" : "Go to Login",
    passwordMismatch: isRtl ? "كلمات المرور غير متطابقة" : "Passwords do not match",
    passwordTooShort: isRtl ? "كلمة المرور قصيرة جداً (8 أحرف على الأقل)" : "Password too short (min 8 characters)",
    invalidToken: isRtl ? "رابط الدعوة غير صالح" : "Invalid invitation link",
    failed: isRtl ? "فشل قبول الدعوة" : "Failed to accept invitation",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(texts.invalidToken);
      return;
    }
    if (password.length < 8) {
      setError(texts.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(texts.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await acceptInvite({
        token,
        password,
        displayNameEn: displayNameEn || undefined,
        displayNameAr: displayNameAr || undefined,
      });
      setSuccess(true);
    } catch {
      setError(texts.failed);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <UserPlus className="h-12 w-12 mx-auto text-green-500" />
            <p className="text-green-600 font-medium">{texts.success}</p>
            <Button onClick={() => router.push(`/${locale}/login`)}>
              {texts.goToLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-10 w-10 mx-auto mb-2 text-primary" />
          <CardTitle>{texts.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{texts.subtitle}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{texts.displayNameEn}</label>
              <Input
                value={displayNameEn}
                onChange={(e) => setDisplayNameEn(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{texts.displayNameAr}</label>
              <Input
                value={displayNameAr}
                onChange={(e) => setDisplayNameAr(e.target.value)}
                placeholder="جون دو"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{texts.password}</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{texts.confirmPassword}</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? texts.submitting : texts.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
