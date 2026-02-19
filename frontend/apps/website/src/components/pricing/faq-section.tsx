"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { FAQ_ITEMS, SECTION_TEXTS } from "./pricing-data";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
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

export function FaqSection() {
  const locale = useLocale();
  const t = (obj: { en: string; ar: string }) => (locale === "ar" ? obj.ar : obj.en);
  const texts = SECTION_TEXTS.faq;

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
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm">
            {t(texts.badge)}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">{t(texts.title)}</h2>
        </motion.div>

        {/* FAQ grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto"
        >
          {FAQ_ITEMS.map((item) => (
            <motion.div
              key={item.question.en}
              variants={itemVariants}
              className="rounded-2xl border bg-card p-6"
            >
              <h3 className="font-bold mb-2 text-sm">{t(item.question)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(item.answer)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
