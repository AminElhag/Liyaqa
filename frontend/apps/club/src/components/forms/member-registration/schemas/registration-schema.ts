import { z } from "zod";

// ==========================================
// STEP 1: PERSONAL INFO SCHEMA
// Names require at least one language (English OR Arabic)
// ==========================================
export const personalInfoSchema = z.object({
  firstName: z
    .object({
      en: z.string().nullish(),
      ar: z.string().nullish(),
    })
    .refine(
      (data) => (data.en?.trim() || data.ar?.trim()),
      { message: "First name is required in at least one language | الاسم الأول مطلوب بلغة واحدة على الأقل" }
    ),
  lastName: z
    .object({
      en: z.string().nullish(),
      ar: z.string().nullish(),
    })
    .refine(
      (data) => (data.en?.trim() || data.ar?.trim()),
      { message: "Last name is required in at least one language | اسم العائلة مطلوب بلغة واحدة على الأقل" }
    ),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  nationality: z.string().optional(),
  nationalId: z.string().optional(),
  preferredLanguage: z.enum(["EN", "AR"]).default("EN"),
});

export type PersonalInfoData = z.infer<typeof personalInfoSchema>;

// ==========================================
// STEP 2: CONTACT SCHEMA
// ==========================================
export const contactSchema = z.object({
  address: z
    .object({
      en: z.string(),
      ar: z.string().nullish(),
    })
    .optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  registrationNotes: z
    .object({
      en: z.string(),
      ar: z.string().nullish(),
    })
    .optional(),
});

export type ContactData = z.infer<typeof contactSchema>;

// ==========================================
// STEP 3: HEALTH INFO SCHEMA (PAR-Q)
// ==========================================
export const healthInfoSchema = z.object({
  // PAR-Q Questions (7 core questions)
  hasHeartCondition: z.boolean().default(false),
  hasChestPainDuringActivity: z.boolean().default(false),
  hasChestPainAtRest: z.boolean().default(false),
  hasDizzinessOrBalance: z.boolean().default(false),
  hasBoneJointProblem: z.boolean().default(false),
  takesBloodPressureMedication: z.boolean().default(false),
  hasOtherReasonNotToExercise: z.boolean().default(false),
  // Health Details
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  injuriesAndLimitations: z.string().optional(),
  bloodType: z
    .enum([
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE",
      "UNKNOWN",
    ])
    .optional(),
  emergencyMedicalNotes: z.string().optional(),
  // Doctor Info
  doctorName: z.string().optional(),
  doctorPhone: z.string().optional(),
});

export type HealthInfoData = z.infer<typeof healthInfoSchema>;

// ==========================================
// STEP 4: AGREEMENTS SCHEMA
// ==========================================
export const agreementsSchema = z.object({
  signedAgreementIds: z.array(z.string().uuid()).default([]),
  signatures: z.record(z.string(), z.string()).optional(), // agreementId -> signatureData
});

export type AgreementsData = z.infer<typeof agreementsSchema>;

// ==========================================
// STEP 5: SUBSCRIPTION SCHEMA
// ==========================================
export const subscriptionSchema = z.object({
  planId: z.string().uuid("Please select a membership plan"),
  startDate: z.string().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  discountReason: z.string().optional(),
});

export type SubscriptionData = z.infer<typeof subscriptionSchema>;

// ==========================================
// COMBINED REGISTRATION SCHEMA
// ==========================================
export const registrationSchema = z.object({
  // Step 1: Personal Info
  ...personalInfoSchema.shape,
  // Step 2: Contact
  ...contactSchema.shape,
  // Step 3: Health (optional - stored separately)
  health: healthInfoSchema.optional(),
  // Step 4: Agreements
  agreements: agreementsSchema.optional(),
  // Step 5: Subscription
  subscription: subscriptionSchema.optional(),
});

export type RegistrationData = z.infer<typeof registrationSchema>;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Check if any PAR-Q question is answered "Yes"
 */
export function needsMedicalClearance(health: HealthInfoData): boolean {
  return (
    health.hasHeartCondition ||
    health.hasChestPainDuringActivity ||
    health.hasChestPainAtRest ||
    health.hasDizzinessOrBalance ||
    health.hasBoneJointProblem ||
    health.takesBloodPressureMedication ||
    health.hasOtherReasonNotToExercise
  );
}

/**
 * Default health values (all PAR-Q answers are "No")
 */
export const defaultHealthValues: HealthInfoData = {
  hasHeartCondition: false,
  hasChestPainDuringActivity: false,
  hasChestPainAtRest: false,
  hasDizzinessOrBalance: false,
  hasBoneJointProblem: false,
  takesBloodPressureMedication: false,
  hasOtherReasonNotToExercise: false,
};

/**
 * Default registration values
 */
export const defaultRegistrationValues: Partial<RegistrationData> = {
  firstName: { en: "", ar: null },
  lastName: { en: "", ar: null },
  email: "",
  phone: "",
  preferredLanguage: "EN",
  health: defaultHealthValues,
  agreements: { signedAgreementIds: [] },
};
