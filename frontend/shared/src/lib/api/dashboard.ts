import { api } from "./client";
import type { LocalizedText } from "../types/api";

/**
 * Dashboard summary response
 */
export interface DashboardSummary {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiringThisWeek: number;
  todayCheckIns: number;
  pendingInvoices: number;
  overdueInvoices: number;
  monthlyRevenue: number;
}

/**
 * Today's attendance summary
 */
export interface TodayAttendance {
  memberId: string;
  memberName: LocalizedText;
  checkInTime: string;
  checkOutTime?: string;
  checkInMethod: string;
}

/**
 * Expiring subscription item
 */
export interface ExpiringSubscription {
  id: string;
  memberId: string;
  memberName: LocalizedText;
  planName: LocalizedText;
  endDate: string;
  daysUntilExpiry: number;
}

/**
 * Pending invoice item
 */
export interface PendingInvoice {
  id: string;
  invoiceNumber: string;
  memberId: string;
  memberName: LocalizedText;
  totalAmount: number;
  dueDate: string;
  status: string;
}

const DASHBOARD_ENDPOINT = "api/dashboard";

/**
 * Get dashboard summary statistics
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  return api.get(`${DASHBOARD_ENDPOINT}/summary`).json();
}

/**
 * Get today's attendance list
 */
export async function getTodayAttendance(): Promise<TodayAttendance[]> {
  return api.get(`${DASHBOARD_ENDPOINT}/attendance/today`).json();
}

/**
 * Get subscriptions expiring soon
 */
export async function getExpiringSubscriptions(
  days: number = 7
): Promise<ExpiringSubscription[]> {
  return api
    .get(`${DASHBOARD_ENDPOINT}/subscriptions/expiring?daysAhead=${days}`)
    .json();
}

/**
 * Get pending invoices
 */
export async function getPendingInvoices(): Promise<PendingInvoice[]> {
  return api.get(`${DASHBOARD_ENDPOINT}/invoices/pending`).json();
}
