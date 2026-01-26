import type { UUID } from "./api";

// Enums
export type ModelType = "REVENUE" | "MEMBERSHIP_COUNT" | "ATTENDANCE" | "CHURN";
export type Algorithm = "ARIMA" | "EXPONENTIAL_SMOOTHING" | "PROPHET" | "LINEAR_REGRESSION" | "MOVING_AVERAGE";
export type ForecastType = "REVENUE" | "MEMBERSHIP_COUNT" | "ATTENDANCE" | "CHURN_RATE" | "SIGN_UPS" | "MEMBERSHIP_REVENUE" | "PT_REVENUE" | "RETAIL_REVENUE";
export type PatternType = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "RAMADAN" | "HOLIDAY";
export type MetricType = "REVENUE" | "MEMBERSHIP_REVENUE" | "PT_REVENUE" | "RETAIL_REVENUE" | "ATTENDANCE" | "SIGN_UPS" | "CHURN_RATE" | "ACTIVE_MEMBERS";
export type ForecastGranularity = "DAILY" | "WEEKLY" | "MONTHLY";

// ========== Request Types ==========

export interface CreateForecastModelRequest {
  modelType: ModelType;
  algorithm: Algorithm;
  hyperparameters?: Record<string, unknown>;
}

export interface GenerateForecastRequest {
  forecastType: ForecastType;
  startDate: string;
  endDate: string;
  granularity?: ForecastGranularity;
}

export interface CreateBudgetRequest {
  fiscalYear: number;
  fiscalMonth: number;
  metricType: MetricType;
  budgetedValue: number;
  notes?: string;
}

export interface UpdateBudgetRequest {
  budgetedValue?: number;
  notes?: string;
}

export interface BulkCreateBudgetsRequest {
  fiscalYear: number;
  budgets: MonthlyBudgetItem[];
}

export interface MonthlyBudgetItem {
  fiscalMonth: number;
  metricType: MetricType;
  budgetedValue: number;
  notes?: string;
}

export interface RecordBudgetActualRequest {
  fiscalYear: number;
  fiscalMonth: number;
  metricType: MetricType;
  actualValue: number;
}

export interface ScenarioAdjustments {
  membershipGrowthRate?: number;
  priceChangePercent?: number;
  churnReductionPercent?: number;
  newLocationCount?: number;
  marketingSpendChange?: number;
  customFactors?: Record<string, number>;
}

export interface CreateScenarioRequest {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  adjustments: ScenarioAdjustments;
}

export interface UpdateScenarioRequest {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  adjustments?: ScenarioAdjustments;
}

export interface CalculateScenarioRequest {
  forecastMonths?: number;
}

export interface CompareScenarioRequest {
  scenarioIds: UUID[];
}

// ========== Response Types ==========

export interface ForecastModel {
  id: UUID;
  modelType: ModelType;
  algorithm: Algorithm;
  trainingDate: string;
  accuracyMape: number | null;
  accuracyRmse: number | null;
  featureImportance: Record<string, number> | null;
  hyperparameters: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Forecast {
  id: UUID;
  modelId: UUID;
  forecastType: ForecastType;
  periodStart: string;
  periodEnd: string;
  predictedValue: number;
  lowerBound: number | null;
  upperBound: number | null;
  actualValue: number | null;
  confidenceScore: number | null;
  variance: number | null;
  variancePercentage: number | null;
  generatedAt: string;
}

export interface SeasonalityPattern {
  id: UUID;
  patternType: PatternType;
  periodKey: string;
  metricType: MetricType;
  adjustmentFactor: number;
  sampleSize: number;
  confidenceLevel: number | null;
  isAboveAverage: boolean;
  createdAt: string;
}

export interface Budget {
  id: UUID;
  fiscalYear: number;
  fiscalMonth: number;
  metricType: MetricType;
  budgetedValue: number;
  actualValue: number | null;
  variance: number | null;
  variancePercentage: number | null;
  isOnTarget: boolean;
  isOverBudget: boolean;
  notes: string | null;
  createdBy: UUID | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  year: number;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  budgetCount: number;
  onTargetCount: number;
  overBudgetCount: number;
  byMetricType: Record<MetricType, MetricBudgetSummary>;
}

export interface MetricBudgetSummary {
  budgeted: number;
  actual: number;
  variance: number;
}

export interface ForecastScenario {
  id: UUID;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  adjustments: ScenarioAdjustments | null;
  scenarioForecasts: ScenarioResults | null;
  isBaseline: boolean;
  createdBy: UUID | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioResults {
  calculatedAt: string;
  forecastMonths: number;
  totalBaseline: number;
  totalAdjusted: number;
  forecasts: ScenarioForecastResult[];
}

export interface ScenarioForecastResult {
  periodStart: string;
  periodEnd: string;
  baselineValue: number;
  adjustedValue: number;
  changePercent: number;
}

export interface ScenarioComparison {
  scenarios: ScenarioComparisonItem[];
  bestScenarioId: UUID | null;
  worstScenarioId: UUID | null;
}

export interface ScenarioComparisonItem {
  id: UUID;
  name: string;
  nameAr: string | null;
  isBaseline: boolean;
  totalProjected: number;
  changeFromBaseline: number;
}

// Query params
export interface ForecastQueryParams {
  days?: number;
}

export interface BudgetQueryParams {
  year?: number;
  month?: number;
  metricType?: MetricType;
}

export interface ScenarioQueryParams {
  page?: number;
  size?: number;
}

// Labels for UI
export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  REVENUE: "Revenue",
  MEMBERSHIP_COUNT: "Membership Count",
  ATTENDANCE: "Attendance",
  CHURN: "Churn",
};

export const MODEL_TYPE_LABELS_AR: Record<ModelType, string> = {
  REVENUE: "الإيرادات",
  MEMBERSHIP_COUNT: "عدد العضويات",
  ATTENDANCE: "الحضور",
  CHURN: "الإلغاء",
};

export const METRIC_TYPE_LABELS: Record<MetricType, string> = {
  REVENUE: "Total Revenue",
  MEMBERSHIP_REVENUE: "Membership Revenue",
  PT_REVENUE: "PT Revenue",
  RETAIL_REVENUE: "Retail Revenue",
  ATTENDANCE: "Attendance",
  SIGN_UPS: "Sign-Ups",
  CHURN_RATE: "Churn Rate",
  ACTIVE_MEMBERS: "Active Members",
};

export const METRIC_TYPE_LABELS_AR: Record<MetricType, string> = {
  REVENUE: "إجمالي الإيرادات",
  MEMBERSHIP_REVENUE: "إيرادات العضوية",
  PT_REVENUE: "إيرادات التدريب الشخصي",
  RETAIL_REVENUE: "إيرادات التجزئة",
  ATTENDANCE: "الحضور",
  SIGN_UPS: "التسجيلات",
  CHURN_RATE: "معدل الإلغاء",
  ACTIVE_MEMBERS: "الأعضاء النشطين",
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];
