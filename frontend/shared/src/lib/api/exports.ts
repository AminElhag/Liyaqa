import { api } from "./client";
import type { ExportRequest } from "../../types/report";

const EXPORTS_ENDPOINT = "api/exports";

/**
 * Build query string from params
 */
function buildQueryString(params: ExportRequest): string {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.format) searchParams.set("format", params.format);
  return searchParams.toString();
}

/**
 * Export members to CSV
 */
export async function exportMembers(params: ExportRequest = {}): Promise<Blob> {
  const query = buildQueryString(params);
  const url = query ? `${EXPORTS_ENDPOINT}/members?${query}` : `${EXPORTS_ENDPOINT}/members`;
  const response = await api.get(url);
  return response.blob();
}

/**
 * Export subscriptions to CSV
 */
export async function exportSubscriptions(params: ExportRequest = {}): Promise<Blob> {
  const query = buildQueryString(params);
  const url = query ? `${EXPORTS_ENDPOINT}/subscriptions?${query}` : `${EXPORTS_ENDPOINT}/subscriptions`;
  const response = await api.get(url);
  return response.blob();
}

/**
 * Export invoices to CSV
 */
export async function exportInvoices(params: ExportRequest = {}): Promise<Blob> {
  const query = buildQueryString(params);
  const url = query ? `${EXPORTS_ENDPOINT}/invoices?${query}` : `${EXPORTS_ENDPOINT}/invoices`;
  const response = await api.get(url);
  return response.blob();
}

/**
 * Export attendance to CSV
 */
export async function exportAttendance(params: ExportRequest = {}): Promise<Blob> {
  const query = buildQueryString(params);
  const url = query ? `${EXPORTS_ENDPOINT}/attendance?${query}` : `${EXPORTS_ENDPOINT}/attendance`;
  const response = await api.get(url);
  return response.blob();
}

/**
 * Export bookings to CSV
 */
export async function exportBookings(params: ExportRequest = {}): Promise<Blob> {
  const query = buildQueryString(params);
  const url = query ? `${EXPORTS_ENDPOINT}/bookings?${query}` : `${EXPORTS_ENDPOINT}/bookings`;
  const response = await api.get(url);
  return response.blob();
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
