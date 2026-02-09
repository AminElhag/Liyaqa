import type { UUID } from "./api";

/**
 * Onboarding step status
 */
export type OnboardingStepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

/**
 * Individual onboarding step
 */
export interface OnboardingStep {
  id: string;
  key: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  status: OnboardingStepStatus;
  points: number;
  completedAt?: string;
  order: number;
  isRequired: boolean;
  actionUrl?: string;
}

/**
 * Onboarding milestone
 */
export interface OnboardingMilestone {
  points: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  unlockedFeature?: string;
  isAchieved: boolean;
  achievedAt?: string;
}

/**
 * Client onboarding progress
 */
export interface ClientOnboarding {
  organizationId: UUID;
  organizationNameEn: string;
  organizationNameAr?: string;
  totalPoints: number;
  maxPoints: number;
  progressPercent: number;
  stepsCompleted: number;
  totalSteps: number;
  startedAt: string;
  completedAt?: string;
  lastActivityAt?: string;
  isStalled: boolean;
  stalledDays: number;
  currentMilestone?: OnboardingMilestone;
  nextMilestone?: OnboardingMilestone;
  steps: OnboardingStep[];
}

/**
 * Onboarding overview statistics
 */
export interface OnboardingOverview {
  totalInOnboarding: number;
  stalledCount: number;
  averageProgress: number;
  averageCompletionDays: number;
  completedThisWeek: number;
  completedThisMonth: number;
}

/**
 * Client onboarding summary for dashboard
 */
export interface OnboardingSummary {
  organizationId: UUID;
  organizationNameEn: string;
  organizationNameAr?: string;
  progressPercent: number;
  totalPoints: number;
  stalledDays: number;
  isStalled: boolean;
  daysInOnboarding: number;
  lastActivityAt?: string;
}

/**
 * Predefined onboarding steps configuration
 */
export const ONBOARDING_STEPS_CONFIG: Record<
  string,
  { titleEn: string; titleAr: string; points: number; icon: string }
> = {
  CREATE_ACCOUNT: {
    titleEn: "Create Account",
    titleAr: "إنشاء حساب",
    points: 10,
    icon: "UserPlus",
  },
  VERIFY_EMAIL: {
    titleEn: "Verify Email",
    titleAr: "تأكيد البريد الإلكتروني",
    points: 5,
    icon: "MailCheck",
  },
  ADD_FIRST_LOCATION: {
    titleEn: "Add First Location",
    titleAr: "إضافة أول موقع",
    points: 15,
    icon: "MapPin",
  },
  CREATE_MEMBERSHIP_PLANS: {
    titleEn: "Create Membership Plans",
    titleAr: "إنشاء خطط العضوية",
    points: 20,
    icon: "CreditCard",
  },
  ADD_FIRST_MEMBER: {
    titleEn: "Add First Member",
    titleAr: "إضافة أول عضو",
    points: 10,
    icon: "UserCheck",
  },
  SETUP_PAYMENT: {
    titleEn: "Setup Payment Method",
    titleAr: "إعداد طريقة الدفع",
    points: 15,
    icon: "Wallet",
  },
  CONFIGURE_ACCESS_CONTROL: {
    titleEn: "Configure Access Control",
    titleAr: "تكوين التحكم بالوصول",
    points: 10,
    icon: "Shield",
  },
  INVITE_STAFF: {
    titleEn: "Invite Staff Members",
    titleAr: "دعوة أعضاء الفريق",
    points: 15,
    icon: "Users",
  },
};

/**
 * Milestone configurations
 */
export const MILESTONE_CONFIG = [
  { points: 30, featureEn: "Basic Dashboard", featureAr: "لوحة المعلومات الأساسية" },
  { points: 60, featureEn: "Marketing Suite", featureAr: "أدوات التسويق" },
  { points: 80, featureEn: "Advanced Reports", featureAr: "التقارير المتقدمة" },
  { points: 100, featureEn: "All Features", featureAr: "جميع المميزات" },
];

/**
 * Get onboarding progress color
 */
export function getOnboardingProgressColor(percent: number): string {
  if (percent >= 80) return "emerald";
  if (percent >= 50) return "blue";
  if (percent >= 25) return "amber";
  return "slate";
}

/**
 * Get stalled status label
 */
export function getStalledLabel(stalledDays: number, locale: string): string {
  if (stalledDays === 0) return "";
  if (stalledDays < 7) return locale === "ar" ? "يحتاج متابعة" : "Needs follow-up";
  if (stalledDays < 14) return locale === "ar" ? "متوقف" : "Stalled";
  return locale === "ar" ? "متوقف - أولوية عالية" : "Stalled - High Priority";
}
