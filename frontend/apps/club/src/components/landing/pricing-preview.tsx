"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { cn } from "@liyaqa/shared/utils";
import { usePublicPlans } from "@liyaqa/shared/queries/use-public-plans";
import type { PublicClientPlan } from "@liyaqa/shared/types/public-plans";

const content = {
  en: {
    heading: "Simple, Transparent Pricing",
    subheading: "Start free for 14 days. No credit card required.",
    perMonth: "/mo",
    currency: "SAR",
    popular: "Most Popular",
    viewPricing: "View Full Pricing",
    startTrial: "Start Free Trial",
    upTo: "Up to",
    members: "members",
    locations: "location",
    locationsPlural: "locations",
    unlimited: "Unlimited",
    noPlansCta: "Contact us for pricing",
  },
  ar: {
    heading: "أسعار بسيطة وشفافة",
    subheading: "ابدأ مجاناً لمدة 14 يوماً. لا حاجة لبطاقة ائتمان.",
    perMonth: "/شهر",
    currency: "ر.س",
    popular: "الأكثر شعبية",
    viewPricing: "عرض جميع الأسعار",
    startTrial: "ابدأ تجربة مجانية",
    upTo: "حتى",
    members: "عضو",
    locations: "موقع",
    locationsPlural: "مواقع",
    unlimited: "غير محدود",
    noPlansCta: "تواصل معنا للأسعار",
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

function PricingCardSkeleton() {
  return (
    <div className="rounded-2xl border p-6 text-center">
      <Skeleton className="h-6 w-24 mx-auto mb-4" />
      <Skeleton className="h-10 w-32 mx-auto mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 mx-auto" />
        <Skeleton className="h-4 w-20 mx-auto" />
      </div>
    </div>
  );
}

function formatMembers(plan: PublicClientPlan, locale: string, texts: typeof content.en) {
  const isUnlimited = plan.maxMembers >= 999999;
  if (isUnlimited) {
    return `${texts.unlimited} ${texts.members}`;
  }
  return `${texts.upTo} ${plan.maxMembers.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")} ${texts.members}`;
}

function formatLocations(plan: PublicClientPlan, locale: string, texts: typeof content.en) {
  const isUnlimited = plan.maxLocationsPerClub >= 999 || plan.maxClubs >= 999;
  if (isUnlimited) {
    return `${texts.unlimited} ${texts.locationsPlural}`;
  }
  const total = plan.maxLocationsPerClub * plan.maxClubs;
  return `${total} ${total === 1 ? texts.locations : texts.locationsPlural}`;
}

export function PricingPreview() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const texts = content[locale as keyof typeof content] || content.en;

  const { data: plans, isLoading, error } = usePublicPlans();

  // Determine which plan is "popular" - default to middle plan
  const getIsPopular = (index: number, total: number) => {
    if (total <= 1) return false;
    if (total === 2) return index === 1;
    return index === Math.floor(total / 2);
  };

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

        {/* Loading state */}
        {isLoading && (
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            <PricingCardSkeleton />
            <PricingCardSkeleton />
            <PricingCardSkeleton />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {locale === "ar" ? "تعذر تحميل الأسعار" : "Unable to load pricing"}
            </p>
            <Link href={`/${locale}/signup`}>
              <Button>{texts.noPlansCta}</Button>
            </Link>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && plans?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {locale === "ar" ? "لا توجد خطط متاحة حالياً" : "No pricing plans available"}
            </p>
            <Link href={`/${locale}/signup`}>
              <Button>{texts.noPlansCta}</Button>
            </Link>
          </div>
        )}

        {/* Pricing cards */}
        {!isLoading && !error && plans && plans.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10"
          >
            {plans.slice(0, 3).map((plan, index) => {
              const isPopular = getIsPopular(index, Math.min(plans.length, 3));
              return (
                <motion.div
                  key={plan.id}
                  variants={itemVariants}
                  className={cn(
                    "relative rounded-2xl border p-6 text-center transition-all hover:shadow-lg",
                    isPopular && "border-primary shadow-md scale-105 z-10 bg-primary/5"
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary shadow-lg">
                        <Sparkles className="h-3 w-3 me-1" />
                        {texts.popular}
                      </Badge>
                    </div>
                  )}

                  {/* Name */}
                  <h3 className="text-lg font-semibold mb-4">
                    {locale === "ar" ? (plan.name.ar || plan.name.en) : plan.name.en}
                  </h3>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-sm text-muted-foreground">{texts.currency}</span>
                    <span className="text-4xl font-bold mx-1">
                      {Math.round(plan.monthlyPrice.amount).toLocaleString(
                        locale === "ar" ? "ar-SA" : "en-US"
                      )}
                    </span>
                    <span className="text-muted-foreground">{texts.perMonth}</span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className={cn("flex items-center justify-center gap-2", isRtl && "flex-row-reverse")}>
                      <Check className="h-4 w-4 text-primary" />
                      <span>{formatMembers(plan, locale, texts)}</span>
                    </div>
                    <div className={cn("flex items-center justify-center gap-2", isRtl && "flex-row-reverse")}>
                      <Check className="h-4 w-4 text-primary" />
                      <span>{formatLocations(plan, locale, texts)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

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
          <Link href={`/${locale}/signup`}>
            <Button size="lg" className="w-full sm:w-auto">
              {texts.startTrial}
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
