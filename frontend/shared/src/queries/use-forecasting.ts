"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { UUID, PaginatedResponse } from "../types/api";
import {
  getForecastModels,
  getForecastModel,
  createForecastModel,
  activateForecastModel,
  getActiveModels,
  generateForecast,
  getRevenueForecasts,
  getMembershipForecasts,
  recordForecastActual,
  getSeasonalityPatterns,
  getBudgets,
  getBudget,
  createBudget,
  bulkCreateBudgets,
  updateBudget,
  recordBudgetActual,
  getBudgetSummary,
  deleteBudget,
  getScenarios,
  getScenario,
  createScenario,
  updateScenario,
  calculateScenario,
  setScenarioAsBaseline,
  compareScenarios,
  deleteScenario,
} from "../lib/api/forecasting";
import type {
  ForecastModel,
  Forecast,
  SeasonalityPattern,
  Budget,
  BudgetSummary,
  ForecastScenario,
  ScenarioComparison,
  CreateForecastModelRequest,
  GenerateForecastRequest,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BulkCreateBudgetsRequest,
  RecordBudgetActualRequest,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  CompareScenarioRequest,
  BudgetQueryParams,
  PatternType,
} from "../types/forecasting";

// Query keys
export const forecastingKeys = {
  all: ["forecasting"] as const,
  models: () => [...forecastingKeys.all, "models"] as const,
  modelsList: (page: number, size: number) =>
    [...forecastingKeys.models(), "list", page, size] as const,
  modelDetail: (id: UUID) => [...forecastingKeys.models(), id] as const,
  activeModels: () => [...forecastingKeys.models(), "active"] as const,
  forecasts: () => [...forecastingKeys.all, "forecasts"] as const,
  revenueForecasts: (days: number) =>
    [...forecastingKeys.forecasts(), "revenue", days] as const,
  membershipForecasts: (days: number) =>
    [...forecastingKeys.forecasts(), "membership", days] as const,
  seasonality: (patternType?: PatternType) =>
    [...forecastingKeys.all, "seasonality", patternType] as const,
  budgets: () => [...forecastingKeys.all, "budgets"] as const,
  budgetsList: (params: BudgetQueryParams) =>
    [...forecastingKeys.budgets(), "list", params] as const,
  budgetDetail: (id: UUID) => [...forecastingKeys.budgets(), id] as const,
  budgetSummary: (year?: number) =>
    [...forecastingKeys.budgets(), "summary", year] as const,
  scenarios: () => [...forecastingKeys.all, "scenarios"] as const,
  scenariosList: (page: number, size: number) =>
    [...forecastingKeys.scenarios(), "list", page, size] as const,
  scenarioDetail: (id: UUID) => [...forecastingKeys.scenarios(), id] as const,
};

// ========== Forecast Models ==========

export function useForecastModels(
  page = 0,
  size = 20,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<ForecastModel>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: forecastingKeys.modelsList(page, size),
    queryFn: () => getForecastModels(page, size),
    ...options,
  });
}

export function useForecastModel(
  id: UUID,
  options?: Omit<UseQueryOptions<ForecastModel>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: forecastingKeys.modelDetail(id),
    queryFn: () => getForecastModel(id),
    enabled: !!id,
    ...options,
  });
}

export function useActiveModels(
  options?: Omit<UseQueryOptions<ForecastModel[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: forecastingKeys.activeModels(),
    queryFn: () => getActiveModels(),
    ...options,
  });
}

export function useCreateForecastModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateForecastModelRequest) => createForecastModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastingKeys.models() });
    },
  });
}

export function useActivateForecastModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => activateForecastModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastingKeys.models() });
    },
  });
}

// ========== Forecasts ==========

export function useRevenueForecasts(
  days = 30,
  options?: Omit<UseQueryOptions<Forecast[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: forecastingKeys.revenueForecasts(days),
    queryFn: () => getRevenueForecasts(days),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useMembershipForecasts(
  days = 30,
  options?: Omit<UseQueryOptions<Forecast[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: forecastingKeys.membershipForecasts(days),
    queryFn: () => getMembershipForecasts(days),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useGenerateForecast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateForecastRequest) => generateForecast(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastingKeys.forecasts() });
    },
  });
}

export function useRecordForecastActual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actualValue }: { id: UUID; actualValue: number }) =>
      recordForecastActual(id, actualValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastingKeys.forecasts() });
    },
  });
}

// ========== Seasonality ==========

export function useSeasonalityPatterns(
  patternType?: PatternType,
  options?: Omit<UseQueryOptions<SeasonalityPattern[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: forecastingKeys.seasonality(patternType),
    queryFn: () => getSeasonalityPatterns(patternType),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

// ========== Budgets ==========

export function useBudgets(
  params: BudgetQueryParams = {},
  options?: Omit<UseQueryOptions<Budget[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: forecastingKeys.budgetsList(params),
    queryFn: () => getBudgets(params),
    ...options,
  });
}

export function useBudget(
  id: UUID,
  options?: Omit<UseQueryOptions<Budget>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: forecastingKeys.budgetDetail(id),
    queryFn: () => getBudget(id),
    enabled: !!id,
    ...options,
  });
}

export function useBudgetSummary(
  year?: number,
  options?: Omit<UseQueryOptions<BudgetSummary>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: forecastingKeys.budgetSummary(year),
    queryFn: () => getBudgetSummary(year),
    ...options,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetRequest) => createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastingKeys.budgets() });
    },
  });
}

export function useBulkCreateBudgets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCreateBudgetsRequest) => bulkCreateBudgets(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastingKeys.budgets() });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateBudgetRequest }) =>
      updateBudget(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(forecastingKeys.budgetDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: forecastingKeys.budgets() });
    },
  });
}

export function useRecordBudgetActual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordBudgetActualRequest) => recordBudgetActual(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastingKeys.budgets() });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteBudget(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: forecastingKeys.budgetDetail(id) });
      queryClient.invalidateQueries({ queryKey: forecastingKeys.budgets() });
    },
  });
}

// ========== Scenarios ==========

export function useScenarios(
  page = 0,
  size = 20,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<ForecastScenario>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: forecastingKeys.scenariosList(page, size),
    queryFn: () => getScenarios({ page, size }),
    ...options,
  });
}

export function useScenario(
  id: UUID,
  options?: Omit<UseQueryOptions<ForecastScenario>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: forecastingKeys.scenarioDetail(id),
    queryFn: () => getScenario(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScenarioRequest) => createScenario(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastingKeys.scenarios() });
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateScenarioRequest }) =>
      updateScenario(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        forecastingKeys.scenarioDetail(updated.id),
        updated
      );
      queryClient.invalidateQueries({ queryKey: forecastingKeys.scenarios() });
    },
  });
}

export function useCalculateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      forecastMonths,
    }: {
      id: UUID;
      forecastMonths?: number;
    }) => calculateScenario(id, { forecastMonths }),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        forecastingKeys.scenarioDetail(updated.id),
        updated
      );
      queryClient.invalidateQueries({ queryKey: forecastingKeys.scenarios() });
    },
  });
}

export function useSetScenarioAsBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => setScenarioAsBaseline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastingKeys.scenarios() });
    },
  });
}

export function useCompareScenarios() {
  return useMutation({
    mutationFn: (data: CompareScenarioRequest) => compareScenarios(data),
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteScenario(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: forecastingKeys.scenarioDetail(id) });
      queryClient.invalidateQueries({ queryKey: forecastingKeys.scenarios() });
    },
  });
}
