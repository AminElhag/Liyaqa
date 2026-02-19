"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { UserPlus, Settings, Rocket } from "lucide-react";
import { cn } from "@liyaqa/shared/lib/utils";

interface Step {
  icon: React.ElementType;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

const steps: Step[] = [
  {
    icon: UserPlus,
    titleEn: "Contact Us",
    titleAr: "تواصل معنا",
    descriptionEn: "Reach out to our team and tell us about your gym. We'll respond within 24 hours.",
    descriptionAr: "تواصل مع فريقنا وأخبرنا عن صالتك الرياضية. سنرد خلال 24 ساعة.",
  },
  {
    icon: Settings,
    titleEn: "Setup Your Gym",
    titleAr: "أعدّ صالتك",
    descriptionEn: "Import your members, configure plans, and set up your locations with our guided wizard.",
    descriptionAr: "استورد أعضاءك وهيئ الخطط وأعدّ مواقعك مع معالج الإعداد الموجه.",
  },
  {
    icon: Rocket,
    titleEn: "Go Live",
    titleAr: "انطلق",
    descriptionEn: "Launch your branded app, start accepting payments, and watch your gym grow.",
    descriptionAr: "أطلق تطبيقك بعلامتك التجارية وابدأ بقبول المدفوعات وشاهد صالتك تنمو.",
  },
];

const content = {
  en: {
    heading: "How It Works",
    subheading: "From first contact to launch, we'll guide you every step of the way.",
  },
  ar: {
    heading: "كيف يعمل",
    subheading: "من أول تواصل إلى الإطلاق، سنوجهك في كل خطوة على الطريق.",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
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

export function HowItWorks() {
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
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{texts.heading}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {texts.subheading}
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative"
        >
          {/* Connecting line - desktop */}
          <div className="hidden md:block absolute top-[60px] left-[16.67%] right-[16.67%] h-0.5">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className={cn(
                "h-full bg-gradient-to-r from-primary via-primary to-primary/30",
                isRtl && "origin-right"
              )}
              style={{ originX: isRtl ? 1 : 0 }}
            />
          </div>

          <div className={cn(
            "grid md:grid-cols-3 gap-8 lg:gap-12",
            isRtl && "direction-rtl"
          )}>
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative text-center"
              >
                {/* Step number & icon */}
                <div className="relative inline-flex mb-6">
                  {/* Animated ring */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.3 }}
                    className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
                    style={{ animationDuration: "3s" }}
                  />

                  {/* Icon circle */}
                  <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Step number badge */}
                  <div className={cn(
                    "absolute -top-1 h-7 w-7 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm font-bold text-primary",
                    isRtl ? "-left-1" : "-right-1"
                  )}>
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2">
                  {locale === "ar" ? step.titleAr : step.titleEn}
                </h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  {locale === "ar" ? step.descriptionAr : step.descriptionEn}
                </p>

                {/* Mobile connecting line */}
                {index < steps.length - 1 && (
                  <div className="md:hidden h-12 w-0.5 bg-gradient-to-b from-primary to-primary/30 mx-auto mt-6" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
