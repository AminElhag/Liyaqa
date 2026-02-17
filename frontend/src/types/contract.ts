import { LocalizedText, Money, UUID } from "./api";

// ==========================================
// CONTRACT ENUMS
// ==========================================

export type ContractType = "MONTH_TO_MONTH" | "FIXED_TERM";

export type ContractTerm = "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";

export type ContractStatus =
  | "PENDING_SIGNATURE"
  | "ACTIVE"
  | "IN_NOTICE_PERIOD"
  | "CANCELLED"
  | "EXPIRED"
  | "SUSPENDED"
  | "VOIDED";

export type TerminationFeeType =
  | "NONE"
  | "FLAT_FEE"
  | "REMAINING_MONTHS"
  | "PERCENTAGE";

export type CancellationType =
  | "MEMBER_REQUEST"
  | "NON_PAYMENT"
  | "VIOLATION"
  | "RELOCATION"
  | "MEDICAL"
  | "COOLING_OFF"
  | "DECEASED"
  | "FACILITY_CLOSURE"
  | "ADMINISTRATIVE";

export type ProrationMode =
  | "PRORATE_IMMEDIATELY"
  | "END_OF_PERIOD"
  | "FULL_PERIOD_CREDIT"
  | "NO_PRORATION";

export type PlanChangeType = "UPGRADE" | "DOWNGRADE" | "LATERAL";

export type RetentionOfferType =
  | "FREE_FREEZE"
  | "DISCOUNT"
  | "CREDIT"
  | "DOWNGRADE"
  | "EXTENSION"
  | "PERSONAL_TRAINING"
  | "CUSTOM";

export type RetentionOfferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export type CancellationReasonCategory =
  | "FINANCIAL"
  | "RELOCATION"
  | "HEALTH"
  | "DISSATISFACTION"
  | "USAGE"
  | "COMPETITION"
  | "PERSONAL"
  | "OTHER";

// ==========================================
// CONTRACT TYPES
// ==========================================

export interface MembershipContract {
  id: UUID;
  contractNumber: string;
  memberId: UUID;
  planId: UUID;
  subscriptionId?: UUID;
  categoryId?: UUID;
  contractType: ContractType;
  contractTerm: ContractTerm;
  commitmentMonths: number;
  noticePeriodDays: number;
  startDate: string;
  commitmentEndDate?: string;
  effectiveEndDate?: string;
  lockedMonthlyFee: number;
  lockedCurrency: string;
  earlyTerminationFeeType: TerminationFeeType;
  coolingOffDays: number;
  coolingOffEndDate: string;
  isWithinCoolingOff: boolean;
  status: ContractStatus;
  memberSignedAt?: string;
  staffApprovedBy?: UUID;
  cancellationRequestedAt?: string;
  cancellationEffectiveDate?: string;
  cancellationType?: CancellationType;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PLAN CHANGE TYPES
// ==========================================

export interface PlanChangePreview {
  subscriptionId: UUID;
  currentPlanId: UUID;
  currentPlanName: string;
  newPlanId: UUID;
  newPlanName: string;
  changeType: PlanChangeType;
  prorationMode: ProrationMode;
  effectiveDate: string;
  credit: number;
  charge: number;
  netAmount: number;
  currency: string;
  daysRemaining: number;
  summary: string;
}

export interface PlanChangeResult {
  subscriptionId: UUID;
  changeType: PlanChangeType;
  effectiveDate: string;
  wasImmediate: boolean;
  scheduledChangeId?: UUID;
  historyId?: UUID;
  netAmount?: number;
  currency?: string;
}

export interface ScheduledChange {
  id: UUID;
  subscriptionId: UUID;
  currentPlanId: UUID;
  newPlanId: UUID;
  changeType: PlanChangeType;
  scheduledDate: string;
  status: string;
  daysUntilChange: number;
}

// ==========================================
// CANCELLATION TYPES
// ==========================================

export interface RetentionOffer {
  id: UUID;
  offerType: RetentionOfferType;
  titleEn: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  valueAmount?: number;
  valueCurrency?: string;
  discountPercentage?: number;
  durationDays?: number;
  durationMonths?: number;
  alternativePlanId?: UUID;
  status: RetentionOfferStatus;
  expiresAt?: string;
  priority: number;
}

export interface CancellationPreview {
  subscriptionId: UUID;
  isWithinCoolingOff: boolean;
  coolingOffDaysRemaining: number;
  isWithinCommitment: boolean;
  commitmentMonthsRemaining: number;
  noticePeriodDays: number;
  noticePeriodEndDate: string;
  effectiveDate: string;
  earlyTerminationFee: number;
  earlyTerminationFeeCurrency: string;
  refundAmount?: number;
  retentionOffers: RetentionOffer[];
}

export interface CancellationResult {
  cancellationRequestId: UUID;
  subscriptionId: UUID;
  status: string;
  noticePeriodEndDate: string;
  effectiveDate: string;
  earlyTerminationFee?: number;
  earlyTerminationFeeCurrency?: string;
  feeWaived: boolean;
  retentionOffers: RetentionOffer[];
  wasImmediate: boolean;
}

export interface AcceptOfferResult {
  offerId: UUID;
  offerType: RetentionOfferType;
  memberSaved: boolean;
  message: string;
}

// ==========================================
// EXIT SURVEY TYPES
// ==========================================

export interface ExitSurveyRequest {
  reasonCategory: CancellationReasonCategory;
  reasonDetail?: string;
  feedback?: string;
  npsScore?: number;
  wouldRecommend?: boolean;
  overallSatisfaction?: number;
  dissatisfactionAreas?: string[];
  whatWouldBringBack?: string;
  openToFutureOffers?: boolean;
  competitorName?: string;
  competitorReason?: string;
}

export interface ExitSurvey {
  id: UUID;
  memberId: UUID;
  subscriptionId: UUID;
  reasonCategory: CancellationReasonCategory;
  reasonDetail?: string;
  feedback?: string;
  npsScore?: number;
  wouldRecommend?: boolean;
  overallSatisfaction?: number;
  dissatisfactionAreas?: string[];
  openToFutureOffers: boolean;
  createdAt: string;
}

// ==========================================
// REQUEST TYPES
// ==========================================

export interface PlanChangeRequest {
  newPlanId: UUID;
  preferredProrationMode?: ProrationMode;
  notes?: string;
}

export interface CancellationRequest {
  reasonCategory: CancellationReasonCategory;
  reasonDetail?: string;
}

export interface SignContractRequest {
  signatureData: string;
}

// ==========================================
// ADMIN CONTRACT TYPES
// ==========================================

export interface ContractListItem {
  id: UUID;
  contractNumber: string;
  memberId: UUID;
  memberName: string;
  memberEmail: string;
  planId: UUID;
  planName: string;
  contractType: ContractType;
  contractTerm: ContractTerm;
  status: ContractStatus;
  startDate: string;
  commitmentEndDate?: string;
  lockedMonthlyFee: number;
  lockedCurrency: string;
  isWithinCoolingOff: boolean;
  createdAt: string;
}

export interface ContractDetail extends MembershipContract {
  memberName: string;
  memberEmail: string;
  planName: string;
  categoryName?: string;
}

export interface PendingCancellation {
  id: UUID;
  memberId: UUID;
  memberName: string;
  memberEmail: string;
  subscriptionId: UUID;
  planName: string;
  requestedAt: string;
  noticePeriodEndDate: string;
  effectiveDate: string;
  reasonCategory: CancellationReasonCategory;
  reasonDetail?: string;
  earlyTerminationFee: number;
  earlyTerminationFeeCurrency: string;
  feeWaived: boolean;
  status: string;
  daysRemaining: number;
}

export interface CancellationAction {
  cancellationId: UUID;
  action: "WAIVE_FEE" | "SAVE_MEMBER" | "EXPEDITE" | "CANCEL";
  reason?: string;
  newEndDate?: string;
}

// ==========================================
// EXIT SURVEY ANALYTICS TYPES
// ==========================================

export interface ExitSurveyAnalytics {
  totalResponses: number;
  periodStart: string;
  periodEnd: string;
  reasonBreakdown: ReasonBreakdown[];
  npsDistribution: NpsDistribution;
  averageNps: number;
  satisfactionDistribution: SatisfactionDistribution;
  averageSatisfaction: number;
  wouldRecommendPercentage: number;
  openToFutureOffersPercentage: number;
  topDissatisfactionAreas: DissatisfactionArea[];
  competitorAnalysis: CompetitorAnalysis[];
  trendsOverTime: TrendData[];
}

export interface ReasonBreakdown {
  category: CancellationReasonCategory;
  count: number;
  percentage: number;
}

export interface NpsDistribution {
  promoters: number;    // 9-10
  passives: number;     // 7-8
  detractors: number;   // 0-6
}

export interface SatisfactionDistribution {
  veryDissatisfied: number;  // 1
  dissatisfied: number;      // 2
  neutral: number;           // 3
  satisfied: number;         // 4
  verySatisfied: number;     // 5
}

export interface DissatisfactionArea {
  area: string;
  count: number;
  percentage: number;
}

export interface CompetitorAnalysis {
  competitorName: string;
  count: number;
  topReasons: string[];
}

export interface TrendData {
  period: string;
  cancellations: number;
  savedMembers: number;
  retentionRate: number;
  averageNps: number;
}

// ==========================================
// MEMBERSHIP CATEGORY TYPES
// ==========================================

export type MembershipCategoryType =
  | "INDIVIDUAL"
  | "FAMILY"
  | "CORPORATE"
  | "STUDENT"
  | "SENIOR"
  | "MILITARY"
  | "STAFF"
  | "TRIAL"
  | "VIP";

export interface MembershipCategory {
  id: UUID;
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  categoryType: MembershipCategoryType;
  minimumAge?: number;
  maximumAge?: number;
  requiresVerification: boolean;
  verificationDocumentType?: string;
  maxFamilyMembers?: number;
  defaultDiscountPercentage: number;
  isActive: boolean;
  createdAt: string;
}

export interface CategoryUsageStats {
  categoryId: UUID;
  totalMembers: number;
  activeMembers: number;
  plansUsingCategory: number;
}

export interface LocalizedTextInput {
  en: string;
  ar?: string;
}

export interface CreateCategoryRequest {
  name: LocalizedTextInput;
  description?: LocalizedTextInput;
  categoryType: MembershipCategoryType;
  minimumAge?: number;
  maximumAge?: number;
  requiresVerification?: boolean;
  verificationDocumentType?: string;
  maxFamilyMembers?: number;
  defaultDiscountPercentage?: number;
}

export interface UpdateCategoryRequest {
  name?: LocalizedTextInput;
  description?: LocalizedTextInput;
  categoryType?: string;
  minimumAge?: number;
  maximumAge?: number;
  requiresVerification?: boolean;
  verificationDocumentType?: string;
  maxFamilyMembers?: number;
  defaultDiscountPercentage?: number;
}

// ==========================================
// CONTRACT PRICING TIER TYPES
// ==========================================

export interface ContractPricingTier {
  id: UUID;
  planId: UUID;
  planName: string;
  contractTerm: ContractTerm;
  discountPercentage: number;
  overrideMonthlyFeeAmount?: number;
  overrideMonthlyFeeCurrency?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePricingTierRequest {
  planId: UUID;
  contractTerm: ContractTerm;
  discountPercentage?: number;
  overrideMonthlyFeeAmount?: number;
}

// ==========================================
// ADMIN CONTRACT REQUEST TYPES
// ==========================================

export interface CreateContractRequest {
  memberId: UUID;
  planId: UUID;
  categoryId?: UUID;
  contractType: ContractType;
  contractTerm: ContractTerm;
  startDate: string;
  overrideMonthlyFee?: number;
  earlyTerminationFeeType?: TerminationFeeType;
  noticePeriodDays?: number;
}

export interface AdminContractsFilter {
  status?: ContractStatus;
  contractType?: ContractType;
  contractTerm?: ContractTerm;
  memberSearch?: string;
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  size?: number;
}
