// All hardcoded bilingual pricing content extracted from the pricing proposal.
// Prices in USD, per facility, per month, excluding 15% VAT.

export interface BilingualText {
  en: string;
  ar: string;
}

// ── Plans ────────────────────────────────────────────────────────────────────

export interface PlanFeature {
  label: BilingualText;
}

export interface Plan {
  name: BilingualText;
  target: BilingualText;
  monthlyPrice: number;
  annualPrice: number; // 10x monthly = 2 months free
  usdApprox: number;
  sarApprox: number;
  features: PlanFeature[];
  includesNote?: BilingualText; // "Everything in Starter, plus:" etc.
  color: "green" | "amber" | "purple";
  ctaVariant: "outline" | "primary" | "dark";
  isPopular: boolean;
  isEnterprise: boolean;
}

export const PLANS: Plan[] = [
  {
    name: { en: "Starter", ar: "الأساسية" },
    target: {
      en: "Single-location studios & small gyms, up to 200 members",
      ar: "استوديوهات الموقع الواحد والصالات الصغيرة، حتى 200 عضو",
    },
    monthlyPrice: 99,
    annualPrice: 990,
    usdApprox: 99,
    sarApprox: 371,
    color: "green",
    ctaVariant: "outline",
    isPopular: false,
    isEnterprise: false,
    features: [
      { label: { en: "Member management (profiles, notes, attendance)", ar: "إدارة الأعضاء (الملفات، الملاحظات، الحضور)" } },
      { label: { en: "Class & appointment scheduling", ar: "جدولة الصفوف والمواعيد" } },
      { label: { en: "Online booking widget", ar: "أداة الحجز عبر الإنترنت" } },
      { label: { en: "Basic billing & invoicing (MADA, Visa/MC)", ar: "الفوترة الأساسية (مدى، فيزا/ماستركارد)" } },
      { label: { en: "Digital waivers & contracts", ar: "إعفاءات وعقود رقمية" } },
      { label: { en: "Basic reporting (attendance, revenue)", ar: "تقارير أساسية (الحضور، الإيرادات)" } },
      { label: { en: "Email notifications (transactional)", ar: "إشعارات البريد الإلكتروني" } },
      { label: { en: "Mobile app access (Liyaqa shared app)", ar: "الوصول لتطبيق الجوال (تطبيق لياقة المشترك)" } },
      { label: { en: "Arabic + English UI", ar: "واجهة عربية + إنجليزية" } },
      { label: { en: "500 SMS / month included", ar: "500 رسالة نصية / شهر" } },
      { label: { en: "Email support (business hours)", ar: "دعم بالبريد الإلكتروني (ساعات العمل)" } },
    ],
  },
  {
    name: { en: "Professional", ar: "الاحترافية" },
    target: {
      en: "Growing gyms, 200 – 1,000 members, multi-staff",
      ar: "صالات متنامية، 200 – 1,000 عضو، فرق عمل متعددة",
    },
    monthlyPrice: 249,
    annualPrice: 2490,
    usdApprox: 249,
    sarApprox: 934,
    color: "amber",
    ctaVariant: "primary",
    isPopular: true,
    isEnterprise: false,
    includesNote: {
      en: "Everything in Starter, plus:",
      ar: "كل ما في الأساسية، بالإضافة إلى:",
    },
    features: [
      { label: { en: "Lead management & CRM pipeline", ar: "إدارة العملاء المحتملين وأنبوب المبيعات" } },
      { label: { en: "Marketing automation (email campaigns)", ar: "أتمتة التسويق (حملات البريد الإلكتروني)" } },
      { label: { en: "Advanced scheduling (waitlists, recurring)", ar: "جدولة متقدمة (قوائم الانتظار، متكررة)" } },
      { label: { en: "Staff management (roles, permissions, scheduling)", ar: "إدارة الموظفين (الأدوار، الصلاحيات، الجدولة)" } },
      { label: { en: "Family & group billing", ar: "فواتير الأسرة والمجموعات" } },
      { label: { en: "Advanced analytics dashboard", ar: "لوحة تحليلات متقدمة" } },
      { label: { en: "WhatsApp booking reminders", ar: "تذكيرات الحجز عبر واتساب" } },
      { label: { en: "Inventory & POS management", ar: "إدارة المخزون ونقاط البيع" } },
      { label: { en: "Integration support (Zapier, webhooks)", ar: "دعم التكاملات (Zapier، webhooks)" } },
      { label: { en: "2,000 SMS / month included", ar: "2,000 رسالة نصية / شهر" } },
      { label: { en: "Gender-segregated facility management", ar: "إدارة المرافق المفصولة حسب الجنس" } },
      { label: { en: "Priority email + chat support", ar: "دعم أولوي بالبريد والمحادثة" } },
    ],
  },
  {
    name: { en: "Enterprise", ar: "المؤسسات" },
    target: {
      en: "Multi-location chains, 1,000+ members per location",
      ar: "سلاسل متعددة المواقع، أكثر من 1,000 عضو لكل موقع",
    },
    monthlyPrice: 459,
    annualPrice: 4590,
    usdApprox: 459,
    sarApprox: 1722,
    color: "purple",
    ctaVariant: "dark",
    isPopular: false,
    isEnterprise: true,
    includesNote: {
      en: "Everything in Professional, plus:",
      ar: "كل ما في الاحترافية، بالإضافة إلى:",
    },
    features: [
      { label: { en: "Branded white-label mobile app", ar: "تطبيق جوال بعلامتك التجارية" } },
      { label: { en: "Multi-location HQ dashboard", ar: "لوحة إدارة المقر المركزي متعددة المواقع" } },
      { label: { en: "Custom API access", ar: "وصول مخصص لواجهة برمجة التطبيقات" } },
      { label: { en: "Unlimited workflow automation", ar: "أتمتة سير العمل بلا حدود" } },
      { label: { en: "Custom report builder", ar: "منشئ تقارير مخصص" } },
      { label: { en: "Referral & loyalty programs", ar: "برامج الإحالة والولاء" } },
      { label: { en: "5,000 SMS / month included", ar: "5,000 رسالة نصية / شهر" } },
      { label: { en: "WhatsApp Business integration (full)", ar: "تكامل كامل مع واتساب للأعمال" } },
      { label: { en: "Dedicated account manager", ar: "مدير حساب مخصص" } },
      { label: { en: "Custom integrations", ar: "تكاملات مخصصة" } },
      { label: { en: "SLA guarantee (99.9% uptime)", ar: "ضمان اتفاقية مستوى الخدمة (99.9% تشغيل)" } },
    ],
  },
];

// ── Feature Comparison ───────────────────────────────────────────────────────

export type CellValue = true | false | string;

export interface ComparisonRow {
  feature: BilingualText;
  starter: CellValue;
  professional: CellValue;
  enterprise: CellValue;
}

export interface ComparisonCategory {
  name: BilingualText;
  rows: ComparisonRow[];
}

export const COMPARISON_CATEGORIES: ComparisonCategory[] = [
  {
    name: { en: "Pricing", ar: "الأسعار" },
    rows: [
      { feature: { en: "Monthly price (USD / facility)", ar: "السعر الشهري (دولار / منشأة)" }, starter: "$99", professional: "$249", enterprise: "$459" },
      { feature: { en: "Monthly price (SAR / facility)", ar: "السعر الشهري (ريال / منشأة)" }, starter: "~371 SAR", professional: "~934 SAR", enterprise: "~1,722 SAR" },
    ],
  },
  {
    name: { en: "Member Management", ar: "إدارة الأعضاء" },
    rows: [
      { feature: { en: "Member profiles, notes & attendance", ar: "ملفات الأعضاء والملاحظات والحضور" }, starter: true, professional: true, enterprise: true },
      { feature: { en: "Digital waivers & contracts", ar: "إعفاءات وعقود رقمية" }, starter: true, professional: true, enterprise: true },
      { feature: { en: "Family & group billing", ar: "فواتير الأسرة والمجموعات" }, starter: false, professional: true, enterprise: true },
      { feature: { en: "Referral & loyalty programs", ar: "برامج الإحالة والولاء" }, starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: { en: "Scheduling", ar: "الجدولة" },
    rows: [
      { feature: { en: "Class & appointment scheduling", ar: "جدولة الصفوف والمواعيد" }, starter: true, professional: true, enterprise: true },
      { feature: { en: "Online booking widget", ar: "أداة الحجز عبر الإنترنت" }, starter: true, professional: true, enterprise: true },
      { feature: { en: "Waitlists, recurring & resource management", ar: "قوائم الانتظار والتكرار وإدارة الموارد" }, starter: false, professional: true, enterprise: true },
      { feature: { en: "Gender-segregated facility management", ar: "إدارة المرافق المفصولة حسب الجنس" }, starter: false, professional: true, enterprise: true },
    ],
  },
  {
    name: { en: "Billing & Payments", ar: "الفوترة والمدفوعات" },
    rows: [
      { feature: { en: "MADA, Visa/MC via Tap Payments", ar: "مدى، فيزا/ماستركارد عبر Tap Payments" }, starter: true, professional: true, enterprise: true },
      { feature: { en: "Invoicing", ar: "الفوترة" }, starter: "Basic", professional: "Advanced", enterprise: "Advanced" },
      { feature: { en: "Inventory & POS management", ar: "إدارة المخزون ونقاط البيع" }, starter: false, professional: true, enterprise: true },
    ],
  },
  {
    name: { en: "CRM & Marketing", ar: "إدارة العملاء والتسويق" },
    rows: [
      { feature: { en: "Lead management & CRM pipeline", ar: "إدارة العملاء المحتملين وأنبوب المبيعات" }, starter: false, professional: true, enterprise: true },
      { feature: { en: "Marketing automation (email campaigns)", ar: "أتمتة التسويق (حملات البريد الإلكتروني)" }, starter: false, professional: true, enterprise: true },
    ],
  },
  {
    name: { en: "Staff Management", ar: "إدارة الموظفين" },
    rows: [
      { feature: { en: "Staff roles, permissions & scheduling", ar: "أدوار الموظفين والصلاحيات والجدولة" }, starter: false, professional: true, enterprise: true },
    ],
  },
  {
    name: { en: "Analytics & Reporting", ar: "التحليلات والتقارير" },
    rows: [
      { feature: { en: "Basic reporting (attendance, revenue)", ar: "تقارير أساسية (الحضور، الإيرادات)" }, starter: true, professional: true, enterprise: true },
      { feature: { en: "Advanced analytics dashboard", ar: "لوحة تحليلات متقدمة" }, starter: false, professional: true, enterprise: true },
      { feature: { en: "Custom report builder", ar: "منشئ تقارير مخصص" }, starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: { en: "Communications", ar: "الاتصالات" },
    rows: [
      { feature: { en: "Email notifications (transactional)", ar: "إشعارات البريد الإلكتروني" }, starter: true, professional: true, enterprise: true },
      { feature: { en: "SMS included per month", ar: "الرسائل النصية المشمولة شهرياً" }, starter: "500", professional: "2,000", enterprise: "5,000" },
      { feature: { en: "WhatsApp booking reminders", ar: "تذكيرات الحجز عبر واتساب" }, starter: false, professional: true, enterprise: true },
      { feature: { en: "WhatsApp Business integration (full)", ar: "تكامل كامل مع واتساب للأعمال" }, starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: { en: "Apps & Integrations", ar: "التطبيقات والتكاملات" },
    rows: [
      { feature: { en: "Mobile app access (Liyaqa shared app)", ar: "الوصول لتطبيق الجوال (تطبيق لياقة المشترك)" }, starter: true, professional: true, enterprise: true },
      { feature: { en: "Branded white-label mobile app", ar: "تطبيق جوال بعلامتك التجارية" }, starter: false, professional: "Add-on", enterprise: true },
      { feature: { en: "Integration support (Zapier, webhooks)", ar: "دعم التكاملات (Zapier، webhooks)" }, starter: false, professional: true, enterprise: true },
      { feature: { en: "Custom API access", ar: "وصول مخصص لواجهة برمجة التطبيقات" }, starter: false, professional: false, enterprise: true },
      { feature: { en: "Custom integrations", ar: "تكاملات مخصصة" }, starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: { en: "Platform & Operations", ar: "المنصة والعمليات" },
    rows: [
      { feature: { en: "Arabic + English UI", ar: "واجهة عربية + إنجليزية" }, starter: true, professional: true, enterprise: true },
      { feature: { en: "Multi-location HQ dashboard", ar: "لوحة إدارة المقر المركزي متعددة المواقع" }, starter: false, professional: false, enterprise: true },
      { feature: { en: "Unlimited workflow automation", ar: "أتمتة سير العمل بلا حدود" }, starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: { en: "Support", ar: "الدعم" },
    rows: [
      { feature: { en: "Email support (business hours)", ar: "دعم بالبريد الإلكتروني (ساعات العمل)" }, starter: true, professional: true, enterprise: true },
      { feature: { en: "Priority email + chat support", ar: "دعم أولوي بالبريد والمحادثة" }, starter: false, professional: true, enterprise: true },
      { feature: { en: "Dedicated account manager", ar: "مدير حساب مخصص" }, starter: false, professional: false, enterprise: true },
      { feature: { en: "SLA guarantee (99.9% uptime)", ar: "ضمان اتفاقية مستوى الخدمة (99.9% تشغيل)" }, starter: false, professional: false, enterprise: true },
      { feature: { en: "Multi-location discount (15% on 3+ locations)", ar: "خصم المواقع المتعددة (15% على 3+ مواقع)" }, starter: false, professional: false, enterprise: true },
    ],
  },
];

// ── Included Items ───────────────────────────────────────────────────────────

export interface IncludedItem {
  icon: string; // Lucide icon name
  title: BilingualText;
  description: BilingualText;
}

export const INCLUDED_ITEMS: IncludedItem[] = [
  {
    icon: "Server",
    title: { en: "Saudi Cloud Hosting", ar: "استضافة سحابية سعودية" },
    description: {
      en: "GCP Dammam data center. Your data stays in Saudi Arabia, NDMO compliant.",
      ar: "مركز بيانات GCP الدمام. بياناتك تبقى في السعودية، متوافقة مع NDMO.",
    },
  },
  {
    icon: "Shield",
    title: { en: "Security & SSL", ar: "الأمان وSSL" },
    description: {
      en: "SSL encryption, DDoS protection, and automatic security updates at no extra cost.",
      ar: "تشفير SSL، حماية DDoS، وتحديثات أمنية تلقائية بدون تكلفة إضافية.",
    },
  },
  {
    icon: "CloudUpload",
    title: { en: "Automatic Backups", ar: "نسخ احتياطي تلقائي" },
    description: {
      en: "Daily backups with disaster recovery. Your data is always safe and recoverable.",
      ar: "نسخ احتياطي يومي مع التعافي من الكوارث. بياناتك دائماً آمنة وقابلة للاسترداد.",
    },
  },
  {
    icon: "CreditCard",
    title: { en: "Payment Processing", ar: "معالجة المدفوعات" },
    description: {
      en: "MADA + Visa/Mastercard via Tap Payments. Lowest fees in Saudi Arabia.",
      ar: "مدى + فيزا/ماستركارد عبر Tap Payments. أقل رسوم في السعودية.",
    },
  },
  {
    icon: "Mail",
    title: { en: "Unlimited Emails", ar: "بريد إلكتروني غير محدود" },
    description: {
      en: "Transactional emails (confirmations, reminders, receipts) at no per-message cost.",
      ar: "رسائل بريد إلكتروني (تأكيدات، تذكيرات، إيصالات) بدون تكلفة لكل رسالة.",
    },
  },
  {
    icon: "UserCheck",
    title: { en: "Free Updates", ar: "تحديثات مجانية" },
    description: {
      en: "All software updates, new features, and improvements included automatically.",
      ar: "جميع تحديثات البرامج والميزات الجديدة والتحسينات مشمولة تلقائياً.",
    },
  },
  {
    icon: "FileText",
    title: { en: "VAT Compliant", ar: "متوافق مع ضريبة القيمة المضافة" },
    description: {
      en: "15% VAT compliant billing and invoicing built-in. ZATCA e-invoicing ready.",
      ar: "فوترة متوافقة مع ضريبة القيمة المضافة 15% مدمجة. جاهزة للفوترة الإلكترونية.",
    },
  },
  {
    icon: "Globe",
    title: { en: "Data Residency", ar: "إقامة البيانات" },
    description: {
      en: "All data stored in Saudi Arabia. Full NDMO and NCA compliance for data sovereignty.",
      ar: "جميع البيانات مخزنة في السعودية. امتثال كامل لـ NDMO وNCA لسيادة البيانات.",
    },
  },
];

// ── Add-ons ──────────────────────────────────────────────────────────────────

export interface Addon {
  price: BilingualText;
  priceSub: BilingualText;
  name: BilingualText;
  description: BilingualText;
}

export const ADDONS: Addon[] = [
  {
    price: { en: "55 SAR/mo", ar: "55 ريال/شهر" },
    priceSub: { en: "~$15 USD", ar: "~15$ دولار" },
    name: { en: "Extra SMS Bundle", ar: "حزمة رسائل نصية إضافية" },
    description: {
      en: "1,000 additional SMS messages per month via Unifonic. Saudi local delivery.",
      ar: "1,000 رسالة نصية إضافية شهرياً عبر Unifonic. تسليم محلي سعودي.",
    },
  },
  {
    price: { en: "299 SAR/mo", ar: "299 ريال/شهر" },
    priceSub: { en: "~$80 USD", ar: "~80$ دولار" },
    name: { en: "Branded Mobile App", ar: "تطبيق جوال بعلامتك التجارية" },
    description: {
      en: "Your own branded iOS & Android app. Available for Professional plan customers.",
      ar: "تطبيقك الخاص لـ iOS وAndroid بعلامتك التجارية. متاح لعملاء الخطة الاحترافية.",
    },
  },
  {
    price: { en: "Usage-based", ar: "حسب الاستخدام" },
    priceSub: { en: "billed monthly", ar: "تُحاسب شهرياً" },
    name: { en: "Extra WhatsApp Messages", ar: "رسائل واتساب إضافية" },
    description: {
      en: "Additional WhatsApp Business API messages beyond your plan's included allowance.",
      ar: "رسائل إضافية عبر واجهة واتساب للأعمال تتجاوز الحد المشمول في خطتك.",
    },
  },
];

// ── FAQ ──────────────────────────────────────────────────────────────────────

export interface FaqItem {
  question: BilingualText;
  answer: BilingualText;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: { en: "Are there any setup fees?", ar: "هل هناك رسوم إعداد؟" },
    answer: {
      en: "No setup fees. You can start using Liyaqa immediately after signing up. Our onboarding team will help you migrate your existing data at no extra cost.",
      ar: "لا توجد رسوم إعداد. يمكنك البدء باستخدام لياقة فوراً بعد التسجيل. فريق الإعداد سيساعدك في ترحيل بياناتك الحالية بدون تكلفة إضافية.",
    },
  },
  {
    question: { en: "Is there a long-term contract?", ar: "هل هناك عقد طويل الأمد؟" },
    answer: {
      en: "No long-term contracts. All plans are month-to-month. We also offer annual billing with 2 months free. You can cancel or change plans anytime.",
      ar: "لا عقود طويلة الأمد. جميع الخطط شهرية. نقدم أيضاً فوترة سنوية مع شهرين مجاناً. يمكنك الإلغاء أو تغيير الخطة في أي وقت.",
    },
  },
  {
    question: { en: "Is VAT included in the prices shown?", ar: "هل ضريبة القيمة المضافة مشمولة في الأسعار المعروضة؟" },
    answer: {
      en: "Prices shown are exclusive of 15% VAT. VAT will be added to your invoice as required by ZATCA regulations. All invoices are e-invoicing compliant.",
      ar: "الأسعار المعروضة لا تشمل 15% ضريبة القيمة المضافة. ستُضاف الضريبة إلى فاتورتك وفقاً لأنظمة هيئة الزكاة والضريبة. جميع الفواتير متوافقة مع الفوترة الإلكترونية.",
    },
  },
  {
    question: { en: "Can I upgrade or downgrade my plan?", ar: "هل يمكنني ترقية أو تخفيض خطتي؟" },
    answer: {
      en: "Yes, you can change your plan at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at the start of the next billing cycle.",
      ar: "نعم، يمكنك تغيير خطتك في أي وقت. الترقيات تسري فوراً مع فوترة نسبية. التخفيضات تسري في بداية دورة الفوترة التالية.",
    },
  },
  {
    question: { en: "What happens if I exceed my SMS limit?", ar: "ماذا يحدث إذا تجاوزت حد الرسائل النصية؟" },
    answer: {
      en: "You'll be notified when you reach 80% of your SMS allowance. Additional SMS can be purchased in bundles of 1,000 for 55 SAR/month.",
      ar: "ستُبلّغ عند وصولك إلى 80% من حصتك من الرسائل النصية. يمكن شراء رسائل إضافية بحزم من 1,000 رسالة مقابل 55 ريال/شهر.",
    },
  },
  {
    question: { en: "How is payment processing handled?", ar: "كيف تتم معالجة المدفوعات؟" },
    answer: {
      en: "We use Tap Payments, the leading payment gateway in Saudi Arabia. MADA transactions are 1% and international cards are 2.85%. Gateway fees are separate from your Liyaqa subscription.",
      ar: "نستخدم Tap Payments، بوابة الدفع الرائدة في السعودية. معاملات مدى 1% والبطاقات الدولية 2.85%. رسوم البوابة منفصلة عن اشتراكك في لياقة.",
    },
  },
  {
    question: { en: "Do you support data migration?", ar: "هل تدعمون ترحيل البيانات؟" },
    answer: {
      en: "Yes. Our onboarding team will help you migrate member data, schedules, and billing history from your current system at no additional cost for all plans.",
      ar: "نعم. فريق الإعداد سيساعدك في ترحيل بيانات الأعضاء والجداول وسجل الفواتير من نظامك الحالي بدون تكلفة إضافية لجميع الخطط.",
    },
  },
  {
    question: { en: "Where is my data stored?", ar: "أين تُخزّن بياناتي؟" },
    answer: {
      en: "All data is stored in Google Cloud's Dammam region within Saudi Arabia. We are fully compliant with NDMO data residency requirements and NCA cybersecurity standards.",
      ar: "جميع البيانات مخزنة في منطقة الدمام من Google Cloud داخل السعودية. نحن ممتثلون بالكامل لمتطلبات إقامة البيانات NDMO ومعايير الأمن السيبراني NCA.",
    },
  },
];

// ── Section Texts ────────────────────────────────────────────────────────────

export const SECTION_TEXTS = {
  offer: {
    en: "We appreciate the challenges of starting out, so we have special offers for new clubs. Contact us to learn more about our new club offers.",
    ar: "نقدّر تحديات البداية، لذلك لدينا عروض خاصة للأندية الجديدة. تواصل معنا لمعرفة المزيد عن عروضنا للأندية الجديدة.",
  },
  hero: {
    badge: { en: "Plans", ar: "الخطط" },
    title: { en: "Simple, transparent pricing", ar: "أسعار بسيطة وشفافة" },
    subtitle: {
      en: "Choose the plan that fits your gym. No hidden fees, no long-term contracts. Scale up or down anytime.",
      ar: "اختر الخطة المناسبة لصالتك. لا رسوم خفية، لا عقود طويلة الأمد. قم بالترقية أو التخفيض في أي وقت.",
    },
    billingNote: {
      en: "Per facility, billed monthly. All prices exclude 15% VAT.",
      ar: "لكل منشأة، تُحاسب شهرياً. جميع الأسعار لا تشمل 15% ضريبة القيمة المضافة.",
    },
    monthly: { en: "Monthly", ar: "شهري" },
    annual: { en: "Annual", ar: "سنوي" },
    saveBadge: { en: "Save ~17%", ar: "وفّر ~17%" },
  },
  cards: {
    perMonth: { en: "/ facility / month", ar: "/ منشأة / شهر" },
    mostPopular: { en: "Most Popular", ar: "الأكثر شعبية" },
    getStarted: { en: "Contact Us", ar: "تواصل معنا" },
    contactSales: { en: "Contact Sales", ar: "تواصل مع المبيعات" },
    effectiveMonthly: { en: "/mo effective", ar: "/شهر فعلي" },
    billedAnnually: { en: "billed annually", ar: "تُحاسب سنوياً" },
    volumeTitle: { en: "Multi-Location Discount", ar: "خصم المواقع المتعددة" },
    volumeDesc: {
      en: "Enterprise plan customers with {locations} receive a {discount} on every facility. Contact our sales team for a custom quote.",
      ar: "عملاء خطة المؤسسات مع {locations} يحصلون على {discount} على كل منشأة. تواصل مع فريق المبيعات للحصول على عرض مخصص.",
    },
    volumeLocations: { en: "3+ locations", ar: "3+ مواقع" },
    volumeDiscount: { en: "15% discount", ar: "خصم 15%" },
  },
  comparison: {
    badge: { en: "Compare", ar: "قارن" },
    title: { en: "Full feature comparison", ar: "مقارنة الميزات الكاملة" },
    subtitle: { en: "See exactly what's included in each plan.", ar: "شاهد بالضبط ما هو مشمول في كل خطة." },
    feature: { en: "Feature", ar: "الميزة" },
  },
  included: {
    badge: { en: "Included", ar: "مشمول" },
    title: { en: "What's included in every plan", ar: "ما هو مشمول في كل خطة" },
    subtitle: {
      en: "No extra charges for infrastructure. We handle it all so you can focus on your business.",
      ar: "لا رسوم إضافية للبنية التحتية. نتولى كل شيء حتى تركز على عملك.",
    },
  },
  addons: {
    badge: { en: "Add-ons", ar: "إضافات" },
    title: { en: "Optional add-ons", ar: "إضافات اختيارية" },
    subtitle: { en: "Extend your plan with additional capabilities.", ar: "وسّع خطتك بقدرات إضافية." },
  },
  faq: {
    badge: { en: "FAQ", ar: "الأسئلة الشائعة" },
    title: { en: "Frequently asked questions", ar: "الأسئلة الشائعة" },
  },
};
