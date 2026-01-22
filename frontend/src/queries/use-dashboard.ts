"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  getDashboardSummary,
  getTodayAttendance,
  getExpiringSubscriptions,
  getPendingInvoices,
  type DashboardSummary,
  type TodayAttendance,
  type ExpiringSubscription,
  type PendingInvoice,
} from "@/lib/api/dashboard";
import { getSessionsByDate } from "@/lib/api/sessions";
import type { ClassSession } from "@/types/scheduling";

// Query keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
  todayAttendance: () => [...dashboardKeys.all, "today-attendance"] as const,
  expiringSubscriptions: (days: number) =>
    [...dashboardKeys.all, "expiring", days] as const,
  pendingInvoices: () => [...dashboardKeys.all, "pending-invoices"] as const,
  todaySessions: (date: string) =>
    [...dashboardKeys.all, "today-sessions", date] as const,
};

/**
 * Hook to fetch dashboard summary
 */
export function useDashboardSummary(
  options?: Omit<UseQueryOptions<DashboardSummary>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => getDashboardSummary(),
    staleTime: 30 * 1000, // 30 seconds - dashboard data should be relatively fresh
    refetchInterval: 60 * 1000, // Refetch every minute
    ...options,
  });
}

/**
 * Hook to fetch today's attendance
 */
export function useTodayAttendance(
  options?: Omit<UseQueryOptions<TodayAttendance[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dashboardKeys.todayAttendance(),
    queryFn: () => getTodayAttendance(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch expiring subscriptions
 */
export function useExpiringSubscriptions(
  days: number = 7,
  options?: Omit<UseQueryOptions<ExpiringSubscription[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dashboardKeys.expiringSubscriptions(days),
    queryFn: () => getExpiringSubscriptions(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch pending invoices
 */
export function usePendingInvoices(
  options?: Omit<UseQueryOptions<PendingInvoice[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dashboardKeys.pendingInvoices(),
    queryFn: () => getPendingInvoices(),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

/**
 * Hook to fetch today's sessions for dashboard
 */
export function useTodaySessions(
  options?: Omit<UseQueryOptions<ClassSession[]>, "queryKey" | "queryFn">
) {
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: dashboardKeys.todaySessions(today),
    queryFn: () => getSessionsByDate(today),
    staleTime: 60 * 1000, // 1 minute - sessions change more frequently
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    ...options,
  });
}
