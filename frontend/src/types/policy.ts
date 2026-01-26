import type { UUID } from "./api";

// ===== Enums matching backend =====

export type PolicyType =
  | "INFORMATION_SECURITY"
  | "DATA_PROTECTION"
  | "ACCESS_CONTROL"
  | "INCIDENT_RESPONSE"
  | "BUSINESS_CONTINUITY"
  | "ACCEPTABLE_USE"
  | "DATA_RETENTION"
  | "PRIVACY"
  | "VENDOR_MANAGEMENT"
  | "CHANGE_MANAGEMENT"
  | "RISK_MANAGEMENT"
  | "ASSET_MANAGEMENT"
  | "CRYPTOGRAPHY"
  | "PHYSICAL_SECURITY"
  | "HR_SECURITY"
  | "NETWORK_SECURITY"
  | "APPLICATION_SECURITY"
  | "MOBILE_DEVICE"
  | "REMOTE_WORK"
  | "SOCIAL_MEDIA";

export type PolicyStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED";

export type AcknowledgementMethod =
  | "ELECTRONIC_SIGNATURE"
  | "CHECKBOX"
  | "EMAIL_CONFIRMATION"
  | "PHYSICAL_SIGNATURE";

// ===== Security Policy =====

export interface SecurityPolicy {
  id: UUID;
  organizationId: UUID;
  policyType: PolicyType;
  title: string;
  titleAr?: string;
  content?: string;
  contentAr?: string;
  version: string;
  status: PolicyStatus;
  effectiveDate?: string;
  reviewDate?: string;
  nextReviewDate?: string;
  ownerId?: UUID;
  approvedBy?: UUID;
  approvedAt?: string;
  acknowledgementRequired: boolean;
  relatedFrameworkIds?: UUID[];
  documentPath?: string;
  isReviewDue: boolean;
  isActive: boolean;
  createdAt: string;
}

// ===== Policy Acknowledgement =====

export interface PolicyAcknowledgement {
  id: UUID;
  policyId: UUID;
  userId: UUID;
  acknowledgedAt: string;
  method: AcknowledgementMethod;
  policyVersion: string;
}

// ===== Request DTOs =====

export interface CreatePolicyRequest {
  policyType: PolicyType;
  title: string;
  titleAr?: string;
  content?: string;
  contentAr?: string;
  version?: string;
  acknowledgementRequired?: boolean;
  relatedFrameworkIds?: UUID[];
}

export interface UpdatePolicyRequest {
  title?: string;
  titleAr?: string;
  content?: string;
  contentAr?: string;
}

export interface AcknowledgePolicyRequest {
  method: AcknowledgementMethod;
}

// ===== Query Params =====

export interface PolicyParams {
  policyType?: PolicyType;
  status?: PolicyStatus;
  page?: number;
  size?: number;
}

// ===== Display Helpers =====

export const policyTypeLabels: Record<PolicyType, string> = {
  INFORMATION_SECURITY: "Information Security Policy",
  DATA_PROTECTION: "Data Protection Policy",
  ACCESS_CONTROL: "Access Control Policy",
  INCIDENT_RESPONSE: "Incident Response Policy",
  BUSINESS_CONTINUITY: "Business Continuity Policy",
  ACCEPTABLE_USE: "Acceptable Use Policy",
  DATA_RETENTION: "Data Retention Policy",
  PRIVACY: "Privacy Policy",
  VENDOR_MANAGEMENT: "Vendor Management Policy",
  CHANGE_MANAGEMENT: "Change Management Policy",
  RISK_MANAGEMENT: "Risk Management Policy",
  ASSET_MANAGEMENT: "Asset Management Policy",
  CRYPTOGRAPHY: "Cryptography Policy",
  PHYSICAL_SECURITY: "Physical Security Policy",
  HR_SECURITY: "HR Security Policy",
  NETWORK_SECURITY: "Network Security Policy",
  APPLICATION_SECURITY: "Application Security Policy",
  MOBILE_DEVICE: "Mobile Device Policy",
  REMOTE_WORK: "Remote Work Policy",
  SOCIAL_MEDIA: "Social Media Policy",
};

export const policyStatusLabels: Record<PolicyStatus, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};
