"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  getTodayPrayerTimes,
  getPrayerTimesByDate,
  getWeeklyPrayerTimes,
  getNextPrayer,
  getCheckInStatus,
  getPrayerSettings,
  updatePrayerSettings,
  getSupportedCities,
  getCalculationMethods,
} from "@/lib/api/prayer-times";
import type {
  PrayerTimeResponse,
  NextPrayerResponse,
  CheckInStatusResponse,
  PrayerSettingsResponse,
  SupportedCitiesResponse,
  CalculationMethodInfo,
  UpdatePrayerSettingsRequest,
} from "@/types/prayer-time";

// Query keys
export const prayerTimeKeys = {
  all: ["prayer-times"] as const,
  today: (clubId: string) => [...prayerTimeKeys.all, "today", clubId] as const,
  date: (clubId: string, date: string) =>
    [...prayerTimeKeys.all, "date", clubId, date] as const,
  week: (clubId: string, startDate?: string) =>
    [...prayerTimeKeys.all, "week", clubId, startDate] as const,
  next: (clubId: string) => [...prayerTimeKeys.all, "next", clubId] as const,
  checkInStatus: (clubId: string) =>
    [...prayerTimeKeys.all, "check-in-status", clubId] as const,
  settings: (clubId: string) =>
    [...prayerTimeKeys.all, "settings", clubId] as const,
  cities: () => [...prayerTimeKeys.all, "cities"] as const,
  methods: () => [...prayerTimeKeys.all, "methods"] as const,
};

/**
 * Hook to fetch today's prayer times for a club.
 */
export function useTodayPrayerTimes(
  clubId: string,
  options?: Omit<UseQueryOptions<PrayerTimeResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: prayerTimeKeys.today(clubId),
    queryFn: () => getTodayPrayerTimes(clubId),
    enabled: !!clubId,
    staleTime: 60 * 60 * 1000, // 1 hour - prayer times don't change frequently
    ...options,
  });
}

/**
 * Hook to fetch prayer times for a specific date.
 */
export function usePrayerTimesByDate(
  clubId: string,
  date: string,
  options?: Omit<UseQueryOptions<PrayerTimeResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: prayerTimeKeys.date(clubId, date),
    queryFn: () => getPrayerTimesByDate(clubId, date),
    enabled: !!clubId && !!date,
    staleTime: 60 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch weekly prayer times.
 */
export function useWeeklyPrayerTimes(
  clubId: string,
  startDate?: string,
  options?: Omit<UseQueryOptions<PrayerTimeResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: prayerTimeKeys.week(clubId, startDate),
    queryFn: () => getWeeklyPrayerTimes(clubId, startDate),
    enabled: !!clubId,
    staleTime: 60 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch the next prayer for a club.
 */
export function useNextPrayer(
  clubId: string,
  options?: Omit<UseQueryOptions<NextPrayerResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: prayerTimeKeys.next(clubId),
    queryFn: () => getNextPrayer(clubId),
    enabled: !!clubId,
    staleTime: 60 * 1000, // 1 minute - next prayer changes
    refetchInterval: 60 * 1000, // Refetch every minute
    ...options,
  });
}

/**
 * Hook to check if check-in is blocked due to prayer time.
 */
export function useCheckInStatus(
  clubId: string,
  options?: Omit<UseQueryOptions<CheckInStatusResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: prayerTimeKeys.checkInStatus(clubId),
    queryFn: () => getCheckInStatus(clubId),
    enabled: !!clubId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch prayer settings for a club.
 */
export function usePrayerSettings(
  clubId: string,
  options?: Omit<UseQueryOptions<PrayerSettingsResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: prayerTimeKeys.settings(clubId),
    queryFn: () => getPrayerSettings(clubId),
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to update prayer settings for a club.
 */
export function useUpdatePrayerSettings(
  options?: UseMutationOptions<
    PrayerSettingsResponse,
    Error,
    { clubId: string; settings: UpdatePrayerSettingsRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clubId, settings }) => updatePrayerSettings(clubId, settings),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: prayerTimeKeys.settings(variables.clubId),
      });
      queryClient.invalidateQueries({
        queryKey: prayerTimeKeys.today(variables.clubId),
      });
    },
    ...options,
  });
}

/**
 * Hook to fetch supported Saudi cities.
 */
export function useSupportedCities(
  options?: Omit<UseQueryOptions<SupportedCitiesResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: prayerTimeKeys.cities(),
    queryFn: () => getSupportedCities(),
    staleTime: Infinity, // Cities don't change
    ...options,
  });
}

/**
 * Hook to fetch supported calculation methods.
 */
export function useCalculationMethods(
  options?: Omit<UseQueryOptions<CalculationMethodInfo[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: prayerTimeKeys.methods(),
    queryFn: () => getCalculationMethods(),
    staleTime: Infinity, // Methods don't change
    ...options,
  });
}
