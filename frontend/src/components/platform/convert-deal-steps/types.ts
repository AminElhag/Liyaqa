import { z } from "zod";

// Form validation schema
export const convertDealSchema = z.object({
  // Organization
  organizationNameEn: z.string().min(1, "English name is required"),
  organizationNameAr: z.string().optional(),
  organizationTradeNameEn: z.string().optional(),
  organizationTradeNameAr: z.string().optional(),
  organizationType: z.string().optional(),
  organizationEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  organizationPhone: z.string().optional(),
  organizationWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
  vatRegistrationNumber: z.string().optional(),
  commercialRegistrationNumber: z.string().optional(),

  // Club
  clubNameEn: z.string().min(1, "Club English name is required"),
  clubNameAr: z.string().optional(),
  clubDescriptionEn: z.string().optional(),
  clubDescriptionAr: z.string().optional(),

  // Admin User
  adminEmail: z.string().email("Invalid admin email"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  adminDisplayNameEn: z.string().min(1, "Admin display name is required"),
  adminDisplayNameAr: z.string().optional(),

  // Subscription (optional)
  createSubscription: z.boolean().default(false),
  clientPlanId: z.string().optional(),
  agreedPriceAmount: z.coerce.number().min(0).optional(),
  agreedPriceCurrency: z.string().default("SAR"),
  billingCycle: z.string().optional(),
  contractMonths: z.coerce.number().min(1).optional(),
  startWithTrial: z.boolean().default(false),
  trialDays: z.coerce.number().min(1).optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
});

export type ConvertDealFormValues = z.infer<typeof convertDealSchema>;

// Fields required for each step validation
export const STEP_REQUIRED_FIELDS: Record<number, (keyof ConvertDealFormValues)[]> = {
  0: ["organizationNameEn"], // Organization step
  1: ["clubNameEn"], // Club step
  2: ["adminEmail", "adminPassword", "adminDisplayNameEn"], // Admin step
  3: [], // Subscription step - clientPlanId required only if createSubscription is true
  4: [], // Review step - no validation needed
};

// Step configuration
export interface StepConfig {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  color: string;
}

export const WIZARD_STEPS: StepConfig[] = [
  {
    id: "organization",
    title: "Organization",
    titleAr: "المنظمة",
    description: "Basic info",
    descriptionAr: "المعلومات الأساسية",
    color: "blue",
  },
  {
    id: "club",
    title: "Club",
    titleAr: "النادي",
    description: "First club",
    descriptionAr: "النادي الأول",
    color: "emerald",
  },
  {
    id: "admin",
    title: "Admin",
    titleAr: "المسؤول",
    description: "Admin user",
    descriptionAr: "حساب المسؤول",
    color: "amber",
  },
  {
    id: "subscription",
    title: "Subscription",
    titleAr: "الاشتراك",
    description: "Optional",
    descriptionAr: "اختياري",
    color: "cyan",
  },
  {
    id: "review",
    title: "Review",
    titleAr: "المراجعة",
    description: "Confirm",
    descriptionAr: "تأكيد",
    color: "violet",
  },
];
