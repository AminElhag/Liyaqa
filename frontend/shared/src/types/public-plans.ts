/**
 * Public client plan type for landing page pricing display.
 * Mirrors the backend PublicClientPlanDto.
 */
export interface PublicClientPlan {
  id: string;
  name: LocalizedText;
  description: LocalizedText | null;
  monthlyPrice: Money;
  annualPrice: Money;
  maxMembers: number;
  maxLocationsPerClub: number;
  maxClubs: number;
  maxStaffUsers: number;
  sortOrder: number;
  features: Record<string, boolean>;
  effectiveMonthlyPriceAnnual: Money;
  annualSavingsPercent: number;
}

interface LocalizedText {
  en: string;
  ar: string | null;
}

interface Money {
  amount: number;
  currency: string;
}

/**
 * Feature flag display configuration.
 * Maps backend feature flag names to user-friendly labels.
 */
export const FEATURE_LABELS: Record<string, { en: string; ar: string }> = {
  hasMemberPortal: { en: "Member Portal", ar: "بوابة الأعضاء" },
  hasMobileApp: { en: "Mobile App", ar: "تطبيق الجوال" },
  hasWearablesIntegration: { en: "Wearables Sync", ar: "مزامنة الأجهزة" },
  hasMarketingAutomation: { en: "Marketing Tools", ar: "أدوات التسويق" },
  hasLoyaltyProgram: { en: "Loyalty Program", ar: "برنامج الولاء" },
  hasAccessControl: { en: "Access Control", ar: "التحكم بالدخول" },
  hasFacilityBooking: { en: "Facility Booking", ar: "حجز المرافق" },
  hasPersonalTraining: { en: "PT Management", ar: "إدارة المدربين" },
  hasCorporateAccounts: { en: "Corporate Accounts", ar: "حسابات الشركات" },
  hasFamilyGroups: { en: "Family Plans", ar: "خطط عائلية" },
  hasOnlinePayments: { en: "Online Payments", ar: "الدفع الإلكتروني" },
  hasAdvancedReporting: { en: "Advanced Reports", ar: "تقارير متقدمة" },
  hasApiAccess: { en: "API Access", ar: "الوصول للـ API" },
  hasPrioritySupport: { en: "Priority Support", ar: "دعم أولوية" },
  hasWhiteLabeling: { en: "White-Label App", ar: "تطبيق مخصص" },
  hasCustomIntegrations: { en: "Custom Integrations", ar: "تكاملات مخصصة" },
};

/**
 * Features to display on pricing cards, in order.
 */
export const PRICING_DISPLAY_FEATURES = [
  "hasMemberPortal",
  "hasOnlinePayments",
  "hasFacilityBooking",
  "hasMarketingAutomation",
  "hasAccessControl",
  "hasMobileApp",
  "hasApiAccess",
  "hasPrioritySupport",
  "hasWhiteLabeling",
  "hasCustomIntegrations",
] as const;
