"use client";

import {
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getAllFacilitiesHealth,
  getFacilityActivity,
  getAtRiskFacilities,
} from "../../lib/api/platform/facility-monitoring";
import type {
  FacilityHealthResponse,
  FacilityActivityResponse,
  AtRiskFacilityResponse,
} from "../../types/platform/facility-monitoring";

export const facilityMonitoringKeys = {
  all: ["platform", "facility-monitoring"] as const,
  health: () => [...facilityMonitoringKeys.all, "health"] as const,
  activity: (facilityId: string, days: number) =>
    [...facilityMonitoringKeys.all, "activity", facilityId, days] as const,
  atRisk: () => [...facilityMonitoringKeys.all, "at-risk"] as const,
};

export function useFacilitiesHealth(
  options?: Omit<UseQueryOptions<FacilityHealthResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: facilityMonitoringKeys.health(),
    queryFn: getAllFacilitiesHealth,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useFacilityActivity(
  facilityId: string,
  days: number = 30,
  options?: Omit<UseQueryOptions<FacilityActivityResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: facilityMonitoringKeys.activity(facilityId, days),
    queryFn: () => getFacilityActivity(facilityId, days),
    enabled: !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useAtRiskFacilities(
  options?: Omit<UseQueryOptions<AtRiskFacilityResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: facilityMonitoringKeys.atRisk(),
    queryFn: getAtRiskFacilities,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}
