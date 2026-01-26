"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { UUID, PaginatedResponse } from "@/types/api";
import {
  getChurnModels,
  getChurnModel,
  getActiveChurnModel,
  activateChurnModel,
  generatePredictions,
  getPredictions,
  getPrediction,
  getAtRiskMembers,
  getPredictionsByRiskLevel,
  getRiskDistribution,
  recordPredictionOutcome,
  createIntervention,
  getInterventions,
  getIntervention,
  assignIntervention,
  executeIntervention,
  recordInterventionOutcome,
  deleteIntervention,
  getInterventionTemplates,
  getActiveInterventionTemplates,
  getInterventionTemplate,
  createInterventionTemplate,
  deleteInterventionTemplate,
} from "@/lib/api/churn";
import type {
  ChurnModel,
  MemberChurnPrediction,
  ChurnIntervention,
  InterventionTemplate,
  RiskDistribution,
  RiskLevel,
  GeneratePredictionsRequest,
  CreateInterventionRequest,
  RecordOutcomeRequest,
  RecordInterventionOutcomeRequest,
  CreateInterventionTemplateRequest,
} from "@/types/churn";

// Query keys
export const churnKeys = {
  all: ["churn"] as const,
  models: () => [...churnKeys.all, "models"] as const,
  modelsList: (page: number, size: number) =>
    [...churnKeys.models(), "list", page, size] as const,
  modelDetail: (id: UUID) => [...churnKeys.models(), id] as const,
  activeModel: () => [...churnKeys.models(), "active"] as const,
  predictions: () => [...churnKeys.all, "predictions"] as const,
  predictionsList: (page: number, size: number) =>
    [...churnKeys.predictions(), "list", page, size] as const,
  predictionDetail: (id: UUID) => [...churnKeys.predictions(), id] as const,
  atRisk: (page: number, size: number) =>
    [...churnKeys.predictions(), "at-risk", page, size] as const,
  byRiskLevel: (level: RiskLevel, page: number, size: number) =>
    [...churnKeys.predictions(), "risk", level, page, size] as const,
  distribution: () => [...churnKeys.predictions(), "distribution"] as const,
  interventions: () => [...churnKeys.all, "interventions"] as const,
  interventionsList: (page: number, size: number) =>
    [...churnKeys.interventions(), "list", page, size] as const,
  interventionDetail: (id: UUID) => [...churnKeys.interventions(), id] as const,
  templates: () => [...churnKeys.all, "templates"] as const,
  activeTemplates: () => [...churnKeys.templates(), "active"] as const,
  templateDetail: (id: UUID) => [...churnKeys.templates(), id] as const,
};

// ========== Churn Models ==========

export function useChurnModels(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<ChurnModel>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.modelsList(page, size),
    queryFn: () => getChurnModels(page, size),
    ...options,
  });
}

export function useChurnModel(
  id: UUID,
  options?: Omit<UseQueryOptions<ChurnModel>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.modelDetail(id),
    queryFn: () => getChurnModel(id),
    enabled: !!id,
    ...options,
  });
}

export function useActiveChurnModel(
  options?: Omit<UseQueryOptions<ChurnModel>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.activeModel(),
    queryFn: () => getActiveChurnModel(),
    ...options,
  });
}

export function useActivateChurnModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => activateChurnModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churnKeys.models() });
    },
  });
}

// ========== Predictions ==========

export function usePredictions(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<MemberChurnPrediction>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.predictionsList(page, size),
    queryFn: () => getPredictions(page, size),
    ...options,
  });
}

export function usePrediction(
  id: UUID,
  options?: Omit<UseQueryOptions<MemberChurnPrediction>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.predictionDetail(id),
    queryFn: () => getPrediction(id),
    enabled: !!id,
    ...options,
  });
}

export function useAtRiskMembers(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<MemberChurnPrediction>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.atRisk(page, size),
    queryFn: () => getAtRiskMembers(page, size),
    ...options,
  });
}

export function usePredictionsByRiskLevel(
  riskLevel: RiskLevel,
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<MemberChurnPrediction>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.byRiskLevel(riskLevel, page, size),
    queryFn: () => getPredictionsByRiskLevel(riskLevel, page, size),
    ...options,
  });
}

export function useRiskDistribution(
  options?: Omit<UseQueryOptions<RiskDistribution>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.distribution(),
    queryFn: () => getRiskDistribution(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useGeneratePredictions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GeneratePredictionsRequest) => generatePredictions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churnKeys.predictions() });
    },
  });
}

export function useRecordPredictionOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: RecordOutcomeRequest }) =>
      recordPredictionOutcome(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(churnKeys.predictionDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: churnKeys.predictions() });
    },
  });
}

// ========== Interventions ==========

export function useInterventions(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<ChurnIntervention>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.interventionsList(page, size),
    queryFn: () => getInterventions(page, size),
    ...options,
  });
}

export function useIntervention(
  id: UUID,
  options?: Omit<UseQueryOptions<ChurnIntervention>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.interventionDetail(id),
    queryFn: () => getIntervention(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateIntervention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInterventionRequest) => createIntervention(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churnKeys.interventions() });
      queryClient.invalidateQueries({ queryKey: churnKeys.predictions() });
    },
  });
}

export function useAssignIntervention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: UUID; assignedTo: UUID }) =>
      assignIntervention(id, assignedTo),
    onSuccess: (updated) => {
      queryClient.setQueryData(churnKeys.interventionDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: churnKeys.interventions() });
    },
  });
}

export function useExecuteIntervention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => executeIntervention(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(churnKeys.interventionDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: churnKeys.interventions() });
    },
  });
}

export function useRecordInterventionOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: RecordInterventionOutcomeRequest }) =>
      recordInterventionOutcome(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(churnKeys.interventionDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: churnKeys.interventions() });
    },
  });
}

export function useDeleteIntervention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteIntervention(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: churnKeys.interventionDetail(id) });
      queryClient.invalidateQueries({ queryKey: churnKeys.interventions() });
    },
  });
}

// ========== Templates ==========

export function useInterventionTemplates(
  options?: Omit<UseQueryOptions<InterventionTemplate[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.templates(),
    queryFn: () => getInterventionTemplates(),
    ...options,
  });
}

export function useActiveInterventionTemplates(
  options?: Omit<UseQueryOptions<InterventionTemplate[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.activeTemplates(),
    queryFn: () => getActiveInterventionTemplates(),
    ...options,
  });
}

export function useInterventionTemplate(
  id: UUID,
  options?: Omit<UseQueryOptions<InterventionTemplate>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: churnKeys.templateDetail(id),
    queryFn: () => getInterventionTemplate(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateInterventionTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInterventionTemplateRequest) =>
      createInterventionTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churnKeys.templates() });
    },
  });
}

export function useDeleteInterventionTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteInterventionTemplate(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: churnKeys.templateDetail(id) });
      queryClient.invalidateQueries({ queryKey: churnKeys.templates() });
    },
  });
}
