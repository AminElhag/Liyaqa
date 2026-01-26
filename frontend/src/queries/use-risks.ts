"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAssessments,
  getAssessment,
  getLatestAssessment,
  createAssessment,
  startAssessment,
  completeAssessment,
  approveAssessment,
  archiveAssessment,
  getAssessmentRisks,
  getRisk,
  addRisk,
  updateRisk,
  startTreatment,
  completeTreatment,
  getOverdueTreatments,
  getRiskStats,
} from "@/lib/api/risks";
import type { UUID } from "@/types/api";
import type {
  RiskAssessmentParams,
  CreateAssessmentRequest,
  AddRiskRequest,
  UpdateRiskRequest,
  CompleteTreatmentRequest,
} from "@/types/risk";

// ===== Query Keys =====

export const riskKeys = {
  all: ["risks"] as const,
  assessments: () => [...riskKeys.all, "assessments"] as const,
  assessmentsList: (params: RiskAssessmentParams) =>
    [...riskKeys.assessments(), "list", params] as const,
  assessmentDetail: (id: UUID) =>
    [...riskKeys.assessments(), "detail", id] as const,
  latestAssessment: () =>
    [...riskKeys.assessments(), "latest"] as const,
  risks: () => [...riskKeys.all, "risks"] as const,
  assessmentRisks: (assessmentId: UUID) =>
    [...riskKeys.risks(), "assessment", assessmentId] as const,
  riskDetail: (id: UUID) =>
    [...riskKeys.risks(), "detail", id] as const,
  overdueTreatments: (assessmentId: UUID) =>
    [...riskKeys.risks(), "overdue", assessmentId] as const,
  stats: (assessmentId: UUID) =>
    [...riskKeys.all, "stats", assessmentId] as const,
};

// ===== Assessment Hooks =====

export function useRiskAssessments(params: RiskAssessmentParams = {}) {
  return useQuery({
    queryKey: riskKeys.assessmentsList(params),
    queryFn: () => getAssessments(params),
  });
}

export function useRiskAssessment(id: UUID) {
  return useQuery({
    queryKey: riskKeys.assessmentDetail(id),
    queryFn: () => getAssessment(id),
    enabled: !!id,
  });
}

export function useLatestRiskAssessment() {
  return useQuery({
    queryKey: riskKeys.latestAssessment(),
    queryFn: () => getLatestAssessment(),
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateAssessmentRequest) => createAssessment(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.assessments() });
    },
  });
}

export function useStartAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => startAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.assessments() });
    },
  });
}

export function useCompleteAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => completeAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.assessments() });
    },
  });
}

export function useApproveAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => approveAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.assessments() });
    },
  });
}

export function useArchiveAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => archiveAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.assessments() });
    },
  });
}

// ===== Risk Hooks =====

export function useAssessmentRisks(assessmentId: UUID) {
  return useQuery({
    queryKey: riskKeys.assessmentRisks(assessmentId),
    queryFn: () => getAssessmentRisks(assessmentId),
    enabled: !!assessmentId,
  });
}

export function useRisk(id: UUID) {
  return useQuery({
    queryKey: riskKeys.riskDetail(id),
    queryFn: () => getRisk(id),
    enabled: !!id,
  });
}

export function useAddRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, request }: { assessmentId: UUID; request: AddRiskRequest }) =>
      addRisk(assessmentId, request),
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: riskKeys.assessmentRisks(assessmentId) });
      queryClient.invalidateQueries({ queryKey: riskKeys.assessments() });
    },
  });
}

export function useUpdateRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: UUID; request: UpdateRiskRequest }) =>
      updateRisk(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.risks() });
    },
  });
}

export function useStartTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => startTreatment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.risks() });
    },
  });
}

export function useCompleteTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: UUID; request: CompleteTreatmentRequest }) =>
      completeTreatment(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.risks() });
    },
  });
}

export function useOverdueTreatments(assessmentId: UUID) {
  return useQuery({
    queryKey: riskKeys.overdueTreatments(assessmentId),
    queryFn: () => getOverdueTreatments(assessmentId),
    enabled: !!assessmentId,
  });
}

export function useRiskStats(assessmentId: UUID) {
  return useQuery({
    queryKey: riskKeys.stats(assessmentId),
    queryFn: () => getRiskStats(assessmentId),
    enabled: !!assessmentId,
  });
}
