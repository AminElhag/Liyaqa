// Contract types — match backend ContractResponse
export type ContractType = "SERVICE_AGREEMENT" | "SLA" | "DATA_PROCESSING" | "CUSTOM";
export type ContractStatus = "DRAFT" | "SENT" | "SIGNED" | "ACTIVE" | "EXPIRED" | "TERMINATED";

export interface ComplianceContract {
  id: string;
  tenantId: string;
  tenantName?: string;
  tenantNameAr?: string;
  contractNumber: string;
  type: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  value?: number;
  currency?: string;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ZATCA types — match backend ZatcaComplianceStatusResponse
export interface ZatcaOverview {
  totalInvoices: number;
  submittedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  failedCount: number;
  complianceRate: number;
  issuesByTenant: ZatcaTenantIssue[];
}

export interface ZatcaTenantIssue {
  tenantId: string;
  tenantName?: string;
  tenantNameAr?: string;
  rejectedCount: number;
  failedCount: number;
  pendingCount: number;
}

export type ZatcaSubmissionStatus = "PENDING" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "FAILED";

export interface ZatcaIssue {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName?: string;
  tenantNameAr?: string;
  status: ZatcaSubmissionStatus;
  responseMessage?: string;
  responseCode?: string;
  submittedAt?: string;
  createdAt: string;
}

export interface ZatcaMonthlyPoint {
  month: string;
  compliant: number;
  failed: number;
}

// Data request types — match backend DataExportRequestResponse
export type DataExportRequestStatus = "PENDING_APPROVAL" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "FAILED";

export interface DataRequest {
  id: string;
  tenantId: string;
  requestNumber: string;
  requesterName: string;
  requesterEmail: string;
  reason?: string;
  status: DataExportRequestStatus;
  completedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
