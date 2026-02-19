"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/lib/utils";
import { SECTION_TEXTS } from "./pricing-data";

interface PricingHeroProps {
  isAnnual: boolean;
  onToggle: (value: boolean) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function PricingHero({ isAnnual, onToggle }: PricingHeroProps) {
  const locale = useLocale();
  const t = (obj: { en: string; ar: string }) => (locale === "ar" ? obj.ar : obj.en);
  const texts = SECTION_TEXTS.hero;

  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.div variants={itemVariants}>
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
              {t(texts.badge)}
            </Badge>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            {t(texts.title)}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg text-muted-foreground mb-2 max-w-xl mx-auto"
          >
            {t(texts.subtitle)}
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="text-sm text-muted-foreground mb-6"
          >
            {t(texts.billingNote)}
          </motion.p>

          {/* Offer message */}
          <motion.div
            variants={itemVariants}
            className="mb-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF6B4A]/10 to-[#E85D3A]/10 px-5 py-2.5 text-sm font-medium text-[#FF6B4A]"
          >
            <Gift className="h-4 w-4 shrink-0" />
            <span>{t(SECTION_TEXTS.offer)}</span>
          </motion.div>

          {/* Billing toggle */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-4"
          >
            <span className={cn("text-sm", !isAnnual && "font-semibold")}>
              {t(texts.monthly)}
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-primary"
            />
            <span className={cn("text-sm", isAnnual && "font-semibold")}>
              {t(texts.annual)}
              <Badge variant="secondary" className="ms-2 text-xs">
                {t(texts.saveBadge)}
              </Badge>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
