import { api } from "../client";
import type {
  ChurnAnalysisResponse,
  FeatureAdoptionResponse,
  ComparativeResponse,
  ReportType,
  ExportFormat,
} from "../../../types/platform/analytics";

const BASE_URL = "api/v1/platform/analytics";

export async function getChurnAnalysis(): Promise<ChurnAnalysisResponse> {
  return api.get(`${BASE_URL}/churn`).json<ChurnAnalysisResponse>();
}

export async function getFeatureAdoption(): Promise<FeatureAdoptionResponse> {
  return api.get(`${BASE_URL}/feature-adoption`).json<FeatureAdoptionResponse>();
}

export async function getComparativeAnalytics(): Promise<ComparativeResponse> {
  return api.get(`${BASE_URL}/comparative`).json<ComparativeResponse>();
}

export async function exportAnalyticsReport(
  type: ReportType,
  format: ExportFormat,
): Promise<Blob> {
  return api
    .get(`${BASE_URL}/reports/export`, {
      searchParams: { type, format },
    })
    .blob();
}
