import type { LocalizedText, Money, UUID } from "./api";

// === Request types ===

export interface NewMemberInput {
  firstNameEn: string;
  firstNameAr?: string;
  lastNameEn: string;
  lastNameAr?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE";
  nationalId?: string;
}

export interface EnrollmentRequest {
  existingMemberId?: UUID;
  newMember?: NewMemberInput;
  planId: UUID;
  startDate?: string;
  autoRenew?: boolean;
  contractType?: string;
  contractTerm?: string;
  categoryId?: UUID;
  paymentMethod?: string;
  paidAmount?: number;
  paidCurrency?: string;
  voucherCode?: string;
  discountType?: string;
  discountValue?: number;
  discountReason?: string;
  staffNotes?: string;
  referredByMemberId?: UUID;
}

export interface EnrollmentPreviewRequest {
  planId: UUID;
  contractTerm?: string;
  voucherCode?: string;
  discountType?: string;
  discountValue?: number;
  existingMemberId?: UUID;
}

// === Response types ===

export interface FeeLineResponse {
  label: LocalizedText;
  netAmount: Money;
  taxRate: number;
  taxAmount: Money;
  grossAmount: Money;
  applicable: boolean;
}

export interface EnrollmentPreviewResponse {
  planId: UUID;
  planName: LocalizedText;
  billingPeriod: string;
  durationDays: number;
  membershipFee: FeeLineResponse;
  administrationFee: FeeLineResponse;
  joinFee: FeeLineResponse;
  subtotal: Money;
  vatTotal: Money;
  discountAmount?: Money;
  grandTotal: Money;
  contractTerm: string;
  commitmentMonths: number;
  coolingOffDays: number;
  noticePeriodDays: number;
  isFirstSubscription: boolean;
}

export interface EnrollmentResponse {
  memberId: UUID;
  subscriptionId: UUID;
  contractId?: UUID;
  invoiceId?: UUID;
  status: string;
  memberName: LocalizedText;
  planName: LocalizedText;
  totalAmount: Money;
  paidAmount?: Money;
  startDate: string;
  endDate: string;
}
