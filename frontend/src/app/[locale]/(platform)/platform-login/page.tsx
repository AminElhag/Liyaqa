"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const platformLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type PlatformLoginFormData = z.infer<typeof platformLoginSchema>;

export default function PlatformLoginPage() {
  const t = useTranslations("platform.auth");
  const locale = useLocale();
  const router = useRouter();
  const { platformLogin, isLoading, error, clearError, isAuthenticated, isPlatformUser } =
    useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Animation mount effect
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated as platform user
  React.useEffect(() => {
    if (isAuthenticated && isPlatformUser()) {
      router.push(`/${locale}/platform-dashboard`);
    }
  }, [isAuthenticated, isPlatformUser, router, locale]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlatformLoginFormData>({
    resolver: zodResolver(platformLoginSchema),
  });

  const onSubmit = async (data: PlatformLoginFormData) => {
    clearError();
    try {
      await platformLogin(data);
      router.push(`/${locale}/platform-dashboard`);
    } catch {
      // Error is handled in store
    }
  };

  const texts = {
    platformAccess: locale === "ar" ? "دخول المنصة" : "Platform Access",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    emailPlaceholder: "you@liyaqa.com",
    password: locale === "ar" ? "كلمة المرور" : "Password",
    signIn: locale === "ar" ? "تسجيل الدخول" : "Sign in",
    signingIn: locale === "ar" ? "جاري الدخول..." : "Signing in...",
    errorMessage: locale === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid email or password",
    restricted: locale === "ar" ? "وصول مخصص لفريق لياقة فقط" : "Restricted to Liyaqa team members",
    secureAccess: locale === "ar" ? "اتصال آمن ومشفر" : "Secure encrypted connection",
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
                  "relative h-auto w-[320px] drop-shadow-2xl transition-all duration-1000 delay-200",
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
                  {/* Card header */}
                  <div className="text-center mb-8 lg:text-start">
                    <h2 className="text-2xl font-bold text-white">
                      {locale === "ar" ? "مرحباً بعودتك" : "Welcome back"}
                    </h2>
                    <p className="text-neutral-400 mt-1">
                      {locale === "ar" ? "سجّل دخولك للمتابعة" : "Sign in to continue"}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Error message */}
                    {error && (
                      <div className="p-4 text-sm text-red-300 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                        {texts.errorMessage}
                      </div>
                    )}

                    {/* Email field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-neutral-300 text-sm font-medium">
                        {texts.email}
                      </Label>
                      <div className="relative group">
                        <Input
                          id="email"
                          type="email"
                          placeholder={texts.emailPlaceholder}
                          autoComplete="email"
                          className={cn(
                            "h-12 bg-white/5 border-white/10 text-white placeholder:text-neutral-500",
                            "focus:bg-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                            "transition-all duration-200 rounded-xl",
                            errors.email && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                          )}
                          {...register("email")}
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-red-400">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Password field */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-neutral-300 text-sm font-medium">
                        {texts.password}
                      </Label>
                      <div className="relative group">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className={cn(
                            "h-12 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 pe-12",
                            "focus:bg-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                            "transition-all duration-200 rounded-xl",
                            errors.password && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                          )}
                          {...register("password")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-1 top-1/2 -translate-y-1/2 h-10 w-10 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-400">{errors.password.message}</p>
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
                          {texts.signingIn}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {texts.signIn}
                          <ArrowRight className="h-5 w-5 rtl:rotate-180 transition-transform group-hover:translate-x-1" />
                        </span>
                      )}
                    </Button>
                  </form>

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
