import type { UUID, LocalizedText } from "./api";

// Agreement Types
export type AgreementType =
  | "LIABILITY_WAIVER"
  | "TERMS_CONDITIONS"
  | "HEALTH_DISCLOSURE"
  | "PRIVACY_POLICY"
  | "PHOTO_CONSENT"
  | "MARKETING_CONSENT"
  | "RULES_REGULATIONS"
  | "CUSTOM";

// Agreement entity
export interface Agreement {
  id: UUID;
  title: LocalizedText;
  content: LocalizedText;
  type: AgreementType;
  isMandatory: boolean;
  isActive: boolean;
  // Backend may serialize as "active"/"mandatory" due to Kotlin boolean naming (JavaBeans convention)
  active?: boolean;
  mandatory?: boolean;
  agreementVersion: number;
  effectiveDate: string;
  sortOrder: number;
  hasHealthQuestions: boolean;
  createdAt: string;
  updatedAt: string;
}

// Alias for backwards compatibility
export type { Agreement as AgreementResponse };

// Signed agreement record
export interface MemberAgreement {
  id: UUID;
  memberId: UUID;
  agreementId: UUID;
  agreementVersion: number;
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
  signatureData?: string;
  healthData?: string;
  createdAt: string;
}

// Request DTOs
export interface CreateAgreementRequest {
  title: { en: string; ar?: string };
  content: { en: string; ar?: string };
  type: AgreementType;
  isMandatory?: boolean;
  hasHealthQuestions?: boolean;
  sortOrder?: number;
}

export interface UpdateAgreementRequest {
  title?: { en: string; ar?: string };
  content?: { en: string; ar?: string };
  type?: AgreementType;
  isMandatory?: boolean;
  hasHealthQuestions?: boolean;
  sortOrder?: number;
}

export interface SignAgreementRequest {
  signatureData?: string;
}

// Query parameters
export interface AgreementQueryParams {
  type?: AgreementType;
  active?: boolean;
  mandatory?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

// Response DTOs
export interface MemberAgreementStatus {
  memberId: UUID;
  signedAgreements: MemberAgreement[];
  pendingMandatoryAgreements: Agreement[];
  allMandatorySigned: boolean;
}
