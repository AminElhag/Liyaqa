"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/lib/utils";
import { ADDONS, SECTION_TEXTS } from "./pricing-data";

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
    transition: { duration: 0.4 },
  },
};

export function AddonsSection() {
  const locale = useLocale();
  const t = (obj: { en: string; ar: string }) => (locale === "ar" ? obj.ar : obj.en);
  const texts = SECTION_TEXTS.addons;

  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm">
            {t(texts.badge)}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{t(texts.title)}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t(texts.subtitle)}
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto"
        >
          {ADDONS.map((addon) => (
            <motion.div
              key={addon.name.en}
              variants={itemVariants}
              className={cn(
                "rounded-2xl border border-dashed bg-card p-6 text-center",
                "hover:shadow-md transition-shadow"
              )}
            >
              <div className="text-2xl font-extrabold mb-0.5">{t(addon.price)}</div>
              <div className="text-xs text-muted-foreground mb-4">
                {t(addon.priceSub)}
              </div>
              <h3 className="text-sm font-bold mb-1">{t(addon.name)}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(addon.description)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
