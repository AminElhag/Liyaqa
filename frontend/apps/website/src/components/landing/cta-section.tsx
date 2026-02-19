"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { cn } from "@liyaqa/shared/lib/utils";

const content = {
  en: {
    headline: "Ready to Transform Your Gym?",
    subheadline: "Join hundreds of Saudi fitness businesses already using Liyaqa to grow their membership and streamline operations.",
    ctaPrimary: "Contact Us",
    ctaSecondary: "Talk to Sales",
    guarantee: "Setup in minutes. No long-term contracts.",
  },
  ar: {
    headline: "مستعد لتحويل صالتك الرياضية؟",
    subheadline: "انضم إلى مئات الشركات السعودية في مجال اللياقة البدنية التي تستخدم لياقة بالفعل لتنمية عضويتها وتبسيط عملياتها.",
    ctaPrimary: "تواصل معنا",
    ctaSecondary: "تحدث مع المبيعات",
    guarantee: "الإعداد في دقائق. لا عقود طويلة الأمد.",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function CtaSection() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const texts = content[locale as keyof typeof content] || content.en;

  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/90 p-8 md:p-12 lg:p-16 text-center"
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <motion.div variants={itemVariants} className="mb-4">
              <Sparkles className="h-10 w-10 text-white/80 mx-auto" />
            </motion.div>

            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
            >
              {texts.headline}
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-lg text-white/80 mb-10 max-w-2xl mx-auto"
            >
              {texts.subheadline}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className={cn(
                "flex flex-col sm:flex-row gap-4 justify-center",
                isRtl && "sm:flex-row-reverse"
              )}
            >
              <Link href={`/${locale}/contact`}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-primary hover:bg-white/90"
                >
                  {texts.ctaPrimary}
                  <ArrowRight className={cn("h-4 w-4 ms-2", isRtl && "rotate-180")} />
                </Button>
              </Link>
              <Link href={`/${locale}/contact`}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto border-2 border-white bg-transparent text-white hover:bg-white/20"
                >
                  {texts.ctaSecondary}
                </Button>
              </Link>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-sm text-white/60"
            >
              {texts.guarantee}
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
