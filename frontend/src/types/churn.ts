import type { UUID } from "./api";

// Enums
export type ChurnAlgorithm = "RANDOM_FOREST" | "GRADIENT_BOOST" | "NEURAL_NET" | "LOGISTIC_REGRESSION" | "XG_BOOST";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type InterventionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "IGNORED";
export type ChurnOutcome = "CHURNED" | "RETAINED" | "UNKNOWN";
export type InterventionType = "PERSONAL_CALL" | "DISCOUNT_OFFER" | "FREE_PT_SESSION" | "EMAIL_CAMPAIGN" | "SMS_REMINDER" | "GIFT_VOUCHER" | "FREEZE_OFFER" | "PLAN_UPGRADE" | "RETENTION_MEETING";
export type InterventionOutcome = "SUCCESS" | "PARTIAL" | "FAILED" | "CANCELLED";

// ========== Request Types ==========

export interface GeneratePredictionsRequest {
  memberIds?: UUID[];
  validityDays?: number;
}

export interface CreateInterventionRequest {
  predictionId: UUID;
  interventionType: InterventionType;
  templateId?: UUID;
  description?: string;
  descriptionAr?: string;
  assignedTo?: UUID;
  scheduledAt?: string;
}

export interface RecordOutcomeRequest {
  outcome: ChurnOutcome;
}

export interface RecordInterventionOutcomeRequest {
  outcome: InterventionOutcome;
  notes?: string;
}

export interface CreateInterventionTemplateRequest {
  name: string;
  nameAr?: string;
  interventionType: InterventionType;
  description?: string;
  descriptionAr?: string;
  messageTemplate?: string;
  messageTemplateAr?: string;
  offerDetails?: Record<string, unknown>;
  targetRiskLevels?: RiskLevel[];
}

// ========== Response Types ==========

export interface ChurnModel {
  id: UUID;
  modelVersion: string;
  algorithm: ChurnAlgorithm;
  accuracy: number | null;
  precisionScore: number | null;
  recallScore: number | null;
  f1Score: number | null;
  aucScore: number | null;
  featureWeights: Record<string, number> | null;
  trainingSamples: number | null;
  trainedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  description: string;
  descriptionAr?: string;
}

export interface RecommendedIntervention {
  type: string;
  priority: number;
}

export interface MemberChurnPrediction {
  id: UUID;
  memberId: UUID;
  modelId: UUID;
  churnScore: number;
  riskLevel: RiskLevel;
  topRiskFactors: RiskFactor[] | null;
  recommendedInterventions: RecommendedIntervention[] | null;
  predictionDate: string;
  validUntil: string | null;
  interventionStatus: InterventionStatus;
  actualOutcome: ChurnOutcome | null;
  outcomeDate: string | null;
  isExpired: boolean;
  createdAt: string;
}

export interface ChurnIntervention {
  id: UUID;
  predictionId: UUID;
  memberId: UUID;
  interventionType: InterventionType;
  templateId: UUID | null;
  description: string | null;
  descriptionAr: string | null;
  assignedTo: UUID | null;
  scheduledAt: string | null;
  executedAt: string | null;
  outcome: InterventionOutcome | null;
  outcomeNotes: string | null;
  createdBy: UUID | null;
  isPending: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InterventionTemplate {
  id: UUID;
  name: string;
  nameAr: string | null;
  interventionType: InterventionType;
  description: string | null;
  descriptionAr: string | null;
  messageTemplate: string | null;
  messageTemplateAr: string | null;
  offerDetails: Record<string, unknown> | null;
  targetRiskLevels: RiskLevel[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
  total: number;
}

// Labels
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "Low Risk",
  MEDIUM: "Medium Risk",
  HIGH: "High Risk",
  CRITICAL: "Critical Risk",
};

export const RISK_LEVEL_LABELS_AR: Record<RiskLevel, string> = {
  LOW: "خطر منخفض",
  MEDIUM: "خطر متوسط",
  HIGH: "خطر عالي",
  CRITICAL: "خطر حرج",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-success text-white",
  MEDIUM: "bg-warning text-white",
  HIGH: "bg-orange-500 text-white",
  CRITICAL: "bg-destructive text-white",
};

export const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
  PERSONAL_CALL: "Personal Call",
  DISCOUNT_OFFER: "Discount Offer",
  FREE_PT_SESSION: "Free PT Session",
  EMAIL_CAMPAIGN: "Email Campaign",
  SMS_REMINDER: "SMS Reminder",
  GIFT_VOUCHER: "Gift Voucher",
  FREEZE_OFFER: "Freeze Offer",
  PLAN_UPGRADE: "Plan Upgrade",
  RETENTION_MEETING: "Retention Meeting",
};

export const INTERVENTION_TYPE_LABELS_AR: Record<InterventionType, string> = {
  PERSONAL_CALL: "مكالمة شخصية",
  DISCOUNT_OFFER: "عرض خصم",
  FREE_PT_SESSION: "جلسة تدريب مجانية",
  EMAIL_CAMPAIGN: "حملة بريد إلكتروني",
  SMS_REMINDER: "تذكير SMS",
  GIFT_VOUCHER: "قسيمة هدية",
  FREEZE_OFFER: "عرض تجميد",
  PLAN_UPGRADE: "ترقية الخطة",
  RETENTION_MEETING: "اجتماع احتفاظ",
};

export const INTERVENTION_STATUS_LABELS: Record<InterventionStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  IGNORED: "Ignored",
};

export const INTERVENTION_STATUS_LABELS_AR: Record<InterventionStatus, string> = {
  PENDING: "في الانتظار",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  IGNORED: "تم التجاهل",
};

export const OUTCOME_LABELS: Record<InterventionOutcome, string> = {
  SUCCESS: "Success",
  PARTIAL: "Partial",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const OUTCOME_LABELS_AR: Record<InterventionOutcome, string> = {
  SUCCESS: "نجاح",
  PARTIAL: "جزئي",
  FAILED: "فشل",
  CANCELLED: "ملغي",
};
