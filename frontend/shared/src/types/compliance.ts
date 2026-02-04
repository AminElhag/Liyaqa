import type { UUID } from "./api";

// ===== Enums matching backend =====

export type ComplianceStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "PARTIALLY_COMPLIANT";

export type ControlStatus =
  | "NOT_IMPLEMENTED"
  | "IN_PROGRESS"
  | "IMPLEMENTED"
  | "NOT_APPLICABLE";

export type EvidenceType =
  | "DOCUMENT"
  | "SCREENSHOT"
  | "LOG"
  | "REPORT"
  | "CERTIFICATE"
  | "AUDIT_TRAIL"
  | "CONFIGURATION"
  | "OTHER";

export type ReportFormat = "PDF" | "EXCEL" | "JSON";

export type ReportStatus = "DRAFT" | "FINAL" | "ARCHIVED";

// ===== Compliance Framework =====

export interface ComplianceFramework {
  id: UUID;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  version?: string;
  publishedDate?: string;
  certificationRequired: boolean;
  certificationValidityMonths?: number;
  regulatoryBody?: string;
  websiteUrl?: string;
  active: boolean;
  sortOrder?: number;
  createdAt: string;
}

// ===== Compliance Requirement =====

export interface ComplianceRequirement {
  id: UUID;
  frameworkId: UUID;
  frameworkCode?: string;
  requirementCode: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  category?: string;
  subcategory?: string;
  parentRequirementId?: UUID;
  mandatory: boolean;
  evidenceTypes?: EvidenceType[];
  implementationGuidance?: string;
  auditGuidance?: string;
  sortOrder?: number;
  active: boolean;
}

// ===== Organization Compliance Status =====

export interface OrganizationComplianceStatus {
  id: UUID;
  organizationId: UUID;
  frameworkId: UUID;
  frameworkCode?: string;
  frameworkName?: string;
  status: ComplianceStatus;
  complianceScore?: number;
  lastAssessmentDate?: string;
  nextReviewDate?: string;
  certificationDate?: string;
  certificationExpiryDate?: string;
  certificationReference?: string;
  auditorName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Control Implementation =====

export interface ControlImplementation {
  id: UUID;
  organizationId: UUID;
  requirementId: UUID;
  requirementCode?: string;
  requirementTitle?: string;
  status: ControlStatus;
  implementationNotes?: string;
  implementationDate?: string;
  reviewedBy?: UUID;
  reviewedAt?: string;
  nextReviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Compliance Evidence =====

export interface ComplianceEvidence {
  id: UUID;
  organizationId: UUID;
  requirementId: UUID;
  requirementCode?: string;
  title: string;
  description?: string;
  evidenceType: EvidenceType;
  filePath?: string;
  fileUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  collectionDate: string;
  expirationDate?: string;
  uploadedBy: UUID;
  uploadedByName?: string;
  verified: boolean;
  verifiedBy?: UUID;
  verifiedAt?: string;
  version?: string;
  tags?: string[];
  isExpired: boolean;
  createdAt: string;
}

// ===== Compliance Report =====

export interface ComplianceReport {
  id: UUID;
  organizationId: UUID;
  frameworkId: UUID;
  frameworkCode?: string;
  reportType: string;
  title: string;
  reportingPeriodStart?: string;
  reportingPeriodEnd?: string;
  generatedAt: string;
  generatedBy: UUID;
  generatedByName?: string;
  status: ReportStatus;
  format: ReportFormat;
  filePath?: string;
  fileUrl?: string;
  summary?: string;
  totalRequirements?: number;
  compliantCount?: number;
  nonCompliantCount?: number;
  inProgressCount?: number;
  notApplicableCount?: number;
  complianceScore?: number;
  createdAt: string;
}

// ===== Stats =====

export interface ComplianceStats {
  frameworkCode: string;
  totalRequirements: number;
  implementedCount: number;
  inProgressCount: number;
  notImplementedCount: number;
  notApplicableCount: number;
  compliancePercentage: number;
}

// ===== Request DTOs =====

export interface UpdateControlStatusRequest {
  status: ControlStatus;
  implementationNotes?: string;
  implementationDate?: string;
  nextReviewDate?: string;
}

export interface UploadEvidenceRequest {
  requirementId: UUID;
  title: string;
  description?: string;
  evidenceType: EvidenceType;
  collectionDate: string;
  expirationDate?: string;
  version?: string;
  tags?: string[];
}

export interface GenerateReportRequest {
  frameworkId: UUID;
  reportType?: string;
  title?: string;
  reportingPeriodStart?: string;
  reportingPeriodEnd?: string;
  format?: ReportFormat;
}

// ===== Query Params =====

export interface ComplianceFrameworkParams {
  active?: boolean;
  page?: number;
  size?: number;
}

export interface ComplianceRequirementParams {
  frameworkId?: UUID;
  frameworkCode?: string;
  category?: string;
  mandatory?: boolean;
  page?: number;
  size?: number;
}

export interface ControlImplementationParams {
  frameworkId?: UUID;
  status?: ControlStatus;
  page?: number;
  size?: number;
}

export interface ComplianceEvidenceParams {
  requirementId?: UUID;
  evidenceType?: EvidenceType;
  verified?: boolean;
  expired?: boolean;
  page?: number;
  size?: number;
}

export interface ComplianceReportParams {
  frameworkId?: UUID;
  status?: ReportStatus;
  page?: number;
  size?: number;
}
