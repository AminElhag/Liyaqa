import { z } from "zod";
import type { MembershipPlanType } from "@liyaqa/shared/types/member";

// === Fee schema ===
export const taxableFeeSchema = z.object({
  amount: z.coerce.number().min(0, "Amount must be 0 or more"),
  currency: z.string().default("SAR"),
  taxRate: z.coerce.number().min(0).max(100).default(15),
});

// === Step 1: Identity & Pricing ===
export const identityPricingSchema = z.object({
  nameEn: z.string().min(1, "Plan name (English) is required"),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  membershipFee: taxableFeeSchema,
  administrationFee: taxableFeeSchema,
  joinFee: taxableFeeSchema,
  billingPeriod: z.enum([
    "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME",
  ]).default("MONTHLY"),
  durationDays: z.coerce.number().positive().optional().nullable(),
  // Class pack fields
  sessionCount: z.coerce.number().positive().optional().nullable(),
  expiryDays: z.coerce.number().positive().optional().nullable(),
  // Trial fields
  convertsToPlanId: z.string().uuid().optional().or(z.literal("")),
});

// === Step 2: Features & Access ===
export const featuresSchema = z.object({
  hasPoolAccess: z.boolean().default(false),
  hasSaunaAccess: z.boolean().default(false),
  hasLockerAccess: z.boolean().default(false),
  maxClassesPerPeriod: z.coerce.number().min(0).optional().nullable(),
  // GX class access
  classAccessLevel: z.enum(["UNLIMITED", "LIMITED", "NO_ACCESS"]).default("UNLIMITED"),
  eligibleClassCategories: z.string().optional().nullable(),
  // PT access
  ptAccessLevel: z.enum(["UNLIMITED", "LIMITED", "NO_ACCESS"]).default("NO_ACCESS"),
  maxPtSessionsPerPeriod: z.coerce.number().min(0).optional().nullable(),
  ptSessionsIncluded: z.coerce.number().min(0).optional().nullable(),
  hasGuestPasses: z.boolean().default(false),
  guestPassesCount: z.coerce.number().min(0).default(0),
  freezeDaysAllowed: z.coerce.number().min(0).default(0),
});

// === Step 3: Eligibility & Contract ===
export const eligibilityContractSchema = z.object({
  availableFrom: z.string().optional(),
  availableUntil: z.string().optional(),
  minimumAge: z.coerce.number().min(0).optional().nullable(),
  maximumAge: z.coerce.number().min(0).optional().nullable(),
  contractType: z.enum(["MONTH_TO_MONTH", "FIXED_TERM"]).default("MONTH_TO_MONTH"),
  supportedTerms: z.array(z.string()).default(["MONTHLY"]),
  defaultCommitmentMonths: z.coerce.number().min(1).max(60).default(1),
  minimumCommitmentMonths: z.coerce.number().min(0).max(60).optional().nullable(),
  defaultNoticePeriodDays: z.coerce.number().min(0).max(90).default(30),
  coolingOffDays: z.coerce.number().min(0).max(30).default(14),
  earlyTerminationFeeType: z.enum(["NONE", "FLAT_FEE", "REMAINING_MONTHS", "PERCENTAGE"]).default("NONE"),
  earlyTerminationFeeValue: z.coerce.number().min(0).optional().nullable(),
});

// === Step 4: Review (save options) ===
export const reviewSchema = z.object({
  saveAs: z.enum(["draft", "active"]).default("active"),
  sortOrder: z.coerce.number().min(0).default(0),
});

// === Full plan wizard form data ===
export const planWizardSchema = z.object({
  // Plan type (set before wizard starts)
  planType: z.enum(["RECURRING", "CLASS_PACK", "DAY_PASS", "TRIAL"]).default("RECURRING"),
  // Step 1
  ...identityPricingSchema.shape,
  // Step 2
  ...featuresSchema.shape,
  // Step 3
  ...eligibilityContractSchema.shape,
  // Step 4
  ...reviewSchema.shape,
});

export type PlanWizardFormData = z.infer<typeof planWizardSchema>;

// === Step configuration per plan type ===
export interface StepConfig {
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
}

export function getStepsForType(planType: MembershipPlanType): StepConfig[] {
  const steps: StepConfig[] = [
    {
      label: "Identity & Pricing",
      labelAr: "الهوية والتسعير",
      description: "Plan name and pricing",
      descriptionAr: "اسم الخطة والتسعير",
    },
    {
      label: "Features",
      labelAr: "المميزات",
      description: "Access and amenities",
      descriptionAr: "الوصول والمرافق",
    },
  ];

  // Only RECURRING and TRIAL have contract step
  if (planType === "RECURRING" || planType === "TRIAL") {
    steps.push({
      label: "Eligibility & Contract",
      labelAr: "الأهلية والعقد",
      description: "Rules and terms",
      descriptionAr: "القواعد والشروط",
    });
  }

  steps.push({
    label: "Review",
    labelAr: "المراجعة",
    description: "Confirm and save",
    descriptionAr: "تأكيد وحفظ",
  });

  return steps;
}

// Default values for the wizard form
export function getDefaultValues(planType: MembershipPlanType): PlanWizardFormData {
  return {
    planType,
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    membershipFee: { amount: 0, currency: "SAR", taxRate: 15 },
    administrationFee: { amount: 0, currency: "SAR", taxRate: 15 },
    joinFee: { amount: 0, currency: "SAR", taxRate: 0 },
    billingPeriod: planType === "DAY_PASS" ? "ONE_TIME" : "MONTHLY",
    durationDays: null,
    sessionCount: null,
    expiryDays: planType === "CLASS_PACK" ? 90 : null,
    convertsToPlanId: "",
    hasPoolAccess: false,
    hasSaunaAccess: false,
    hasLockerAccess: false,
    maxClassesPerPeriod: null,
    classAccessLevel: "UNLIMITED",
    eligibleClassCategories: null,
    ptAccessLevel: "NO_ACCESS",
    maxPtSessionsPerPeriod: null,
    ptSessionsIncluded: null,
    hasGuestPasses: false,
    guestPassesCount: 0,
    freezeDaysAllowed: 0,
    availableFrom: "",
    availableUntil: "",
    minimumAge: null,
    maximumAge: null,
    contractType: "MONTH_TO_MONTH",
    supportedTerms: ["MONTHLY"],
    defaultCommitmentMonths: 1,
    minimumCommitmentMonths: null,
    defaultNoticePeriodDays: 30,
    coolingOffDays: 14,
    earlyTerminationFeeType: "NONE",
    earlyTerminationFeeValue: null,
    saveAs: "active",
    sortOrder: 0,
  };
}

/**
 * Calculate gross amount from net + tax rate
 */
export function calculateGross(amount: number, taxRate: number): number {
  return Math.round((amount * (1 + taxRate / 100)) * 100) / 100;
}
