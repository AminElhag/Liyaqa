import { z } from "zod";

// Step 1: Member
export const existingMemberSchema = z.object({
  memberType: z.literal("existing"),
  existingMemberId: z.string().uuid("Select a member"),
});

export const newMemberSchema = z.object({
  memberType: z.literal("new"),
  firstNameEn: z.string().min(1, "First name is required"),
  firstNameAr: z.string().optional(),
  lastNameEn: z.string().min(1, "Last name is required"),
  lastNameAr: z.string().optional(),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  nationalId: z.string().optional(),
});

export const memberStepSchema = z.discriminatedUnion("memberType", [
  existingMemberSchema,
  newMemberSchema,
]);

// Step 2: Plan
export const planStepSchema = z.object({
  planId: z.string().uuid("Select a plan"),
  startDate: z.string().optional(),
  autoRenew: z.boolean().default(false),
});

// Step 3: Contract
export const contractStepSchema = z.object({
  contractType: z.enum(["MONTH_TO_MONTH", "FIXED_TERM"]).default("MONTH_TO_MONTH"),
  contractTerm: z.enum(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]).default("MONTHLY"),
  categoryId: z.string().uuid().optional().or(z.literal("")),
});

// Step 4: Payment
export const paymentStepSchema = z.object({
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MADA", "APPLE_PAY", "STC_PAY"]).optional(),
  paidAmount: z.coerce.number().min(0).optional(),
  voucherCode: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "PROMOTIONAL", "CORPORATE", "REFERRAL", "LOYALTY"]).optional(),
  discountValue: z.coerce.number().min(0).optional(),
  discountReason: z.string().optional(),
});

// Step 5: Review
export const reviewStepSchema = z.object({
  staffNotes: z.string().optional(),
  referredByMemberId: z.string().uuid().optional().or(z.literal("")),
});

// Full form schema
export const enrollmentFormSchema = z.object({
  // Step 1
  memberType: z.enum(["existing", "new"]).default("new"),
  existingMemberId: z.string().optional(),
  firstNameEn: z.string().optional(),
  firstNameAr: z.string().optional(),
  lastNameEn: z.string().optional(),
  lastNameAr: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  nationalId: z.string().optional(),
  // Step 2
  planId: z.string().default(""),
  startDate: z.string().optional(),
  autoRenew: z.boolean().default(false),
  // Step 3
  contractType: z.string().default("MONTH_TO_MONTH"),
  contractTerm: z.string().default("MONTHLY"),
  categoryId: z.string().optional(),
  // Step 4
  paymentMethod: z.string().optional(),
  paidAmount: z.coerce.number().optional(),
  voucherCode: z.string().optional(),
  discountType: z.string().optional(),
  discountValue: z.coerce.number().optional(),
  discountReason: z.string().optional(),
  // Step 5
  staffNotes: z.string().optional(),
  referredByMemberId: z.string().optional(),
});

export type EnrollmentFormData = z.infer<typeof enrollmentFormSchema>;

// Per-step validation field lists
export const STEP_FIELDS: Record<number, (keyof EnrollmentFormData)[]> = {
  0: ["memberType", "existingMemberId", "firstNameEn", "lastNameEn", "email"],
  1: ["planId"],
  2: ["contractType", "contractTerm"],
  3: ["paymentMethod", "paidAmount"],
  4: ["staffNotes"],
};
