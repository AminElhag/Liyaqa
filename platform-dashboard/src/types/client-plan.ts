import type { UUID, LocalizedText, Money } from "./api";

/**
 * Billing cycle for client subscriptions.
 */
export type BillingCycle = "MONTHLY" | "QUARTERLY" | "ANNUAL";

/**
 * Full client plan response.
 */
export interface ClientPlan {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText;
  monthlyPrice: Money;
  annualPrice: Money;
  billingCycle: BillingCycle;

  // Usage limits
  maxClubs: number;
  maxLocationsPerClub: number;
  maxMembers: number;
  maxStaffUsers: number;

  // Legacy feature flags
  hasAdvancedReporting: boolean;
  hasApiAccess: boolean;
  hasPrioritySupport: boolean;
  hasWhiteLabeling: boolean;
  hasCustomIntegrations: boolean;

  // Member Engagement features
  hasMemberPortal: boolean;
  hasMobileApp: boolean;
  hasWearablesIntegration: boolean;

  // Marketing & Loyalty features
  hasMarketingAutomation: boolean;
  hasLoyaltyProgram: boolean;

  // Operations features
  hasAccessControl: boolean;
  hasFacilityBooking: boolean;
  hasPersonalTraining: boolean;

  // Accounts & Payments features
  hasCorporateAccounts: boolean;
  hasFamilyGroups: boolean;
  hasOnlinePayments: boolean;

  // Status
  isActive: boolean;
  sortOrder: number;

  // Calculated fields
  annualSavingsAmount: number;
  effectiveMonthlyPriceAnnual: Money;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified plan response for listings.
 */
export interface ClientPlanSummary {
  id: UUID;
  name: LocalizedText;
  monthlyPrice: Money;
  annualPrice: Money;
  isActive: boolean;
}

// ============================================
// Request Types
// ============================================

export interface CreateClientPlanRequest {
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  monthlyPriceAmount: number;
  monthlyPriceCurrency?: string;
  annualPriceAmount: number;
  annualPriceCurrency?: string;
  billingCycle?: BillingCycle;
  maxClubs?: number;
  maxLocationsPerClub?: number;
  maxMembers?: number;
  maxStaffUsers?: number;
  // Legacy features
  hasAdvancedReporting?: boolean;
  hasApiAccess?: boolean;
  hasPrioritySupport?: boolean;
  hasWhiteLabeling?: boolean;
  hasCustomIntegrations?: boolean;
  // Member Engagement features
  hasMemberPortal?: boolean;
  hasMobileApp?: boolean;
  hasWearablesIntegration?: boolean;
  // Marketing & Loyalty features
  hasMarketingAutomation?: boolean;
  hasLoyaltyProgram?: boolean;
  // Operations features
  hasAccessControl?: boolean;
  hasFacilityBooking?: boolean;
  hasPersonalTraining?: boolean;
  // Accounts & Payments features
  hasCorporateAccounts?: boolean;
  hasFamilyGroups?: boolean;
  hasOnlinePayments?: boolean;
  sortOrder?: number;
}

export interface UpdateClientPlanRequest {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  monthlyPriceAmount?: number;
  monthlyPriceCurrency?: string;
  annualPriceAmount?: number;
  annualPriceCurrency?: string;
  billingCycle?: BillingCycle;
  maxClubs?: number;
  maxLocationsPerClub?: number;
  maxMembers?: number;
  maxStaffUsers?: number;
  // Legacy features
  hasAdvancedReporting?: boolean;
  hasApiAccess?: boolean;
  hasPrioritySupport?: boolean;
  hasWhiteLabeling?: boolean;
  hasCustomIntegrations?: boolean;
  // Member Engagement features
  hasMemberPortal?: boolean;
  hasMobileApp?: boolean;
  hasWearablesIntegration?: boolean;
  // Marketing & Loyalty features
  hasMarketingAutomation?: boolean;
  hasLoyaltyProgram?: boolean;
  // Operations features
  hasAccessControl?: boolean;
  hasFacilityBooking?: boolean;
  hasPersonalTraining?: boolean;
  // Accounts & Payments features
  hasCorporateAccounts?: boolean;
  hasFamilyGroups?: boolean;
  hasOnlinePayments?: boolean;
  sortOrder?: number;
}

// Query params
export interface ClientPlanQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  isActive?: boolean;
}

// ============================================
// Feature Dependencies
// ============================================

/**
 * Defines which features depend on other features.
 * Key: feature that has a dependency
 * Value: feature that must be enabled for the key feature to work
 */
export const FEATURE_DEPENDENCIES: Record<string, string> = {
  hasMobileApp: "hasMemberPortal",
  hasWearablesIntegration: "hasMobileApp",
  hasMarketingAutomation: "hasMemberPortal",
  hasLoyaltyProgram: "hasMemberPortal",
};

/**
 * Returns all features that depend on a given feature (including transitive dependencies).
 */
export function getDependentFeatures(feature: string): string[] {
  const dependents: string[] = [];
  for (const [dependent, dependency] of Object.entries(FEATURE_DEPENDENCIES)) {
    if (dependency === feature) {
      dependents.push(dependent);
      // Check for transitive dependencies
      dependents.push(...getDependentFeatures(dependent));
    }
  }
  return dependents;
}

// ============================================
// Feature Categories for UI Grouping
// ============================================

export type FeatureKey =
  | "hasMemberPortal"
  | "hasMobileApp"
  | "hasWearablesIntegration"
  | "hasMarketingAutomation"
  | "hasLoyaltyProgram"
  | "hasAccessControl"
  | "hasFacilityBooking"
  | "hasPersonalTraining"
  | "hasCorporateAccounts"
  | "hasFamilyGroups"
  | "hasOnlinePayments"
  | "hasAdvancedReporting"
  | "hasApiAccess"
  | "hasPrioritySupport"
  | "hasWhiteLabeling"
  | "hasCustomIntegrations";

export interface FeatureDefinition {
  key: FeatureKey;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  dependsOn?: FeatureKey;
}

export interface FeatureCategory {
  id: string;
  labelEn: string;
  labelAr: string;
  features: FeatureDefinition[];
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "member-engagement",
    labelEn: "Member Engagement",
    labelAr: "تفاعل الأعضاء",
    features: [
      {
        key: "hasMemberPortal",
        labelEn: "Member Portal",
        labelAr: "بوابة الأعضاء",
        descriptionEn: "Self-service web portal for booking, profile, and payments",
        descriptionAr: "بوابة الخدمة الذاتية للحجز والملف الشخصي والمدفوعات",
      },
      {
        key: "hasMobileApp",
        labelEn: "Mobile App",
        labelAr: "تطبيق الجوال",
        descriptionEn: "White-label mobile app for members",
        descriptionAr: "تطبيق جوال بعلامة تجارية مخصصة للأعضاء",
        dependsOn: "hasMemberPortal",
      },
      {
        key: "hasWearablesIntegration",
        labelEn: "Wearables Integration",
        labelAr: "تكامل الأجهزة القابلة للارتداء",
        descriptionEn: "Fitbit, Apple Watch sync",
        descriptionAr: "مزامنة Fitbit و Apple Watch",
        dependsOn: "hasMobileApp",
      },
    ],
  },
  {
    id: "marketing-loyalty",
    labelEn: "Marketing & Loyalty",
    labelAr: "التسويق والولاء",
    features: [
      {
        key: "hasMarketingAutomation",
        labelEn: "Marketing Automation",
        labelAr: "أتمتة التسويق",
        descriptionEn: "Email/WhatsApp campaigns and segmentation",
        descriptionAr: "حملات البريد الإلكتروني/واتساب والتقسيم",
        dependsOn: "hasMemberPortal",
      },
      {
        key: "hasLoyaltyProgram",
        labelEn: "Loyalty Program",
        labelAr: "برنامج الولاء",
        descriptionEn: "Points, badges, and gamification",
        descriptionAr: "النقاط والشارات والألعاب",
        dependsOn: "hasMemberPortal",
      },
    ],
  },
  {
    id: "operations",
    labelEn: "Operations",
    labelAr: "العمليات",
    features: [
      {
        key: "hasAccessControl",
        labelEn: "Access Control",
        labelAr: "التحكم في الوصول",
        descriptionEn: "Check-in kiosks and access devices",
        descriptionAr: "أكشاك تسجيل الدخول وأجهزة الوصول",
      },
      {
        key: "hasFacilityBooking",
        labelEn: "Facility Booking",
        labelAr: "حجز المرافق",
        descriptionEn: "Pool, sauna, and courts booking",
        descriptionAr: "حجز المسبح والساونا والملاعب",
      },
      {
        key: "hasPersonalTraining",
        labelEn: "Personal Training",
        labelAr: "التدريب الشخصي",
        descriptionEn: "PT session scheduling and packages",
        descriptionAr: "جدولة جلسات PT والباقات",
      },
    ],
  },
  {
    id: "accounts-payments",
    labelEn: "Accounts & Payments",
    labelAr: "الحسابات والمدفوعات",
    features: [
      {
        key: "hasCorporateAccounts",
        labelEn: "Corporate Accounts",
        labelAr: "حسابات الشركات",
        descriptionEn: "B2B corporate memberships",
        descriptionAr: "عضويات الشركات B2B",
      },
      {
        key: "hasFamilyGroups",
        labelEn: "Family Groups",
        labelAr: "مجموعات العائلة",
        descriptionEn: "Family membership plans",
        descriptionAr: "خطط عضوية العائلة",
      },
      {
        key: "hasOnlinePayments",
        labelEn: "Online Payments",
        labelAr: "المدفوعات الإلكترونية",
        descriptionEn: "STC Pay, SADAD, Tamara, Stripe",
        descriptionAr: "STC Pay و SADAD و Tamara و Stripe",
      },
    ],
  },
  {
    id: "platform-support",
    labelEn: "Platform & Support",
    labelAr: "المنصة والدعم",
    features: [
      {
        key: "hasAdvancedReporting",
        labelEn: "Advanced Reporting",
        labelAr: "تقارير متقدمة",
        descriptionEn: "Detailed analytics and insights",
        descriptionAr: "تحليلات ورؤى تفصيلية",
      },
      {
        key: "hasApiAccess",
        labelEn: "API Access",
        labelAr: "وصول API",
        descriptionEn: "Access to the REST API",
        descriptionAr: "الوصول إلى واجهة برمجة التطبيقات",
      },
      {
        key: "hasPrioritySupport",
        labelEn: "Priority Support",
        labelAr: "دعم أولوي",
        descriptionEn: "Fast and dedicated technical support",
        descriptionAr: "دعم فني سريع ومخصص",
      },
      {
        key: "hasWhiteLabeling",
        labelEn: "White Labeling",
        labelAr: "علامة بيضاء",
        descriptionEn: "Custom branding options",
        descriptionAr: "خيارات تخصيص العلامة التجارية",
      },
      {
        key: "hasCustomIntegrations",
        labelEn: "Custom Integrations",
        labelAr: "تكاملات مخصصة",
        descriptionEn: "Integration with external systems",
        descriptionAr: "تكامل مع أنظمة خارجية",
      },
    ],
  },
];
