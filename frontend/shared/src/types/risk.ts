import type { UUID } from "./api";

// ===== Enums matching backend =====

export type RiskAssessmentStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "APPROVED"
  | "ARCHIVED";

export type RiskCategory =
  | "STRATEGIC"
  | "OPERATIONAL"
  | "FINANCIAL"
  | "COMPLIANCE"
  | "TECHNOLOGY"
  | "SECURITY"
  | "PRIVACY"
  | "REPUTATIONAL"
  | "PHYSICAL"
  | "ENVIRONMENTAL";

export type RiskLikelihood =
  | "RARE"
  | "UNLIKELY"
  | "POSSIBLE"
  | "LIKELY"
  | "ALMOST_CERTAIN";

export type RiskImpact =
  | "INSIGNIFICANT"
  | "MINOR"
  | "MODERATE"
  | "MAJOR"
  | "CATASTROPHIC";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskTreatment =
  | "ACCEPT"
  | "MITIGATE"
  | "TRANSFER"
  | "AVOID";

export type TreatmentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "OVERDUE";

// ===== Risk Assessment =====

export interface RiskAssessment {
  id: UUID;
  organizationId: UUID;
  title: string;
  description?: string;
  assessmentDate: string;
  status: RiskAssessmentStatus;
  scope?: string;
  methodology?: string;
  assessorId?: UUID;
  approvedBy?: UUID;
  approvedAt?: string;
  totalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  nextReviewDate?: string;
  createdAt: string;
}

// ===== Identified Risk =====

export interface IdentifiedRisk {
  id: UUID;
  assessmentId: UUID;
  riskNumber: string;
  title: string;
  description?: string;
  category?: RiskCategory;
  assetAffected?: string;
  threatSource?: string;
  vulnerability?: string;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  inherentRiskScore: number;
  inherentRiskLevel: RiskLevel;
  existingControls?: string;
  treatmentOption: RiskTreatment;
  treatmentPlan?: string;
  treatmentOwnerId?: UUID;
  treatmentDueDate?: string;
  treatmentStatus: TreatmentStatus;
  residualLikelihood?: RiskLikelihood;
  residualImpact?: RiskImpact;
  residualRiskScore?: number;
  residualRiskLevel?: RiskLevel;
  relatedRequirementIds?: UUID[];
  createdAt: string;
}

// ===== Stats =====

export interface RiskStats {
  totalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  byCategory: Record<RiskCategory, number>;
  byTreatmentStatus: Record<TreatmentStatus, number>;
  averageRiskScore: number;
  overdueTreatments: number;
}

// ===== Request DTOs =====

export interface CreateAssessmentRequest {
  title: string;
  description?: string;
  assessmentDate?: string;
  scope?: string;
  methodology?: string;
  nextReviewDate?: string;
}

export interface AddRiskRequest {
  riskNumber: string;
  title: string;
  description?: string;
  category?: RiskCategory;
  assetAffected?: string;
  threatSource?: string;
  vulnerability?: string;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  existingControls?: string;
  treatmentOption: RiskTreatment;
  treatmentPlan?: string;
  treatmentOwnerId?: UUID;
  treatmentDueDate?: string;
  relatedRequirementIds?: UUID[];
}

export interface UpdateRiskRequest {
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  treatmentOption?: RiskTreatment;
  treatmentPlan?: string;
}

export interface CompleteTreatmentRequest {
  residualLikelihood?: RiskLikelihood;
  residualImpact?: RiskImpact;
}

// ===== Query Params =====

export interface RiskAssessmentParams {
  status?: RiskAssessmentStatus;
  page?: number;
  size?: number;
}

export interface IdentifiedRiskParams {
  assessmentId?: UUID;
  category?: RiskCategory;
  riskLevel?: RiskLevel;
  treatmentStatus?: TreatmentStatus;
  page?: number;
  size?: number;
}
