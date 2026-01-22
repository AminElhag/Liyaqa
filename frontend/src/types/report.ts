import type { UUID, Money } from "./api";

/**
 * Revenue summary
 */
export interface RevenueSummary {
  totalRevenue: Money;
  paidInvoices: number;
  pendingRevenue: Money;
  pendingInvoices: number;
  overdueRevenue: Money;
  overdueInvoices: number;
}

/**
 * Revenue by period (daily, weekly, monthly)
 */
export interface RevenueByPeriod {
  period: string; // date or period label
  revenue: number;
  invoiceCount: number;
}

/**
 * Revenue report
 */
export interface RevenueReport {
  summary: RevenueSummary;
  byPeriod: RevenueByPeriod[];
  byPlan: {
    planId: UUID;
    planName: string;
    revenue: number;
    subscriptionCount: number;
  }[];
}

/**
 * Attendance summary
 */
export interface AttendanceSummary {
  totalCheckIns: number;
  uniqueMembers: number;
  averageCheckInsPerDay: number;
  peakHour: string;
  peakDay: string;
}

/**
 * Attendance by period
 */
export interface AttendanceByPeriod {
  period: string;
  checkIns: number;
  uniqueMembers: number;
}

/**
 * Attendance by hour
 */
export interface AttendanceByHour {
  hour: number; // 0-23
  checkIns: number;
}

/**
 * Attendance report
 */
export interface AttendanceReport {
  summary: AttendanceSummary;
  byPeriod: AttendanceByPeriod[];
  byHour: AttendanceByHour[];
  byClass: {
    classId: UUID;
    className: string;
    bookings: number;
    attendance: number;
  }[];
}

/**
 * Member summary
 */
export interface MemberSummary {
  totalMembers: number;
  activeMembers: number;
  newMembersThisPeriod: number;
  churnedMembersThisPeriod: number;
  retentionRate: number; // percentage
}

/**
 * Member growth by period
 */
export interface MemberGrowthByPeriod {
  period: string;
  newMembers: number;
  totalMembers: number;
  churnedMembers: number;
}

/**
 * Member report
 */
export interface MemberReport {
  summary: MemberSummary;
  growthByPeriod: MemberGrowthByPeriod[];
  byStatus: {
    status: string;
    count: number;
  }[];
  byPlan: {
    planId: UUID;
    planName: string;
    memberCount: number;
  }[];
}

/**
 * Report query params
 */
export interface ReportQueryParams {
  startDate: string;
  endDate: string;
  groupBy?: "day" | "week" | "month";
}

/**
 * Export format
 */
export type ExportFormat = "csv" | "xlsx";

/**
 * Export request
 */
export interface ExportRequest {
  startDate?: string;
  endDate?: string;
  format?: ExportFormat;
}
