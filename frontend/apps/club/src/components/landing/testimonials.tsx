"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { cn } from "@liyaqa/shared/utils";

interface Testimonial {
  id: number;
  quote: string;
  quoteAr: string;
  author: string;
  authorAr: string;
  title: string;
  titleAr: string;
  gym: string;
  gymAr: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "Liyaqa transformed how we manage our gym. The ZATCA compliance feature alone saved us countless hours. Our members love the Arabic-first mobile app.",
    quoteAr: "لياقة غيرت طريقة إدارتنا للصالة. ميزة الامتثال لفاتورة وحدها وفرت علينا ساعات لا حصر لها. أعضاؤنا يحبون التطبيق العربي.",
    author: "Ahmed Al-Rashid",
    authorAr: "أحمد الراشد",
    title: "Owner",
    titleAr: "المالك",
    gym: "FitZone Riyadh",
    gymAr: "فت زون الرياض",
    rating: 5,
    avatar: "AR",
  },
  {
    id: 2,
    quote: "The STC Pay integration was seamless. Our members can now pay with their preferred method, and we've seen a 40% increase in on-time payments.",
    quoteAr: "تكامل STC Pay كان سلساً. أعضاؤنا يمكنهم الآن الدفع بطريقتهم المفضلة، ورأينا زيادة 40% في الدفعات في وقتها.",
    author: "Fatima Al-Saud",
    authorAr: "فاطمة آل سعود",
    title: "General Manager",
    titleAr: "المدير العام",
    gym: "Ladies Fitness Club",
    gymAr: "نادي لياقة السيدات",
    rating: 5,
    avatar: "FS",
  },
  {
    id: 3,
    quote: "Prayer time scheduling changed everything. Our classes automatically adjust around prayer times, and attendance has never been better.",
    quoteAr: "جدولة أوقات الصلاة غيرت كل شيء. صفوفنا تتعدل تلقائياً حول أوقات الصلاة، والحضور لم يكن أفضل من أي وقت مضى.",
    author: "Mohammed Al-Qahtani",
    authorAr: "محمد القحطاني",
    title: "Operations Director",
    titleAr: "مدير العمليات",
    gym: "CrossFit Jeddah",
    gymAr: "كروس فت جدة",
    rating: 5,
    avatar: "MQ",
  },
  {
    id: 4,
    quote: "We expanded from 1 to 5 locations using Liyaqa. The multi-branch management and reporting tools are exceptional. Best investment we've made.",
    quoteAr: "توسعنا من موقع واحد إلى 5 مواقع باستخدام لياقة. أدوات إدارة الفروع المتعددة والتقارير استثنائية. أفضل استثمار قمنا به.",
    author: "Khalid Al-Harbi",
    authorAr: "خالد الحربي",
    title: "CEO",
    titleAr: "الرئيس التنفيذي",
    gym: "Iron House Gyms",
    gymAr: "صالات آيرون هاوس",
    rating: 5,
    avatar: "KH",
  },
];

const content = {
  en: {
    heading: "What Our Customers Say",
    subheading: "Hear from gym owners across Saudi Arabia who trust Liyaqa to power their business",
  },
  ar: {
    heading: "ماذا يقول عملاؤنا",
    subheading: "استمع إلى أصحاب الصالات الرياضية في المملكة العربية السعودية الذين يثقون بلياقة لتشغيل أعمالهم",
  },
};

export function Testimonials() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const texts = content[locale as keyof typeof content] || content.en;
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  // Auto-play
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [isPaused, next]);

  const getVisibleTestimonials = () => {
    const result = [];
    for (let i = 0; i < 3; i++) {
      result.push(testimonials[(current + i) % testimonials.length]);
    }
    return result;
  };

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
          <p className="text-muted-foreground max-w-2xl mx-auto">{texts.subheading}</p>
        </motion.div>

        {/* Testimonials carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Desktop: Show 3 cards */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {getVisibleTestimonials().map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <TestimonialCard testimonial={testimonial} locale={locale} isRtl={isRtl} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Mobile: Show 1 card */}
          <div className="lg:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonials[current].id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <TestimonialCard
                  testimonial={testimonials[current]}
                  locale={locale}
                  isRtl={isRtl}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className={cn(
            "flex items-center justify-center gap-4 mt-8",
            isRtl && "flex-row-reverse"
          )}>
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="rounded-full"
            >
              <ChevronLeft className={cn("h-4 w-4", isRtl && "rotate-180")} />
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    index === current
                      ? "bg-primary w-6"
                      : "bg-primary/30 hover:bg-primary/50"
                  )}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="rounded-full"
            >
              <ChevronRight className={cn("h-4 w-4", isRtl && "rotate-180")} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  locale: string;
  isRtl: boolean;
}

function TestimonialCard({ testimonial, locale, isRtl }: TestimonialCardProps) {
  const quote = locale === "ar" ? testimonial.quoteAr : testimonial.quote;
  const author = locale === "ar" ? testimonial.authorAr : testimonial.author;
  const title = locale === "ar" ? testimonial.titleAr : testimonial.title;
  const gym = locale === "ar" ? testimonial.gymAr : testimonial.gym;

  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm h-full flex flex-col">
      <Quote className="h-8 w-8 text-primary/30 mb-4" />

      {/* Rating */}
      <div className={cn("flex gap-1 mb-4", isRtl && "flex-row-reverse justify-end")}>
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      {/* Quote */}
      <p className={cn("text-muted-foreground flex-1 mb-6", isRtl && "text-end")}>
        &ldquo;{quote}&rdquo;
      </p>

      {/* Author */}
      <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {testimonial.avatar}
        </div>
        <div className={isRtl ? "text-end" : ""}>
          <div className="font-semibold">{author}</div>
          <div className="text-sm text-muted-foreground">
            {title}, {gym}
          </div>
        </div>
      </div>
    </div>
  );
}
