import { api } from "./client";
import type { UUID, PaginatedResponse } from "../types/api";
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
  CalculateScenarioRequest,
  CompareScenarioRequest,
  BudgetQueryParams,
  ScenarioQueryParams,
  PatternType,
  MetricType,
} from "../types/forecasting";

const ENDPOINT = "api/forecasting";

// ========== Forecast Models ==========

export async function createForecastModel(
  data: CreateForecastModelRequest
): Promise<ForecastModel> {
  return api.post(`${ENDPOINT}/models`, { json: data }).json();
}

export async function getForecastModels(
  page = 0,
  size = 20
): Promise<PaginatedResponse<ForecastModel>> {
  return api.get(`${ENDPOINT}/models?page=${page}&size=${size}`).json();
}

export async function getForecastModel(id: UUID): Promise<ForecastModel> {
  return api.get(`${ENDPOINT}/models/${id}`).json();
}

export async function activateForecastModel(id: UUID): Promise<ForecastModel> {
  return api.post(`${ENDPOINT}/models/${id}/activate`).json();
}

export async function getActiveModels(): Promise<ForecastModel[]> {
  return api.get(`${ENDPOINT}/models/active`).json();
}

// ========== Forecasts ==========

export async function generateForecast(
  data: GenerateForecastRequest
): Promise<Forecast[]> {
  return api.post(`${ENDPOINT}/generate`, { json: data }).json();
}

export async function getRevenueForecasts(days = 30): Promise<Forecast[]> {
  return api.get(`${ENDPOINT}/revenue?days=${days}`).json();
}

export async function getMembershipForecasts(days = 30): Promise<Forecast[]> {
  return api.get(`${ENDPOINT}/membership?days=${days}`).json();
}

export async function recordForecastActual(
  id: UUID,
  actualValue: number
): Promise<Forecast> {
  return api
    .post(`${ENDPOINT}/forecasts/${id}/actual`, { json: { actualValue } })
    .json();
}

// ========== Seasonality ==========

export async function getSeasonalityPatterns(
  patternType?: PatternType
): Promise<SeasonalityPattern[]> {
  const url = patternType
    ? `${ENDPOINT}/seasonality?patternType=${patternType}`
    : `${ENDPOINT}/seasonality`;
  return api.get(url).json();
}

// ========== Budgets ==========

export async function createBudget(data: CreateBudgetRequest): Promise<Budget> {
  return api.post(`${ENDPOINT}/budgets`, { json: data }).json();
}

export async function bulkCreateBudgets(
  data: BulkCreateBudgetsRequest
): Promise<Budget[]> {
  return api.post(`${ENDPOINT}/budgets/bulk`, { json: data }).json();
}

export async function getBudgets(params: BudgetQueryParams = {}): Promise<Budget[]> {
  const searchParams = new URLSearchParams();
  if (params.year) searchParams.set("year", String(params.year));
  if (params.month) searchParams.set("month", String(params.month));
  if (params.metricType) searchParams.set("metricType", params.metricType);

  const query = searchParams.toString();
  const url = query ? `${ENDPOINT}/budgets?${query}` : `${ENDPOINT}/budgets`;
  return api.get(url).json();
}

export async function getBudget(id: UUID): Promise<Budget> {
  return api.get(`${ENDPOINT}/budgets/${id}`).json();
}

export async function updateBudget(
  id: UUID,
  data: UpdateBudgetRequest
): Promise<Budget> {
  return api.put(`${ENDPOINT}/budgets/${id}`, { json: data }).json();
}

export async function recordBudgetActual(
  data: RecordBudgetActualRequest
): Promise<Budget> {
  return api.post(`${ENDPOINT}/budgets/actual`, { json: data }).json();
}

export async function getBudgetSummary(year?: number): Promise<BudgetSummary> {
  const url = year
    ? `${ENDPOINT}/budgets/summary?year=${year}`
    : `${ENDPOINT}/budgets/summary`;
  return api.get(url).json();
}

export async function deleteBudget(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/budgets/${id}`);
}

// ========== Scenarios ==========

export async function createScenario(
  data: CreateScenarioRequest
): Promise<ForecastScenario> {
  return api.post(`${ENDPOINT}/scenarios`, { json: data }).json();
}

export async function getScenarios(
  params: ScenarioQueryParams = {}
): Promise<PaginatedResponse<ForecastScenario>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${ENDPOINT}/scenarios?${query}` : `${ENDPOINT}/scenarios`;
  return api.get(url).json();
}

export async function getScenario(id: UUID): Promise<ForecastScenario> {
  return api.get(`${ENDPOINT}/scenarios/${id}`).json();
}

export async function updateScenario(
  id: UUID,
  data: UpdateScenarioRequest
): Promise<ForecastScenario> {
  return api.put(`${ENDPOINT}/scenarios/${id}`, { json: data }).json();
}

export async function calculateScenario(
  id: UUID,
  data: CalculateScenarioRequest = {}
): Promise<ForecastScenario> {
  return api
    .post(`${ENDPOINT}/scenarios/${id}/calculate`, { json: data })
    .json();
}

export async function setScenarioAsBaseline(
  id: UUID
): Promise<ForecastScenario> {
  return api.post(`${ENDPOINT}/scenarios/${id}/baseline`).json();
}

export async function compareScenarios(
  data: CompareScenarioRequest
): Promise<ScenarioComparison> {
  return api.post(`${ENDPOINT}/scenarios/compare`, { json: data }).json();
}

export async function deleteScenario(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/scenarios/${id}`);
}
