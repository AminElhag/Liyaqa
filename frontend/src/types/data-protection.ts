import type { UUID } from "./api";

// ===== Enums matching backend =====

export type LegalBasis =
  | "CONSENT"
  | "CONTRACT"
  | "LEGAL_OBLIGATION"
  | "VITAL_INTERESTS"
  | "PUBLIC_INTEREST"
  | "LEGITIMATE_INTERESTS";

export type ProcessingActivityStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type ConsentType =
  | "MARKETING"
  | "PROFILING"
  | "THIRD_PARTY_SHARING"
  | "CROSS_BORDER_TRANSFER"
  | "SENSITIVE_DATA"
  | "TERMS_OF_SERVICE"
  | "PRIVACY_POLICY"
  | "BIOMETRIC_DATA"
  | "HEALTH_DATA";

export type ConsentMethod =
  | "EXPLICIT_WRITTEN"
  | "EXPLICIT_ELECTRONIC"
  | "EXPLICIT_VERBAL"
  | "IMPLICIT"
  | "OPT_IN"
  | "OPT_OUT";

export type DataSubjectRequestType =
  | "ACCESS"
  | "RECTIFICATION"
  | "ERASURE"
  | "RESTRICTION"
  | "PORTABILITY"
  | "OBJECTION"
  | "AUTOMATED_DECISION_OPT_OUT";

export type DSRStatus =
  | "RECEIVED"
  | "IDENTITY_VERIFICATION"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type DSRPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type VerificationMethod =
  | "ID_DOCUMENT"
  | "EMAIL_VERIFICATION"
  | "SMS_VERIFICATION"
  | "KNOWLEDGE_BASED"
  | "IN_PERSON";

export type ResponseMethod =
  | "EMAIL"
  | "PORTAL"
  | "POSTAL"
  | "IN_PERSON"
  | "SECURE_DOWNLOAD";

export type BreachType =
  | "CONFIDENTIALITY"
  | "INTEGRITY"
  | "AVAILABILITY"
  | "COMBINED";

export type BreachSource =
  | "EXTERNAL_ATTACK"
  | "INTERNAL_ACTOR"
  | "SYSTEM_ERROR"
  | "HUMAN_ERROR"
  | "THIRD_PARTY"
  | "PHYSICAL"
  | "UNKNOWN";

export type BreachStatus =
  | "REPORTED"
  | "INVESTIGATING"
  | "CONTAINED"
  | "RESOLVED"
  | "CLOSED";

export type SecuritySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// ===== Data Processing Activity =====

export interface DataProcessingActivity {
  id: UUID;
  activityName: string;
  activityNameAr?: string;
  description?: string;
  purpose: string;
  purposeAr?: string;
  legalBasis: LegalBasis;
  dataCategories: string[];
  dataSubjects: string[];
  recipients?: string[];
  retentionPeriodDays?: number;
  crossBorderTransfer: boolean;
  transferCountry?: string;
  automatedDecisionMaking: boolean;
  profiling: boolean;
  privacyImpactRequired: boolean;
  privacyImpactCompleted: boolean;
  status: ProcessingActivityStatus;
  ownerId?: UUID;
  nextReviewDate?: string;
  createdAt: string;
}

// ===== Consent Record =====

export interface ConsentRecord {
  id: UUID;
  memberId?: UUID;
  leadId?: UUID;
  consentType: ConsentType;
  purpose: string;
  purposeAr?: string;
  version: string;
  consentGiven: boolean;
  consentMethod: ConsentMethod;
  givenAt?: string;
  expiresAt?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  isValid: boolean;
  createdAt: string;
}

// ===== Data Subject Request =====

export interface DataSubjectRequest {
  id: UUID;
  requestNumber: string;
  memberId?: UUID;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requestType: DataSubjectRequestType;
  description?: string;
  identityVerified: boolean;
  verificationMethod?: VerificationMethod;
  status: DSRStatus;
  priority: DSRPriority;
  assignedToUserId?: UUID;
  receivedAt: string;
  dueDate: string;
  extendedDueDate?: string;
  extensionReason?: string;
  completedAt?: string;
  rejectionReason?: string;
  responseMethod?: ResponseMethod;
  isOverdue: boolean;
  daysUntilDue: number;
  createdAt: string;
}

// ===== Data Breach =====

export interface DataBreach {
  id: UUID;
  breachNumber: string;
  title: string;
  description?: string;
  discoveredAt: string;
  occurredAt?: string;
  containedAt?: string;
  resolvedAt?: string;
  breachType: BreachType;
  breachSource?: BreachSource;
  affectedDataTypes?: string[];
  affectedRecordsCount?: number;
  affectedMembersCount?: number;
  severity: SecuritySeverity;
  status: BreachStatus;
  leadInvestigatorId?: UUID;
  rootCause?: string;
  sdaiaNotificationRequired: boolean;
  sdaiaNotifiedAt?: string;
  sdaiaNotificationDeadline?: string;
  individualsNotificationRequired: boolean;
  individualsNotifiedAt?: string;
  isSdaiaOverdue: boolean;
  createdAt: string;
}

// ===== Stats =====

export interface DataProtectionStats {
  totalActivities: number;
  activeActivities: number;
  crossBorderTransfers: number;
  automatedProcessing: number;
  pendingPrivacyImpact: number;
}

export interface DSRStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  overdueRequests: number;
  averageCompletionDays: number;
  requestsByType: Record<DataSubjectRequestType, number>;
}

export interface BreachStats {
  totalBreaches: number;
  openBreaches: number;
  resolvedBreaches: number;
  criticalBreaches: number;
  averageResolutionDays: number;
  sdaiaPendingNotification: number;
}

// ===== Request DTOs =====

export interface CreateActivityRequest {
  activityName: string;
  activityNameAr?: string;
  description?: string;
  purpose: string;
  purposeAr?: string;
  legalBasis: LegalBasis;
  dataCategories: string[];
  dataSubjects: string[];
  recipients?: string[];
  retentionPeriodDays?: number;
  retentionJustification?: string;
  crossBorderTransfer?: boolean;
  transferCountry?: string;
  transferSafeguards?: string;
  securityMeasures?: string;
  automatedDecisionMaking?: boolean;
  profiling?: boolean;
  ownerId?: UUID;
}

export interface RecordConsentRequest {
  memberId?: UUID;
  leadId?: UUID;
  consentType: ConsentType;
  purpose: string;
  purposeAr?: string;
  consentGiven: boolean;
  consentMethod: ConsentMethod;
  consentText?: string;
  expiresAt?: string;
}

export interface WithdrawConsentRequest {
  reason?: string;
}

export interface CreateDSRRequest {
  memberId?: UUID;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requestType: DataSubjectRequestType;
  description?: string;
  priority?: DSRPriority;
}

export interface VerifyIdentityRequest {
  method: VerificationMethod;
}

export interface CompleteDSRRequest {
  responseMethod: ResponseMethod;
  dataExportPath?: string;
}

export interface ExtendDSRRequest {
  newDueDate: string;
  reason: string;
}

export interface ReportBreachRequest {
  title: string;
  description?: string;
  discoveredAt: string;
  occurredAt?: string;
  breachType: BreachType;
  breachSource?: BreachSource;
  affectedDataTypes?: string[];
  affectedRecordsCount?: number;
  affectedMembersCount?: number;
  severity: SecuritySeverity;
}

export interface ResolveBreachRequest {
  rootCause: string;
  remediation: string;
}

// ===== Query Params =====

export interface DataProcessingActivityParams {
  status?: ProcessingActivityStatus;
  page?: number;
  size?: number;
}

export interface ConsentParams {
  consentType?: ConsentType;
  memberId?: UUID;
  page?: number;
  size?: number;
}

export interface DSRParams {
  status?: DSRStatus;
  requestType?: DataSubjectRequestType;
  priority?: DSRPriority;
  page?: number;
  size?: number;
}

export interface BreachParams {
  status?: BreachStatus;
  severity?: SecuritySeverity;
  page?: number;
  size?: number;
}
