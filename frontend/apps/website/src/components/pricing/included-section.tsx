"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  Server,
  Shield,
  CloudUpload,
  CreditCard,
  Mail,
  UserCheck,
  FileText,
  Globe,
} from "lucide-react";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/lib/utils";
import { INCLUDED_ITEMS, SECTION_TEXTS } from "./pricing-data";

const ICON_MAP: Record<string, React.ElementType> = {
  Server,
  Shield,
  CloudUpload,
  CreditCard,
  Mail,
  UserCheck,
  FileText,
  Globe,
};

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

export function IncludedSection() {
  const locale = useLocale();
  const t = (obj: { en: string; ar: string }) => (locale === "ar" ? obj.ar : obj.en);
  const texts = SECTION_TEXTS.included;

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
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{t(texts.title)}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t(texts.subtitle)}
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto"
        >
          {INCLUDED_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? Globe;
            return (
              <motion.div
                key={item.icon}
                variants={itemVariants}
                className={cn(
                  "rounded-2xl border bg-card p-6 text-center",
                  "hover:shadow-md transition-shadow"
                )}
              >
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mb-1">{t(item.title)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(item.description)}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
