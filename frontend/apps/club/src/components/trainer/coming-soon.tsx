"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Construction, type LucideIcon } from "lucide-react";
import { Card } from "@liyaqa/shared/components/ui/card";
import { cn } from "@liyaqa/shared/utils";

interface ComingSoonProps {
  title: { en: string; ar: string };
  description?: { en: string; ar: string };
  icon?: LucideIcon;
}

const pageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function ComingSoon({ title, description, icon: Icon = Construction }: ComingSoonProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center justify-center min-h-[60vh]"
    >
      <Card className="max-w-md w-full p-12 text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 rounded-full bg-teal-500/10 flex items-center justify-center">
            <Icon className="h-10 w-10 text-teal-600" />
          </div>
        </div>

        <h1 className={cn("text-2xl font-bold mb-3", isRtl && "text-right")}>
          {locale === "ar" ? title.ar : title.en}
        </h1>

        {description && (
          <p className={cn("text-muted-foreground mb-6", isRtl && "text-right")}>
            {locale === "ar" ? description.ar : description.en}
          </p>
        )}

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-700 text-sm font-medium">
          <Construction className="h-4 w-4" />
          <span>{locale === "ar" ? "قيد التطوير" : "Coming Soon"}</span>
        </div>
      </Card>
    </motion.div>
  );
}
