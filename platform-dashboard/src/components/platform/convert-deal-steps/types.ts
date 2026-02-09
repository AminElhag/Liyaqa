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
    titleAr: "\u0627\u0644\u0645\u0646\u0638\u0645\u0629",
    description: "Basic info",
    descriptionAr: "\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629",
    color: "blue",
  },
  {
    id: "club",
    title: "Club",
    titleAr: "\u0627\u0644\u0646\u0627\u062F\u064A",
    description: "First club",
    descriptionAr: "\u0627\u0644\u0646\u0627\u062F\u064A \u0627\u0644\u0623\u0648\u0644",
    color: "emerald",
  },
  {
    id: "admin",
    title: "Admin",
    titleAr: "\u0627\u0644\u0645\u0633\u0624\u0648\u0644",
    description: "Admin user",
    descriptionAr: "\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u0624\u0648\u0644",
    color: "amber",
  },
  {
    id: "subscription",
    title: "Subscription",
    titleAr: "\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643",
    description: "Optional",
    descriptionAr: "\u0627\u062E\u062A\u064A\u0627\u0631\u064A",
    color: "cyan",
  },
  {
    id: "review",
    title: "Review",
    titleAr: "\u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629",
    description: "Confirm",
    descriptionAr: "\u062A\u0623\u0643\u064A\u062F",
    color: "violet",
  },
];
