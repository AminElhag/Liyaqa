"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  UserCircle,
  CalendarDays,
  Shield,
  MonitorSmartphone,
  Users,
  Target,
  Megaphone,
  Gift,
  BarChart3,
  TrendingDown,
  DollarSign,
  Check,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface TabFeature {
  icon: React.ElementType;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

interface TabData {
  id: string;
  labelEn: string;
  labelAr: string;
  headlineEn: string;
  headlineAr: string;
  descriptionEn: string;
  descriptionAr: string;
  features: TabFeature[];
}

const tabs: TabData[] = [
  {
    id: "member",
    labelEn: "Member Experience",
    labelAr: "تجربة العضو",
    headlineEn: "Delight Your Members",
    headlineAr: "أسعد أعضاءك",
    descriptionEn: "Give your members a premium experience with a branded mobile app, self-service portal, and seamless booking.",
    descriptionAr: "امنح أعضاءك تجربة متميزة مع تطبيق جوال بعلامتك التجارية وبوابة خدمة ذاتية وحجز سلس.",
    features: [
      {
        icon: Smartphone,
        titleEn: "Branded Mobile App",
        titleAr: "تطبيق جوال بعلامتك",
        descriptionEn: "White-label iOS & Android apps with your branding",
        descriptionAr: "تطبيقات iOS و Android بعلامتك التجارية",
      },
      {
        icon: UserCircle,
        titleEn: "Member Portal",
        titleAr: "بوابة العضو",
        descriptionEn: "Self-service account management and history",
        descriptionAr: "إدارة الحساب الذاتية والسجل",
      },
      {
        icon: CalendarDays,
        titleEn: "Class Booking",
        titleAr: "حجز الصفوف",
        descriptionEn: "Easy booking with waitlists and reminders",
        descriptionAr: "حجز سهل مع قوائم الانتظار والتذكيرات",
      },
    ],
  },
  {
    id: "operations",
    labelEn: "Operations",
    labelAr: "العمليات",
    headlineEn: "Streamline Your Operations",
    headlineAr: "بسّط عملياتك",
    descriptionEn: "Automate daily tasks, manage access, and empower your staff with powerful tools.",
    descriptionAr: "أتمت المهام اليومية وأدر الوصول ومكّن موظفيك بأدوات قوية.",
    features: [
      {
        icon: Shield,
        titleEn: "Access Control",
        titleAr: "التحكم في الوصول",
        descriptionEn: "Turnstiles, QR codes, and biometric integration",
        descriptionAr: "بوابات دوارة ورموز QR وتكامل بيومتري",
      },
      {
        icon: MonitorSmartphone,
        titleEn: "Self-Service Kiosk",
        titleAr: "كشك الخدمة الذاتية",
        descriptionEn: "Check-ins, payments, and member registration",
        descriptionAr: "تسجيل الدخول والمدفوعات وتسجيل الأعضاء",
      },
      {
        icon: Users,
        titleEn: "Staff Management",
        titleAr: "إدارة الموظفين",
        descriptionEn: "Scheduling, permissions, and performance tracking",
        descriptionAr: "الجدولة والصلاحيات وتتبع الأداء",
      },
    ],
  },
  {
    id: "sales",
    labelEn: "Sales & Marketing",
    labelAr: "المبيعات والتسويق",
    headlineEn: "Grow Your Business",
    headlineAr: "نمِّ أعمالك",
    descriptionEn: "Convert leads, retain members, and run targeted campaigns to grow your gym.",
    descriptionAr: "حوّل العملاء المحتملين واحتفظ بالأعضاء ونفّذ حملات مستهدفة لتنمية صالتك.",
    features: [
      {
        icon: Target,
        titleEn: "CRM & Lead Management",
        titleAr: "إدارة العملاء المحتملين",
        descriptionEn: "Track leads from inquiry to membership",
        descriptionAr: "تتبع العملاء المحتملين من الاستفسار إلى العضوية",
      },
      {
        icon: Megaphone,
        titleEn: "Marketing Campaigns",
        titleAr: "الحملات التسويقية",
        descriptionEn: "Email, SMS, and WhatsApp automation",
        descriptionAr: "أتمتة البريد الإلكتروني والرسائل النصية وواتساب",
      },
      {
        icon: Gift,
        titleEn: "Referral Program",
        titleAr: "برنامج الإحالة",
        descriptionEn: "Reward members for bringing friends",
        descriptionAr: "كافئ الأعضاء لجلب الأصدقاء",
      },
    ],
  },
  {
    id: "analytics",
    labelEn: "Analytics & AI",
    labelAr: "التحليلات والذكاء",
    headlineEn: "Make Data-Driven Decisions",
    headlineAr: "اتخذ قرارات مبنية على البيانات",
    descriptionEn: "Powerful reporting and AI-driven insights to optimize your gym performance.",
    descriptionAr: "تقارير قوية ورؤى مدفوعة بالذكاء الاصطناعي لتحسين أداء صالتك.",
    features: [
      {
        icon: BarChart3,
        titleEn: "Advanced Reporting",
        titleAr: "تقارير متقدمة",
        descriptionEn: "Customizable dashboards and scheduled reports",
        descriptionAr: "لوحات معلومات قابلة للتخصيص وتقارير مجدولة",
      },
      {
        icon: TrendingDown,
        titleEn: "Churn Prediction",
        titleAr: "توقع الإلغاء",
        descriptionEn: "AI identifies at-risk members before they leave",
        descriptionAr: "الذكاء الاصطناعي يحدد الأعضاء المعرضين للخطر قبل مغادرتهم",
      },
      {
        icon: DollarSign,
        titleEn: "Revenue Analytics",
        titleAr: "تحليلات الإيرادات",
        descriptionEn: "Track MRR, LTV, and financial health",
        descriptionAr: "تتبع الإيرادات الشهرية المتكررة وقيمة العميل مدى الحياة والصحة المالية",
      },
    ],
  },
];

const content = {
  en: {
    heading: "Everything You Need to Run Your Gym",
    subheading: "A complete platform that grows with your business—from single studio to multi-location chain.",
  },
  ar: {
    heading: "كل ما تحتاجه لإدارة صالتك",
    subheading: "منصة متكاملة تنمو مع عملك—من استوديو واحد إلى سلسلة متعددة المواقع.",
  },
};

export function PlatformFeatures() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const texts = content[locale as keyof typeof content] || content.en;
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <section className="py-20 lg:py-28 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{texts.heading}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {texts.subheading}
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="flex-wrap h-auto gap-2 p-2 bg-background border">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {locale === "ar" ? tab.labelAr : tab.labelEn}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              <AnimatePresence mode="wait">
                {activeTab === tab.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "grid lg:grid-cols-2 gap-8 lg:gap-12 items-center",
                      isRtl && "lg:grid-flow-dense"
                    )}
                  >
                    {/* Content */}
                    <div className={cn(isRtl && "lg:col-start-2")}>
                      <h3 className={cn(
                        "text-2xl md:text-3xl font-bold mb-4",
                        isRtl && "text-end"
                      )}>
                        {locale === "ar" ? tab.headlineAr : tab.headlineEn}
                      </h3>
                      <p className={cn(
                        "text-muted-foreground mb-8",
                        isRtl && "text-end"
                      )}>
                        {locale === "ar" ? tab.descriptionAr : tab.descriptionEn}
                      </p>

                      {/* Features list */}
                      <div className="space-y-4">
                        {tab.features.map((feature, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                              "flex gap-4 p-4 rounded-xl bg-background border hover:border-primary/30 transition-colors",
                              isRtl && "flex-row-reverse"
                            )}
                          >
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                              <feature.icon className="h-5 w-5" />
                            </div>
                            <div className={isRtl ? "text-end" : ""}>
                              <div className="font-semibold mb-1">
                                {locale === "ar" ? feature.titleAr : feature.titleEn}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {locale === "ar" ? feature.descriptionAr : feature.descriptionEn}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Screenshot placeholder */}
                    <div className={cn(isRtl && "lg:col-start-1 lg:row-start-1")}>
                      <div className="relative">
                        <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
                          {/* Browser chrome */}
                          <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b">
                            <div className="flex gap-1.5">
                              <div className="h-3 w-3 rounded-full bg-red-400" />
                              <div className="h-3 w-3 rounded-full bg-yellow-400" />
                              <div className="h-3 w-3 rounded-full bg-green-400" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 min-h-[300px] flex items-center justify-center">
                            <div className="text-center">
                              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                {tab.features[0] && (() => {
                                  const Icon = tab.features[0].icon;
                                  return <Icon className="h-8 w-8 text-primary" />;
                                })()}
                              </div>
                              <div className="text-lg font-semibold mb-2">
                                {locale === "ar" ? tab.labelAr : tab.labelEn}
                              </div>
                              <div className="flex flex-wrap gap-2 justify-center">
                                {tab.features.map((f, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                                  >
                                    <Check className="h-3 w-3" />
                                    {locale === "ar" ? f.titleAr : f.titleEn}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
