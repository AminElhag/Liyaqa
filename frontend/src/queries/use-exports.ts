"use client";

import { useMutation } from "@tanstack/react-query";
import {
  exportMembers,
  exportSubscriptions,
  exportInvoices,
  exportAttendance,
  exportBookings,
  downloadBlob,
} from "@/lib/api/exports";
import type { ExportRequest } from "@/types/report";

/**
 * Hook to export members
 */
export function useExportMembers() {
  return useMutation({
    mutationFn: async (params: ExportRequest = {}) => {
      const blob = await exportMembers(params);
      const date = new Date().toISOString().split("T")[0];
      downloadBlob(blob, `members-${date}.csv`);
    },
  });
}

/**
 * Hook to export subscriptions
 */
export function useExportSubscriptions() {
  return useMutation({
    mutationFn: async (params: ExportRequest = {}) => {
      const blob = await exportSubscriptions(params);
      const date = new Date().toISOString().split("T")[0];
      downloadBlob(blob, `subscriptions-${date}.csv`);
    },
  });
}

/**
 * Hook to export invoices
 */
export function useExportInvoices() {
  return useMutation({
    mutationFn: async (params: ExportRequest = {}) => {
      const blob = await exportInvoices(params);
      const date = new Date().toISOString().split("T")[0];
      downloadBlob(blob, `invoices-${date}.csv`);
    },
  });
}

/**
 * Hook to export attendance
 */
export function useExportAttendance() {
  return useMutation({
    mutationFn: async (params: ExportRequest = {}) => {
      const blob = await exportAttendance(params);
      const date = new Date().toISOString().split("T")[0];
      downloadBlob(blob, `attendance-${date}.csv`);
    },
  });
}

/**
 * Hook to export bookings
 */
export function useExportBookings() {
  return useMutation({
    mutationFn: async (params: ExportRequest = {}) => {
      const blob = await exportBookings(params);
      const date = new Date().toISOString().split("T")[0];
      downloadBlob(blob, `bookings-${date}.csv`);
    },
  });
}
