"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Send, Mail, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { cn } from "@liyaqa/shared/lib/utils";

interface FormData {
  name: string;
  email: string;
  gymName: string;
  message: string;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  gymName: "",
  message: "",
};

const content = {
  en: {
    heading: "Contact Us",
    subheading: "Ready to transform your gym? Reach out and our team will get back to you within 24 hours.",
    nameLabel: "Full Name",
    namePlaceholder: "Ahmed Al-Rashid",
    emailLabel: "Email",
    emailPlaceholder: "ahmed@example.com",
    gymNameLabel: "Gym / Studio Name",
    gymNamePlaceholder: "Riyadh Strength",
    messageLabel: "Message",
    messagePlaceholder: "Tell us about your gym and what you're looking for...",
    submit: "Send Message",
    sending: "Sending...",
    successHeading: "Message Sent!",
    successMessage: "Thank you for reaching out. Our team will get back to you within 24 hours.",
    contactInfo: "Contact Information",
    emailContact: "liyaqasaas@gmail.com",
    phoneContact: "+966 50 000 0000",
  },
  ar: {
    heading: "تواصل معنا",
    subheading: "مستعد لتحويل صالتك الرياضية؟ تواصل معنا وسيرد فريقنا خلال 24 ساعة.",
    nameLabel: "الاسم الكامل",
    namePlaceholder: "أحمد الراشد",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "ahmed@example.com",
    gymNameLabel: "اسم الصالة / الاستوديو",
    gymNamePlaceholder: "قوة الرياض",
    messageLabel: "الرسالة",
    messagePlaceholder: "أخبرنا عن صالتك وما الذي تبحث عنه...",
    submit: "إرسال الرسالة",
    sending: "جاري الإرسال...",
    successHeading: "تم إرسال الرسالة!",
    successMessage: "شكراً لتواصلك معنا. سيرد فريقنا خلال 24 ساعة.",
    contactInfo: "معلومات التواصل",
    emailContact: "liyaqasaas@gmail.com",
    phoneContact: "+966 50 000 0000",
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function ContactPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const texts = content[locale as keyof typeof content] || content.en;

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Client-side only for now — no backend endpoint
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="py-16 lg:py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{texts.heading}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {texts.subheading}
            </p>
          </motion.div>

          <div className={cn(
            "grid lg:grid-cols-3 gap-10",
            isRtl && "lg:grid-flow-dense"
          )}>
            {/* Contact Form */}
            <motion.div
              variants={itemVariants}
              className={cn("lg:col-span-2", isRtl && "lg:col-start-2")}
            >
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border bg-card p-8 md:p-12 text-center"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">{texts.successHeading}</h2>
                  <p className="text-muted-foreground">{texts.successMessage}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-8 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">{texts.nameLabel}</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder={texts.namePlaceholder}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{texts.emailLabel}</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder={texts.emailPlaceholder}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gymName">{texts.gymNameLabel}</Label>
                    <Input
                      id="gymName"
                      value={formData.gymName}
                      onChange={(e) => updateField("gymName", e.target.value)}
                      placeholder={texts.gymNamePlaceholder}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{texts.messageLabel}</Label>
                    <Textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      placeholder={texts.messagePlaceholder}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {texts.sending}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        {texts.submit}
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Contact Info Sidebar */}
            <motion.div
              variants={itemVariants}
              className={cn(isRtl && "lg:col-start-1 lg:row-start-1")}
            >
              <div className="rounded-2xl border bg-card p-8 space-y-8">
                <h2 className="text-xl font-semibold">{texts.contactInfo}</h2>

                <div className="space-y-6">
                  <div className={cn("flex items-start gap-4", isRtl && "flex-row-reverse text-end")}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {isRtl ? "البريد الإلكتروني" : "Email"}
                      </p>
                      <a
                        href={`mailto:${texts.emailContact}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {texts.emailContact}
                      </a>
                    </div>
                  </div>

                  <div className={cn("flex items-start gap-4", isRtl && "flex-row-reverse text-end")}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {isRtl ? "الهاتف" : "Phone"}
                      </p>
                      <a
                        href={`tel:${texts.phoneContact.replace(/\s/g, "")}`}
                        className="text-sm font-medium"
                      >
                        {texts.phoneContact}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
