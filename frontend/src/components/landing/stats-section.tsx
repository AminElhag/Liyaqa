"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { cn } from "@/lib/utils";

const content = {
  en: {
    stats: [
      { value: 50000, suffix: "+", label: "Members Managed" },
      { value: 120, suffix: "+", label: "Fitness Clubs" },
      { value: 2, suffix: "M+", label: "Transactions Processed" },
      { value: 99.9, suffix: "%", label: "Uptime SLA", decimals: 1 },
    ],
  },
  ar: {
    stats: [
      { value: 50000, suffix: "+", label: "عضو تتم إدارتهم" },
      { value: 120, suffix: "+", label: "نادي لياقة بدنية" },
      { value: 2, suffix: "M+", label: "معاملة تمت معالجتها" },
      { value: 99.9, suffix: "%", label: "وقت التشغيل المضمون", decimals: 1 },
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
    transition: { duration: 0.5 },
  },
};

export function StatsSection() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const texts = content[locale as keyof typeof content] || content.en;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 bg-slate-900 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className={cn(
            "grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12",
            isRtl && "direction-rtl"
          )}
        >
          {texts.stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
                {isInView ? (
                  <>
                    <AnimatedNumber
                      value={stat.value}
                      decimals={stat.decimals || 0}
                      locale={locale === "ar" ? "ar-SA" : "en-US"}
                      stiffness={50}
                      damping={20}
                    />
                    <span>{stat.suffix}</span>
                  </>
                ) : (
                  <span>0</span>
                )}
              </div>
              <div className="text-slate-400 text-sm md:text-base">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
