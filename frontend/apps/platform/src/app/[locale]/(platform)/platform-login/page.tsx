"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, Globe, ArrowLeft, Mail, Clock } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { cn } from "@liyaqa/shared/utils";
import { getAccessToken, getRefreshToken } from "@liyaqa/shared/lib/api/client";

// Email step schema
const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Code verification step schema
const codeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must contain only numbers"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

type Step = "email" | "code";

export default function PlatformLoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const {
    sendPlatformLoginCode,
    verifyPlatformLoginCode,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    user,
    passwordlessEmail,
    codeExpiresAt,
    clearPasswordlessState,
  } = useAuthStore();

  const [step, setStep] = React.useState<Step>("email");
  const [mounted, setMounted] = React.useState(false);
  const [timeRemaining, setTimeRemaining] = React.useState<number>(0);

  // Animation mount effect
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated as platform user
  React.useEffect(() => {
    console.log('[Login] Navigation effect:', {
      isAuthenticated,
      isPlatformUser: user?.isPlatformUser,
      hasAccessToken: !!getAccessToken(),
      user,
    });

    // Only redirect if authenticated as platform user
    if (isAuthenticated && user?.isPlatformUser) {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get('redirect');
      const expiredParam = searchParams.get('expired');

      console.log('[Login] Redirect params:', { redirectTo, expiredParam });

      // Redirect to the intended destination or dashboard
      const destination = (redirectTo && redirectTo.startsWith(`/${locale}/`))
        ? redirectTo
        : `/${locale}/platform-dashboard`;

      console.log('[Login] Navigating to:', destination);
      router.replace(destination);
    }
  }, [isAuthenticated, user, router, locale]);

  // Countdown timer for code expiration
  React.useEffect(() => {
    if (step === "code" && codeExpiresAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((codeExpiresAt - Date.now()) / 1000));
        setTimeRemaining(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step, codeExpiresAt]);

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: passwordlessEmail || "",
    },
  });

  // Code form
  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  const onEmailSubmit = async (data: EmailFormData) => {
    clearError();
    try {
      await sendPlatformLoginCode(data.email);
      setStep("code");
      // Auto-focus on code input after step change
      setTimeout(() => {
        document.getElementById("code")?.focus();
      }, 100);
    } catch {
      // Error is handled in store
    }
  };

  const onCodeSubmit = async (data: CodeFormData) => {
    console.log('[Login] Submitting code verification...');
    clearError();
    try {
      const deviceInfo = navigator.userAgent;
      await verifyPlatformLoginCode(passwordlessEmail!, data.code, deviceInfo);
      console.log('[Login] Verification successful');
      console.log('[Login] Tokens stored:', {
        hasAccessToken: !!getAccessToken(),
        hasRefreshToken: !!getRefreshToken(),
      });

      // Small delay to ensure localStorage write completes
      // This prevents race conditions during navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('[Login] Waiting for navigation effect...');
    } catch (error) {
      console.error('[Login] Verification failed:', error);
      // Error is handled in store
    }
  };

  const handleResendCode = async () => {
    if (passwordlessEmail) {
      clearError();
      codeForm.reset();
      try {
        await sendPlatformLoginCode(passwordlessEmail);
      } catch {
        // Error is handled in store
      }
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    clearPasswordlessState();
    clearError();
    codeForm.reset();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const texts = {
    // Common
    platformAccess: locale === "ar" ? "دخول المنصة" : "Platform Access",
    secureAccess: locale === "ar" ? "اتصال آمن ومشفر" : "Secure encrypted connection",
    restricted: locale === "ar" ? "وصول مخصص لفريق لياقة فقط" : "Restricted to Liyaqa team members",

    // Email step
    welcomeBack: locale === "ar" ? "مرحباً بعودتك" : "Welcome back",
    enterEmail: locale === "ar" ? "أدخل بريدك الإلكتروني" : "Enter your email",
    emailLabel: locale === "ar" ? "البريد الإلكتروني" : "Email",
    emailPlaceholder: "you@liyaqa.com",
    continue: locale === "ar" ? "متابعة" : "Continue",
    continuing: locale === "ar" ? "جاري الإرسال..." : "Sending...",

    // Code step
    verifyCode: locale === "ar" ? "تحقق من الرمز" : "Verify Code",
    codeSent: locale === "ar" ? "تم إرسال رمز مكون من 6 أرقام إلى" : "A 6-digit code was sent to",
    codeLabel: locale === "ar" ? "رمز التحقق" : "Verification Code",
    codePlaceholder: "123456",
    verify: locale === "ar" ? "تحقق" : "Verify",
    verifying: locale === "ar" ? "جاري التحقق..." : "Verifying...",
    resendCode: locale === "ar" ? "إعادة إرسال الرمز" : "Resend code",
    goBack: locale === "ar" ? "رجوع" : "Go back",
    expiresIn: locale === "ar" ? "ينتهي خلال" : "Expires in",
    expired: locale === "ar" ? "انتهت صلاحية الرمز" : "Code expired",
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        {/* Main gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-neutral-950 to-neutral-950" />

        {/* Animated orbs */}
        <div className="absolute top-[-20%] start-[-10%] w-[500px] h-[500px] bg-primary/40 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] end-[-10%] w-[400px] h-[400px] bg-[#E85D3A]/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] end-[20%] w-[300px] h-[300px] bg-[#FF9A82]/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />

        {/* Geometric Octagon Pattern - Top Right */}
        <div className="absolute top-20 end-20 w-[300px] h-[300px] opacity-[0.03] pointer-events-none">
          <Image
            src="/assets/logo-liyaqa-icon.svg"
            alt=""
            width={300}
            height={300}
            className="animate-spin-slow"
            aria-hidden="true"
          />
        </div>

        {/* Geometric Octagon Pattern - Bottom Left */}
        <div className="absolute bottom-20 start-20 w-[250px] h-[250px] opacity-[0.02] pointer-events-none">
          <Image
            src="/assets/logo-liyaqa-icon.svg"
            alt=""
            width={250}
            height={250}
            className="animate-spin-slow rotate-45"
            aria-hidden="true"
          />
        </div>

        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Language toggle - top right */}
      <div className="absolute top-6 end-6 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const newLocale = locale === "en" ? "ar" : "en";
            const segments = window.location.pathname.split("/");
            segments[1] = newLocale;
            router.push(segments.join("/"));
          }}
          className="bg-white/5 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-full px-4 py-2 gap-2 transition-all duration-300 hover:border-white/20"
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">
            {locale === "en" ? "العربية" : "English"}
          </span>
        </Button>
      </div>

      {/* Main content - Split layout on large screens */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Hero with Logo */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div
            className={cn(
              "text-center transition-all duration-1000 ease-out",
              mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            )}
          >
            {/* New Octagon Icon */}
            <div className="mb-8 relative inline-block">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-[#E85D3A]/30 rounded-full blur-2xl animate-pulse" />
              <Image
                src="/assets/logo-liyaqa-icon.svg"
                alt="Liyaqa Icon"
                width={80}
                height={80}
                className="relative drop-shadow-2xl"
                priority
              />
            </div>

            {/* Logo with glow effect */}
            <div className="relative inline-block">
              {/* Outer glow */}
              <div className="absolute -inset-8 bg-gradient-to-r from-primary/25 via-[#E85D3A]/20 to-primary/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />

              {/* Logo */}
              <Image
                src="/assets/logo-liyaqa-white.svg"
                alt="لياقة - Liyaqa"
                width={320}
                height={120}
                className={cn(
                  "relative h-auto w-auto max-w-[320px] drop-shadow-2xl transition-all duration-1000 delay-200",
                  mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
                )}
                priority
              />
            </div>

            {/* Platform badge */}
            <div
              className={cn(
                "mt-12 transition-all duration-700 delay-500",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#E85D3A]">
                  <Image
                    src="/assets/favicon.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="brightness-0 invert"
                  />
                </div>
                <div className="text-start">
                  <p className="text-white font-semibold">{texts.platformAccess}</p>
                  <p className="text-neutral-400 text-sm">{texts.secureAccess}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
          <div
            className={cn(
              "w-full max-w-[420px] transition-all duration-700 ease-out",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-10">
              <div
                className={cn(
                  "inline-block transition-all duration-700 delay-100",
                  mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
                )}
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl" />
                  <Image
                    src="/assets/logo-liyaqa-white.svg"
                    alt="لياقة - Liyaqa"
                    width={240}
                    height={90}
                    className="relative h-auto w-[240px]"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Login card */}
            <div
              className={cn(
                "transition-all duration-700 delay-300 lg:delay-400",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <div className="relative">
                {/* Card glow */}
                <div className="absolute -inset-px bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-3xl" />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-transparent to-[#E85D3A]/30 rounded-3xl blur-xl opacity-50" />

                {/* Card */}
                <div className="relative bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                  {/* Step 1: Email Input */}
                  {step === "email" && (
                    <>
                      {/* Card header */}
                      <div className="text-center mb-8 lg:text-start">
                        <h2 className="text-2xl font-bold text-white">
                          {texts.welcomeBack}
                        </h2>
                        <p className="text-neutral-400 mt-1">
                          {texts.enterEmail}
                        </p>
                      </div>

                      <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
                        {/* Error message */}
                        {error && (
                          <div className="p-4 text-sm text-red-300 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                            {error}
                          </div>
                        )}

                        {/* Email field */}
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-neutral-300 text-sm font-medium">
                            {texts.emailLabel}
                          </Label>
                          <div className="relative group">
                            <Input
                              id="email"
                              type="email"
                              placeholder={texts.emailPlaceholder}
                              autoComplete="email"
                              autoFocus
                              className={cn(
                                "h-12 bg-white/5 border-white/10 text-white placeholder:text-neutral-500",
                                "focus:bg-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                                "transition-all duration-200 rounded-xl",
                                emailForm.formState.errors.email && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                              )}
                              {...emailForm.register("email")}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {emailForm.formState.errors.email && (
                            <p className="text-sm text-red-400">{emailForm.formState.errors.email.message}</p>
                          )}
                        </div>

                        {/* Submit button */}
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className={cn(
                            "w-full h-12 rounded-xl font-semibold text-base mt-2",
                            "bg-gradient-to-r from-primary to-[#E85D3A]",
                            "hover:from-[#FF9A82] hover:to-[#E85D3A]",
                            "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40",
                            "transition-all duration-300 hover:translate-y-[-2px]",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                          )}
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {texts.continuing}
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              {texts.continue}
                              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </>
                  )}

                  {/* Step 2: Code Verification */}
                  {step === "code" && (
                    <>
                      {/* Card header */}
                      <div className="text-center mb-8 lg:text-start">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3 justify-center lg:justify-start">
                          <Mail className="h-6 w-6 text-primary" />
                          {texts.verifyCode}
                        </h2>
                        <p className="text-neutral-400 mt-2">
                          {texts.codeSent}
                        </p>
                        <p className="text-white font-medium mt-1">
                          {passwordlessEmail}
                        </p>
                      </div>

                      <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-5">
                        {/* Error message */}
                        {error && (
                          <div className="p-4 text-sm text-red-300 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                            {error}
                          </div>
                        )}

                        {/* Code field */}
                        <div className="space-y-2">
                          <Label htmlFor="code" className="text-neutral-300 text-sm font-medium">
                            {texts.codeLabel}
                          </Label>
                          <div className="relative group">
                            <Input
                              id="code"
                              type="text"
                              inputMode="numeric"
                              pattern="\d*"
                              maxLength={6}
                              placeholder={texts.codePlaceholder}
                              autoComplete="one-time-code"
                              autoFocus
                              className={cn(
                                "h-14 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 text-center text-2xl tracking-[0.5em] font-mono",
                                "focus:bg-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                                "transition-all duration-200 rounded-xl",
                                codeForm.formState.errors.code && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                              )}
                              {...codeForm.register("code")}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {codeForm.formState.errors.code && (
                            <p className="text-sm text-red-400">{codeForm.formState.errors.code.message}</p>
                          )}
                        </div>

                        {/* Timer */}
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-neutral-400" />
                          <span className={cn(
                            "font-medium",
                            timeRemaining > 0 ? "text-neutral-400" : "text-red-400"
                          )}>
                            {timeRemaining > 0 ? (
                              <>{texts.expiresIn} {formatTime(timeRemaining)}</>
                            ) : (
                              texts.expired
                            )}
                          </span>
                        </div>

                        {/* Submit button */}
                        <Button
                          type="submit"
                          disabled={isLoading || timeRemaining === 0}
                          className={cn(
                            "w-full h-12 rounded-xl font-semibold text-base",
                            "bg-gradient-to-r from-primary to-[#E85D3A]",
                            "hover:from-[#FF9A82] hover:to-[#E85D3A]",
                            "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40",
                            "transition-all duration-300 hover:translate-y-[-2px]",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                          )}
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {texts.verifying}
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              {texts.verify}
                              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                            </span>
                          )}
                        </Button>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToEmail}
                            className="text-neutral-400 hover:text-white"
                          >
                            <ArrowLeft className="h-4 w-4 me-1 rtl:rotate-180" />
                            {texts.goBack}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleResendCode}
                            disabled={isLoading}
                            className="text-primary hover:text-primary/80"
                          >
                            {texts.resendCode}
                          </Button>
                        </div>
                      </form>
                    </>
                  )}

                  {/* Restricted access notice */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-center gap-2 text-neutral-500 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {texts.restricted}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
