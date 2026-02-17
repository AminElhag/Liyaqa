import { api } from "../client";
import type {
  FacilityHealthResponse,
  FacilityActivityResponse,
  AtRiskFacilityResponse,
} from "../../../types/platform/facility-monitoring";

const BASE_URL = "api/v1/platform/monitoring/facilities";

/**
 * Get health data for all facilities
 */
export async function getAllFacilitiesHealth(): Promise<FacilityHealthResponse[]> {
  return api.get(`${BASE_URL}/health`).json<FacilityHealthResponse[]>();
}

/**
 * Get activity timeline for a facility
 */
export async function getFacilityActivity(
  facilityId: string,
  days: number = 30
): Promise<FacilityActivityResponse[]> {
  return api
    .get(`${BASE_URL}/${facilityId}/activity`, {
      searchParams: { days: String(days) },
    })
    .json<FacilityActivityResponse[]>();
}

/**
 * Get at-risk facilities
 */
export async function getAtRiskFacilities(): Promise<AtRiskFacilityResponse[]> {
  return api.get(`${BASE_URL}/at-risk`).json<AtRiskFacilityResponse[]>();
}
