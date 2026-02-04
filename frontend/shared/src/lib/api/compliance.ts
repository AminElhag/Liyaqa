import { api } from "./client";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  ComplianceFramework,
  ComplianceRequirement,
  OrganizationComplianceStatus,
  ControlImplementation,
  ComplianceEvidence,
  ComplianceReport,
  ComplianceStats,
  ComplianceFrameworkParams,
  ComplianceRequirementParams,
  ControlImplementationParams,
  ComplianceEvidenceParams,
  ComplianceReportParams,
  UpdateControlStatusRequest,
  UploadEvidenceRequest,
  GenerateReportRequest,
} from "../types/compliance";

const BASE_URL = "api/compliance";

// ===== Frameworks =====

export async function getFrameworks(
  params: ComplianceFrameworkParams = {}
): Promise<ComplianceFramework[]> {
  const searchParams = new URLSearchParams();
  if (params.active !== undefined) searchParams.set("active", String(params.active));
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/frameworks?${query}` : `${BASE_URL}/frameworks`;
  return api.get(url).json();
}

export async function getFrameworkByCode(code: string): Promise<ComplianceFramework> {
  return api.get(`${BASE_URL}/frameworks/${code}`).json();
}

// ===== Requirements =====

export async function getRequirements(
  params: ComplianceRequirementParams = {}
): Promise<PaginatedResponse<ComplianceRequirement>> {
  const searchParams = new URLSearchParams();
  if (params.frameworkId) searchParams.set("frameworkId", params.frameworkId);
  if (params.frameworkCode) searchParams.set("frameworkCode", params.frameworkCode);
  if (params.category) searchParams.set("category", params.category);
  if (params.mandatory !== undefined) searchParams.set("mandatory", String(params.mandatory));
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/requirements?${query}` : `${BASE_URL}/requirements`;
  return api.get(url).json();
}

export async function getRequirementsByFramework(
  frameworkCode: string
): Promise<ComplianceRequirement[]> {
  return api.get(`${BASE_URL}/frameworks/${frameworkCode}/requirements`).json();
}

export async function getRequirement(id: UUID): Promise<ComplianceRequirement> {
  return api.get(`${BASE_URL}/requirements/${id}`).json();
}

// ===== Organization Compliance Status =====

export async function getOrganizationComplianceStatus(): Promise<OrganizationComplianceStatus[]> {
  return api.get(`${BASE_URL}/status`).json();
}

export async function getFrameworkComplianceStatus(
  frameworkCode: string
): Promise<OrganizationComplianceStatus> {
  return api.get(`${BASE_URL}/status/${frameworkCode}`).json();
}

export async function initializeCompliance(frameworkId: UUID): Promise<OrganizationComplianceStatus> {
  return api.post(`${BASE_URL}/status/initialize`, { json: { frameworkId } }).json();
}

// ===== Control Implementations =====

export async function getControlImplementations(
  params: ControlImplementationParams = {}
): Promise<PaginatedResponse<ControlImplementation>> {
  const searchParams = new URLSearchParams();
  if (params.frameworkId) searchParams.set("frameworkId", params.frameworkId);
  if (params.status) searchParams.set("status", params.status);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/controls?${query}` : `${BASE_URL}/controls`;
  return api.get(url).json();
}

export async function getControlsByFramework(
  frameworkCode: string
): Promise<ControlImplementation[]> {
  return api.get(`${BASE_URL}/frameworks/${frameworkCode}/controls`).json();
}

export async function getControlImplementation(id: UUID): Promise<ControlImplementation> {
  return api.get(`${BASE_URL}/controls/${id}`).json();
}

export async function updateControlStatus(
  id: UUID,
  request: UpdateControlStatusRequest
): Promise<ControlImplementation> {
  return api.put(`${BASE_URL}/controls/${id}`, { json: request }).json();
}

export async function getComplianceStats(frameworkCode: string): Promise<ComplianceStats> {
  return api.get(`${BASE_URL}/frameworks/${frameworkCode}/stats`).json();
}

// ===== Evidence =====

export async function getEvidence(
  params: ComplianceEvidenceParams = {}
): Promise<PaginatedResponse<ComplianceEvidence>> {
  const searchParams = new URLSearchParams();
  if (params.requirementId) searchParams.set("requirementId", params.requirementId);
  if (params.evidenceType) searchParams.set("evidenceType", params.evidenceType);
  if (params.verified !== undefined) searchParams.set("verified", String(params.verified));
  if (params.expired !== undefined) searchParams.set("expired", String(params.expired));
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/evidence?${query}` : `${BASE_URL}/evidence`;
  return api.get(url).json();
}

export async function getEvidenceByRequirement(requirementId: UUID): Promise<ComplianceEvidence[]> {
  return api.get(`${BASE_URL}/requirements/${requirementId}/evidence`).json();
}

export async function getEvidenceById(id: UUID): Promise<ComplianceEvidence> {
  return api.get(`${BASE_URL}/evidence/${id}`).json();
}

export async function uploadEvidence(
  request: UploadEvidenceRequest,
  file: File
): Promise<ComplianceEvidence> {
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(request).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return api.post(`${BASE_URL}/evidence`, { body: formData }).json();
}

export async function verifyEvidence(id: UUID): Promise<ComplianceEvidence> {
  return api.post(`${BASE_URL}/evidence/${id}/verify`).json();
}

export async function deleteEvidence(id: UUID): Promise<void> {
  await api.delete(`${BASE_URL}/evidence/${id}`);
}

// ===== Reports =====

export async function getReports(
  params: ComplianceReportParams = {}
): Promise<PaginatedResponse<ComplianceReport>> {
  const searchParams = new URLSearchParams();
  if (params.frameworkId) searchParams.set("frameworkId", params.frameworkId);
  if (params.status) searchParams.set("status", params.status);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/reports?${query}` : `${BASE_URL}/reports`;
  return api.get(url).json();
}

export async function getReport(id: UUID): Promise<ComplianceReport> {
  return api.get(`${BASE_URL}/reports/${id}`).json();
}

export async function generateReport(request: GenerateReportRequest): Promise<ComplianceReport> {
  return api.post(`${BASE_URL}/reports/generate`, { json: request }).json();
}

export async function finalizeReport(id: UUID): Promise<ComplianceReport> {
  return api.post(`${BASE_URL}/reports/${id}/finalize`).json();
}

export async function downloadReport(id: UUID): Promise<Blob> {
  return api.get(`${BASE_URL}/reports/${id}/download`).blob();
}
