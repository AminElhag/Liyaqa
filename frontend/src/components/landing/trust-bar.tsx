"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const content = {
  en: {
    heading: "Trusted by leading gyms across Saudi Arabia",
  },
  ar: {
    heading: "موثوق به من قبل الصالات الرياضية الرائدة في المملكة العربية السعودية",
  },
};

// Placeholder gym logos - in production these would be actual client logos
const logos = [
  { name: "FitZone", initials: "FZ" },
  { name: "GymNation", initials: "GN" },
  { name: "Fitness First", initials: "FF" },
  { name: "Gold's Gym", initials: "GG" },
  { name: "Fitness Time", initials: "FT" },
  { name: "Body Masters", initials: "BM" },
  { name: "NuYu", initials: "NY" },
  { name: "Leejam Sports", initials: "LS" },
];

export function TrustBar() {
  const locale = useLocale();
  const texts = content[locale as keyof typeof content] || content.en;

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...logos, ...logos];

  return (
    <section className="py-12 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm text-muted-foreground mb-8"
        >
          {texts.heading}
        </motion.p>

        {/* Logo carousel */}
        <div className="relative overflow-hidden">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10" />

          <motion.div
            animate={{
              x: [0, -50 * logos.length],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 25,
                ease: "linear",
              },
            }}
            className="flex gap-12 items-center"
          >
            {duplicatedLogos.map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className={cn(
                  "flex-shrink-0 group cursor-pointer transition-all duration-300",
                  "grayscale hover:grayscale-0 opacity-60 hover:opacity-100"
                )}
              >
                {/* Placeholder logo - in production replace with actual logo images */}
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {logo.initials}
                  </div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-foreground transition-colors whitespace-nowrap">
                    {logo.name}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
