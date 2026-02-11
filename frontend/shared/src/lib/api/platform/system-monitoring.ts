import { api } from "../client";
import type {
  SystemHealthResponse,
  ScheduledJobResponse,
  ErrorSummaryResponse,
} from "../../../types/platform/system-monitoring";

const BASE_URL = "api/v1/platform/monitoring/system";

export async function getSystemHealth(): Promise<SystemHealthResponse> {
  return api.get(`${BASE_URL}/health`).json<SystemHealthResponse>();
}

export async function getScheduledJobs(): Promise<ScheduledJobResponse[]> {
  return api.get(`${BASE_URL}/jobs`).json<ScheduledJobResponse[]>();
}

export async function getErrorSummary(): Promise<ErrorSummaryResponse> {
  return api.get(`${BASE_URL}/errors`).json<ErrorSummaryResponse>();
}

export type { SystemHealthResponse, ScheduledJobResponse, ErrorSummaryResponse };
