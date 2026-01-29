"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as checkInsApi from "@/lib/api/check-ins";

// Query keys
export const checkInKeys = {
  all: ["check-ins"] as const,
  history: () => [...checkInKeys.all, "history"] as const,
  memberHistory: (memberId: string) => [...checkInKeys.history(), memberId] as const,
  validation: (memberId: string) => [...checkInKeys.all, "validation", memberId] as const,
  visitStats: (memberId: string) => [...checkInKeys.all, "visit-stats", memberId] as const,
  activeCheckIn: (memberId: string) => [...checkInKeys.all, "active", memberId] as const,
  today: () => [...checkInKeys.all, "today"] as const,
  byDate: (date: string) => [...checkInKeys.all, "by-date", date] as const,
  heatmap: () => [...checkInKeys.all, "heatmap"] as const,
};

// Queries

export function useCheckInHistory(
  memberId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...checkInKeys.memberHistory(memberId), params],
    queryFn: () => checkInsApi.getCheckInHistory(memberId, params),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useValidateCheckIn(memberId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: checkInKeys.validation(memberId),
    queryFn: () => checkInsApi.validateCheckIn(memberId),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useVisitStats(memberId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: checkInKeys.visitStats(memberId),
    queryFn: () => checkInsApi.getVisitStats(memberId),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useActiveCheckIn(memberId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: checkInKeys.activeCheckIn(memberId),
    queryFn: () => checkInsApi.getActiveCheckIn(memberId),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useTodayCheckIns(
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...checkInKeys.today(), params],
    queryFn: () => checkInsApi.getTodayCheckIns(params),
    enabled: options?.enabled !== false,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

export function useCheckInsByDate(
  date: string,
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...checkInKeys.byDate(date), params],
    queryFn: () => checkInsApi.getCheckInsByDate(date, params),
    enabled: options?.enabled !== false && !!date,
  });
}

export function useCheckInHeatmap(
  params?: { startDate?: string; endDate?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...checkInKeys.heatmap(), params],
    queryFn: () => checkInsApi.getCheckInHeatmap(params),
    enabled: options?.enabled !== false,
  });
}

// Mutations

export function useCheckInMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      request,
    }: {
      memberId: string;
      request: checkInsApi.CheckInRequest;
    }) => checkInsApi.checkInMember(memberId, request),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.memberHistory(variables.memberId) });
      queryClient.invalidateQueries({ queryKey: checkInKeys.activeCheckIn(variables.memberId) });
      queryClient.invalidateQueries({ queryKey: checkInKeys.visitStats(variables.memberId) });
      queryClient.invalidateQueries({ queryKey: checkInKeys.today() });
    },
  });
}

export function useCheckOutMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => checkInsApi.checkOutMember(memberId),
    onSuccess: (data, memberId) => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.memberHistory(memberId) });
      queryClient.invalidateQueries({ queryKey: checkInKeys.activeCheckIn(memberId) });
      queryClient.invalidateQueries({ queryKey: checkInKeys.visitStats(memberId) });
      queryClient.invalidateQueries({ queryKey: checkInKeys.today() });
    },
  });
}

export function useCheckOutById() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checkInId: string) => checkInsApi.checkOutById(checkInId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.all });
    },
  });
}
