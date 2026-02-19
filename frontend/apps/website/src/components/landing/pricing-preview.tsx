"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Gift } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/lib/utils";
import { PLANS, SECTION_TEXTS } from "../pricing/pricing-data";

const content = {
  en: {
    heading: "Simple, Transparent Pricing",
    subheading: "Choose the plan that fits your gym. No hidden fees.",
    perMonth: "/mo",
    currency: "$",
    popular: "Most Popular",
    viewPricing: "View Full Pricing",
    getStarted: "Contact Us",
  },
  ar: {
    heading: "أسعار بسيطة وشفافة",
    subheading: "اختر الخطة المناسبة لصالتك. لا رسوم خفية.",
    perMonth: "/شهر",
    currency: "$",
    popular: "الأكثر شعبية",
    viewPricing: "عرض جميع الأسعار",
    getStarted: "تواصل معنا",
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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function PricingPreview() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const texts = content[locale as keyof typeof content] || content.en;

  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{texts.heading}</h2>
          <p className="text-muted-foreground text-lg">{texts.subheading}</p>
        </motion.div>

        {/* Offer banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 max-w-3xl mx-auto"
        >
          <div className="rounded-2xl bg-gradient-to-r from-[#FF6B4A] to-[#E85D3A] p-5 text-center text-white">
            <Gift className="h-5 w-5 mx-auto mb-1.5" />
            <p className="text-sm font-medium">
              {locale === "ar" ? SECTION_TEXTS.offer.ar : SECTION_TEXTS.offer.en}
            </p>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10"
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name.en}
              variants={itemVariants}
              className={cn(
                "relative rounded-2xl border p-6 text-center transition-all hover:shadow-lg",
                plan.isPopular && "border-primary shadow-md scale-105 z-10 bg-primary/5"
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary shadow-lg">
                    <Sparkles className="h-3 w-3 me-1" />
                    {texts.popular}
                  </Badge>
                </div>
              )}

              {/* Name */}
              <h3 className="text-lg font-semibold mb-4">
                {locale === "ar" ? plan.name.ar : plan.name.en}
              </h3>

              {/* Price */}
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">{texts.currency}</span>
                <span className="text-4xl font-bold mx-1">
                  {plan.monthlyPrice.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
                </span>
                <span className="text-muted-foreground">{texts.perMonth}</span>
              </div>

              {/* Target */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className={cn("flex items-center justify-center gap-2", isRtl && "flex-row-reverse")}>
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{locale === "ar" ? plan.target.ar : plan.target.en}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={cn(
            "flex flex-col sm:flex-row gap-4 justify-center",
            isRtl && "sm:flex-row-reverse"
          )}
        >
          <Link href={`/${locale}/contact`}>
            <Button size="lg" className="w-full sm:w-auto">
              {texts.getStarted}
              <ArrowRight className={cn("h-4 w-4 ms-2", isRtl && "rotate-180")} />
            </Button>
          </Link>
          <Link href={`/${locale}/pricing`}>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              {texts.viewPricing}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
