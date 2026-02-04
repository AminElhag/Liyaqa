"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Shield, FileCheck, Languages, ArrowRight } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/utils";

const content = {
  en: {
    badge: "Built for Saudi Arabia",
    headline: "The Gym Management Platform",
    headlineHighlight: "Made for Saudi Gyms",
    subheadline: "From STC Pay to ZATCA compliance, prayer time scheduling to Arabic-first design. Everything your Saudi gym needs to thrive.",
    ctaPrimary: "Start Free Trial",
    ctaSecondary: "Book a Demo",
    trustItems: [
      { icon: Shield, label: "Bank-Grade Security" },
      { icon: FileCheck, label: "ZATCA Compliant" },
      { icon: Languages, label: "Arabic Support" },
    ],
  },
  ar: {
    badge: "صُمم للمملكة العربية السعودية",
    headline: "منصة إدارة الصالات الرياضية",
    headlineHighlight: "المصممة للصالات السعودية",
    subheadline: "من STC Pay إلى الامتثال لهيئة الزكاة والضريبة، ومن أوقات الصلاة إلى التصميم العربي الأصيل. كل ما تحتاجه صالتك الرياضية للنجاح.",
    ctaPrimary: "ابدأ تجربة مجانية",
    ctaSecondary: "احجز عرضاً توضيحياً",
    trustItems: [
      { icon: Shield, label: "أمان بمستوى البنوك" },
      { icon: FileCheck, label: "متوافق مع فاتورة" },
      { icon: Languages, label: "دعم اللغة العربية" },
    ],
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

export function HeroSection() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const texts = content[locale as keyof typeof content] || content.en;

  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 dark:from-primary/10 dark:to-primary/5" />

      {/* Decorative circles */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className={cn(
          "grid gap-12 lg:grid-cols-2 lg:gap-16 items-center",
          isRtl && "lg:grid-flow-dense"
        )}>
          {/* Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn("text-center lg:text-start", isRtl && "lg:col-start-2 lg:text-end")}
          >
            <motion.div variants={itemVariants}>
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
                {texts.badge}
              </Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6"
            >
              {texts.headline}{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {texts.headlineHighlight}
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
            >
              {texts.subheadline}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className={cn(
                "flex flex-col sm:flex-row gap-4 justify-center lg:justify-start",
                isRtl && "lg:justify-end"
              )}
            >
              <Link href={`/${locale}/signup`}>
                <Button size="lg" className="w-full sm:w-auto">
                  {texts.ctaPrimary}
                  <ArrowRight className={cn("h-4 w-4 ms-2", isRtl && "rotate-180")} />
                </Button>
              </Link>
              <Link href={`/${locale}/demo`}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {texts.ctaSecondary}
                </Button>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={itemVariants}
              className={cn(
                "flex flex-wrap gap-6 mt-10 justify-center lg:justify-start",
                isRtl && "lg:justify-end"
              )}
            >
              {texts.trustItems.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 text-sm text-muted-foreground",
                    isRtl && "flex-row-reverse"
                  )}
                >
                  <item.icon className="h-4 w-4 text-primary" />
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            variants={floatVariants}
            initial="initial"
            animate="animate"
            className={cn("relative", isRtl && "lg:col-start-1")}
          >
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              {/* Main dashboard card */}
              <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground text-center">
                      dashboard.liyaqa.com
                    </div>
                  </div>
                </div>

                {/* Dashboard content preview */}
                <div className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: isRtl ? "الأعضاء" : "Members", value: "2,847" },
                      { label: isRtl ? "الإيرادات" : "Revenue", value: "SAR 125K" },
                      { label: isRtl ? "الحضور" : "Check-ins", value: "412" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-background rounded-lg p-3 border shadow-sm">
                        <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                        <div className="text-lg font-bold text-primary">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart placeholder */}
                  <div className="bg-background rounded-lg p-4 border shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm font-medium">
                        {isRtl ? "الإيرادات الشهرية" : "Monthly Revenue"}
                      </div>
                      <div className="text-xs text-green-600 font-medium">+12.5%</div>
                    </div>
                    <div className="h-24 flex items-end gap-1">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-primary/60 to-primary rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className={cn(
                  "absolute -bottom-4 -left-4 bg-card rounded-xl shadow-lg border p-4 max-w-[200px]",
                  isRtl && "-right-4 left-auto"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {isRtl ? "دفع ناجح" : "Payment Success"}
                    </div>
                    <div className="text-xs text-muted-foreground">SAR 599</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
