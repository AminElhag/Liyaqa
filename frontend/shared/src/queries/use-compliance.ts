"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFrameworks,
  getFrameworkByCode,
  getRequirements,
  getRequirementsByFramework,
  getRequirement,
  getOrganizationComplianceStatus,
  getFrameworkComplianceStatus,
  initializeCompliance,
  getControlImplementations,
  getControlsByFramework,
  getControlImplementation,
  updateControlStatus,
  getComplianceStats,
  getEvidence,
  getEvidenceByRequirement,
  getEvidenceById,
  uploadEvidence,
  verifyEvidence,
  deleteEvidence,
  getReports,
  getReport,
  generateReport,
  finalizeReport,
} from "../lib/api/compliance";
import type { UUID } from "../types/api";
import type {
  ComplianceFrameworkParams,
  ComplianceRequirementParams,
  ControlImplementationParams,
  ComplianceEvidenceParams,
  ComplianceReportParams,
  UpdateControlStatusRequest,
  UploadEvidenceRequest,
  GenerateReportRequest,
} from "../types/compliance";

// ===== Query Keys =====

export const complianceKeys = {
  all: ["compliance"] as const,
  frameworks: () => [...complianceKeys.all, "frameworks"] as const,
  frameworksList: (params: ComplianceFrameworkParams) =>
    [...complianceKeys.frameworks(), "list", params] as const,
  frameworkDetail: (code: string) =>
    [...complianceKeys.frameworks(), "detail", code] as const,
  requirements: () => [...complianceKeys.all, "requirements"] as const,
  requirementsList: (params: ComplianceRequirementParams) =>
    [...complianceKeys.requirements(), "list", params] as const,
  requirementsByFramework: (frameworkCode: string) =>
    [...complianceKeys.requirements(), "framework", frameworkCode] as const,
  requirementDetail: (id: UUID) =>
    [...complianceKeys.requirements(), "detail", id] as const,
  status: () => [...complianceKeys.all, "status"] as const,
  statusList: () => [...complianceKeys.status(), "list"] as const,
  statusByFramework: (code: string) =>
    [...complianceKeys.status(), "framework", code] as const,
  controls: () => [...complianceKeys.all, "controls"] as const,
  controlsList: (params: ControlImplementationParams) =>
    [...complianceKeys.controls(), "list", params] as const,
  controlsByFramework: (frameworkCode: string) =>
    [...complianceKeys.controls(), "framework", frameworkCode] as const,
  controlDetail: (id: UUID) =>
    [...complianceKeys.controls(), "detail", id] as const,
  stats: (frameworkCode: string) =>
    [...complianceKeys.all, "stats", frameworkCode] as const,
  evidence: () => [...complianceKeys.all, "evidence"] as const,
  evidenceList: (params: ComplianceEvidenceParams) =>
    [...complianceKeys.evidence(), "list", params] as const,
  evidenceByRequirement: (requirementId: UUID) =>
    [...complianceKeys.evidence(), "requirement", requirementId] as const,
  evidenceDetail: (id: UUID) =>
    [...complianceKeys.evidence(), "detail", id] as const,
  reports: () => [...complianceKeys.all, "reports"] as const,
  reportsList: (params: ComplianceReportParams) =>
    [...complianceKeys.reports(), "list", params] as const,
  reportDetail: (id: UUID) =>
    [...complianceKeys.reports(), "detail", id] as const,
};

// ===== Framework Hooks =====

export function useComplianceFrameworks(params: ComplianceFrameworkParams = {}) {
  return useQuery({
    queryKey: complianceKeys.frameworksList(params),
    queryFn: () => getFrameworks(params),
  });
}

export function useComplianceFramework(code: string) {
  return useQuery({
    queryKey: complianceKeys.frameworkDetail(code),
    queryFn: () => getFrameworkByCode(code),
    enabled: !!code,
  });
}

// ===== Requirement Hooks =====

export function useComplianceRequirements(params: ComplianceRequirementParams = {}) {
  return useQuery({
    queryKey: complianceKeys.requirementsList(params),
    queryFn: () => getRequirements(params),
  });
}

export function useRequirementsByFramework(frameworkCode: string) {
  return useQuery({
    queryKey: complianceKeys.requirementsByFramework(frameworkCode),
    queryFn: () => getRequirementsByFramework(frameworkCode),
    enabled: !!frameworkCode,
  });
}

export function useComplianceRequirement(id: UUID) {
  return useQuery({
    queryKey: complianceKeys.requirementDetail(id),
    queryFn: () => getRequirement(id),
    enabled: !!id,
  });
}

// ===== Status Hooks =====

export function useOrganizationComplianceStatus() {
  return useQuery({
    queryKey: complianceKeys.statusList(),
    queryFn: () => getOrganizationComplianceStatus(),
  });
}

export function useFrameworkComplianceStatus(frameworkCode: string) {
  return useQuery({
    queryKey: complianceKeys.statusByFramework(frameworkCode),
    queryFn: () => getFrameworkComplianceStatus(frameworkCode),
    enabled: !!frameworkCode,
  });
}

export function useInitializeCompliance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (frameworkId: UUID) => initializeCompliance(frameworkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.status() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.controls() });
    },
  });
}

// ===== Control Hooks =====

export function useControlImplementations(params: ControlImplementationParams = {}) {
  return useQuery({
    queryKey: complianceKeys.controlsList(params),
    queryFn: () => getControlImplementations(params),
  });
}

export function useControlsByFramework(frameworkCode: string) {
  return useQuery({
    queryKey: complianceKeys.controlsByFramework(frameworkCode),
    queryFn: () => getControlsByFramework(frameworkCode),
    enabled: !!frameworkCode,
  });
}

export function useControlImplementation(id: UUID) {
  return useQuery({
    queryKey: complianceKeys.controlDetail(id),
    queryFn: () => getControlImplementation(id),
    enabled: !!id,
  });
}

export function useUpdateControlStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: UUID; request: UpdateControlStatusRequest }) =>
      updateControlStatus(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.controls() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.status() });
    },
  });
}

export function useComplianceStats(frameworkCode: string) {
  return useQuery({
    queryKey: complianceKeys.stats(frameworkCode),
    queryFn: () => getComplianceStats(frameworkCode),
    enabled: !!frameworkCode,
  });
}

// ===== Evidence Hooks =====

export function useComplianceEvidence(params: ComplianceEvidenceParams = {}) {
  return useQuery({
    queryKey: complianceKeys.evidenceList(params),
    queryFn: () => getEvidence(params),
  });
}

export function useEvidenceByRequirement(requirementId: UUID) {
  return useQuery({
    queryKey: complianceKeys.evidenceByRequirement(requirementId),
    queryFn: () => getEvidenceByRequirement(requirementId),
    enabled: !!requirementId,
  });
}

export function useEvidenceDetail(id: UUID) {
  return useQuery({
    queryKey: complianceKeys.evidenceDetail(id),
    queryFn: () => getEvidenceById(id),
    enabled: !!id,
  });
}

export function useUploadEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ request, file }: { request: UploadEvidenceRequest; file: File }) =>
      uploadEvidence(request, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.evidence() });
    },
  });
}

export function useVerifyEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => verifyEvidence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.evidence() });
    },
  });
}

export function useDeleteEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteEvidence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.evidence() });
    },
  });
}

// ===== Report Hooks =====

export function useComplianceReports(params: ComplianceReportParams = {}) {
  return useQuery({
    queryKey: complianceKeys.reportsList(params),
    queryFn: () => getReports(params),
  });
}

export function useComplianceReport(id: UUID) {
  return useQuery({
    queryKey: complianceKeys.reportDetail(id),
    queryFn: () => getReport(id),
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: GenerateReportRequest) => generateReport(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.reports() });
    },
  });
}

export function useFinalizeReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => finalizeReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.reports() });
    },
  });
}
