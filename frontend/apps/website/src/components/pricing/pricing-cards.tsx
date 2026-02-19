"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Check, Layers, Star, Briefcase } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/lib/utils";
import { PLANS, SECTION_TEXTS, type Plan } from "./pricing-data";
import { Gift } from "lucide-react";

interface PricingCardsProps {
  isAnnual: boolean;
}

const PLAN_ICONS: Record<Plan["color"], React.ElementType> = {
  green: Layers,
  amber: Star,
  purple: Briefcase,
};

const CHECK_COLORS: Record<Plan["color"], string> = {
  green: "text-green-500 bg-green-500/10",
  amber: "text-amber-500 bg-amber-500/10",
  purple: "text-purple-500 bg-purple-500/10",
};

const ICON_BG: Record<Plan["color"], string> = {
  green: "bg-green-500/10 text-green-600",
  amber: "bg-amber-500/10 text-amber-600",
  purple: "bg-purple-500/10 text-purple-600",
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

export function PricingCards({ isAnnual }: PricingCardsProps) {
  const locale = useLocale();
  const t = (obj: { en: string; ar: string }) => (locale === "ar" ? obj.ar : obj.en);
  const texts = SECTION_TEXTS.cards;

  return (
    <section className="pb-20 lg:pb-28">
      <div className="container mx-auto px-4">
        {/* Offer banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-3xl mx-auto"
        >
          <div className="rounded-2xl bg-gradient-to-r from-[#FF6B4A] to-[#E85D3A] p-6 text-center text-white">
            <Gift className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm md:text-base font-medium">
              {t(SECTION_TEXTS.offer)}
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start"
        >
          {PLANS.map((plan) => {
            const Icon = PLAN_ICONS[plan.color];
            const displayPrice = isAnnual
              ? Math.round((plan.monthlyPrice * 10) / 12)
              : plan.monthlyPrice;

            return (
              <motion.div key={plan.name.en} variants={itemVariants}>
                <Card
                  className={cn(
                    "relative flex flex-col rounded-2xl",
                    plan.isPopular && "border-primary shadow-lg md:scale-105 z-10"
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                      <Badge className="bg-primary text-primary-foreground">
                        {t(texts.mostPopular)}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "mb-4 inline-flex p-3 rounded-xl w-fit",
                        ICON_BG[plan.color]
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Name & target */}
                    <h3 className="text-xl font-bold">{t(plan.name)}</h3>
                    <p className="text-sm text-muted-foreground">{t(plan.target)}</p>
                  </CardHeader>

                  <CardContent className="flex-1">
                    {/* Price block */}
                    <div className="mb-6 pb-6 border-b">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-semibold text-muted-foreground">
                          $
                        </span>
                        <span className="text-4xl font-extrabold">
                          {displayPrice.toLocaleString("en-US")}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isAnnual ? t(texts.effectiveMonthly) : t(texts.perMonth)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        ~{plan.sarApprox.toLocaleString("en-US")} SAR
                      </div>
                      {isAnnual && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ${plan.annualPrice.toLocaleString("en-US")} {t(texts.billedAnnually)}
                        </div>
                      )}
                    </div>

                    {/* Includes note */}
                    {plan.includesNote && (
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3">
                        {t(plan.includesNote)}
                      </p>
                    )}

                    {/* Feature list */}
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground"
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px]",
                              CHECK_COLORS[plan.color]
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span>{t(feature.label)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Link
                      href={`/${locale}/contact`}
                      className="w-full"
                    >
                      <Button
                        className="w-full"
                        variant={plan.isPopular ? "default" : "outline"}
                        size="lg"
                      >
                        {plan.isEnterprise
                          ? t(texts.contactSales)
                          : t(texts.getStarted)}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Volume discount banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 max-w-3xl mx-auto"
        >
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 p-8 text-center text-white">
            <h3 className="text-xl font-bold mb-2">{t(texts.volumeTitle)}</h3>
            <p className="text-slate-300 text-sm">
              {t(texts.volumeDesc)
                .replace("{locations}", t(texts.volumeLocations))
                .replace("{discount}", t(texts.volumeDiscount))}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
