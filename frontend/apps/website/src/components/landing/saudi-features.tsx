"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  Wallet,
  FileCheck,
  Moon,
  Users,
  Languages,
  MessageCircle,
} from "lucide-react";
import { cn } from "@liyaqa/shared/lib/utils";

interface Feature {
  icon: React.ElementType;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  highlighted?: boolean;
  tagEn?: string;
  tagAr?: string;
}

const features: Feature[] = [
  {
    icon: Wallet,
    titleEn: "Saudi Payment Gateways",
    titleAr: "بوابات الدفع السعودية",
    descriptionEn: "Accept STC Pay, SADAD, Tamara, and Mada. Native integration with local payment providers your members already use.",
    descriptionAr: "اقبل STC Pay وسداد وتمارا ومدى. تكامل أصلي مع مزودي الدفع المحليين الذين يستخدمهم أعضاؤك بالفعل.",
    highlighted: true,
    tagEn: "Most Popular",
    tagAr: "الأكثر شعبية",
  },
  {
    icon: FileCheck,
    titleEn: "ZATCA E-Invoicing",
    titleAr: "الفوترة الإلكترونية (فاتورة)",
    descriptionEn: "Full Phase 2 compliance with automated e-invoice generation, QR codes, and direct ZATCA integration.",
    descriptionAr: "امتثال كامل للمرحلة الثانية مع إنشاء الفواتير الإلكترونية تلقائياً ورموز QR والتكامل المباشر مع هيئة الزكاة والضريبة.",
    highlighted: true,
    tagEn: "Coming Soon",
    tagAr: "قريباً",
  },
  {
    icon: Moon,
    titleEn: "Prayer Time Integration",
    titleAr: "تكامل أوقات الصلاة",
    descriptionEn: "Automatic class scheduling around prayer times using Umm Al-Qura calendar. Never conflict with Salah again.",
    descriptionAr: "جدولة تلقائية للصفوف حول أوقات الصلاة باستخدام تقويم أم القرى. لا تتعارض مع الصلاة مرة أخرى.",
  },
  {
    icon: Users,
    titleEn: "Gender-Based Access",
    titleAr: "التحكم بالوصول حسب الجنس",
    descriptionEn: "Built-in support for ladies-only hours, separate facilities, and gender-specific scheduling requirements.",
    descriptionAr: "دعم مدمج لساعات السيدات فقط والمرافق المنفصلة ومتطلبات الجدولة الخاصة بالجنس.",
  },
  {
    icon: Languages,
    titleEn: "Arabic-First Design",
    titleAr: "تصميم عربي أولاً",
    descriptionEn: "Full RTL support, Hijri calendar integration, and native Arabic interface. Not a translation—built for Arabic.",
    descriptionAr: "دعم كامل للاتجاه من اليمين لليسار وتكامل التقويم الهجري وواجهة عربية أصلية. ليس ترجمة—مبني للعربية.",
  },
  {
    icon: MessageCircle,
    titleEn: "WhatsApp Business API",
    titleAr: "واجهة WhatsApp للأعمال",
    descriptionEn: "Send automated reminders, class notifications, and payment receipts directly via WhatsApp—the app everyone uses.",
    descriptionAr: "أرسل تذكيرات آلية وإشعارات الصفوف وإيصالات الدفع مباشرة عبر واتساب—التطبيق الذي يستخدمه الجميع.",
  },
];

const content = {
  en: {
    heading: "Built for Saudi Arabia",
    subheading: "Every feature designed specifically for the Saudi market. No workarounds, no plugins—just native support for how Saudi gyms operate.",
  },
  ar: {
    heading: "مبني للمملكة العربية السعودية",
    subheading: "كل ميزة مصممة خصيصاً للسوق السعودي. لا حلول بديلة، لا إضافات—مجرد دعم أصلي لطريقة عمل الصالات الرياضية السعودية.",
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

export function SaudiFeatures() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const texts = content[locale as keyof typeof content] || content.en;

  return (
    <section id="features" className="py-20 lg:py-28 scroll-mt-20">
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

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={cn(
                "relative group rounded-2xl border p-6 transition-all duration-300",
                "hover:shadow-lg hover:border-primary/50",
                feature.highlighted && "border-primary/30 bg-primary/5 dark:bg-primary/10"
              )}
            >
              {/* Highlight glow effect */}
              {feature.highlighted && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              )}

              <div className="relative">
                {/* Tag */}
                {feature.tagEn && (
                  <div className={cn(
                    "absolute -top-3 px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground",
                    isRtl ? "-right-2" : "-left-2"
                  )}>
                    {locale === "ar" ? feature.tagAr : feature.tagEn}
                  </div>
                )}

                {/* Icon */}
                <div className={cn(
                  "mb-4 inline-flex p-3 rounded-xl",
                  feature.highlighted
                    ? "bg-primary/20 text-primary"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  <feature.icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <h3 className={cn("text-lg font-semibold mb-2", isRtl && "text-end")}>
                  {locale === "ar" ? feature.titleAr : feature.titleEn}
                </h3>
                <p className={cn("text-muted-foreground text-sm", isRtl && "text-end")}>
                  {locale === "ar" ? feature.descriptionAr : feature.descriptionEn}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
