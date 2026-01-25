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

// ========== Enhanced Reporting Types ==========

export type ReportType =
  | "REVENUE"
  | "ATTENDANCE"
  | "MEMBERS"
  | "CHURN"
  | "LTV"
  | "RETENTION_COHORT"
  | "SUBSCRIPTIONS"
  | "CLASSES"
  | "TRAINERS";

export type ReportFrequency = "DAILY" | "WEEKLY" | "MONTHLY";
export type ReportFormat = "PDF" | "EXCEL" | "CSV";
export type ReportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type LtvSegment = "PLAN" | "LOCATION" | "JOIN_MONTH" | "GENDER";

export interface ScheduledReport {
  id: UUID;
  name: string;
  nameAr: string | null;
  reportType: ReportType;
  frequency: ReportFrequency;
  recipients: string[];
  filters: Record<string, unknown> | null;
  format: ReportFormat;
  nextRunAt: string;
  lastRunAt: string | null;
  enabled: boolean;
  createdBy: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface ReportHistory {
  id: UUID;
  scheduledReportId: UUID | null;
  reportType: ReportType;
  parameters: Record<string, unknown>;
  fileUrl: string | null;
  fileSize: number | null;
  status: ReportStatus;
  errorMessage: string | null;
  generatedBy: UUID | null;
  generatedAt: string | null;
  createdAt: string;
}

export interface ChurnReport {
  period: string;
  startDate: string;
  endDate: string;
  totalMembersStart: number;
  totalMembersEnd: number;
  newMembers: number;
  churnedMembers: number;
  churnRate: number;
  retentionRate: number;
  churnByPlan: ChurnByPlan[];
  churnByMonth: ChurnByMonth[];
  churnReasons: ChurnReason[];
}

export interface ChurnByPlan {
  planId: UUID;
  planName: string;
  totalMembers: number;
  churnedMembers: number;
  churnRate: number;
}

export interface ChurnByMonth {
  month: string;
  churnedMembers: number;
  churnRate: number;
}

export interface ChurnReason {
  reason: string;
  reasonAr: string;
  count: number;
  percentage: number;
}

export interface LtvReport {
  period: string;
  startDate: string;
  endDate: string;
  totalMembers: number;
  averageLtv: number;
  medianLtv: number;
  totalRevenue: number;
  averageLifespanMonths: number;
  ltvBySegment: LtvBySegment[];
  ltvDistribution: LtvBucket[];
  topMembers: MemberLtv[];
}

export interface LtvBySegment {
  segmentId: string;
  segmentName: string;
  segmentNameAr: string | null;
  memberCount: number;
  averageLtv: number;
  totalRevenue: number;
}

export interface LtvBucket {
  rangeMin: number;
  rangeMax: number;
  label: string;
  count: number;
  percentage: number;
}

export interface MemberLtv {
  memberId: UUID;
  memberName: string;
  ltv: number;
  lifespanMonths: number;
  transactionCount: number;
}

// Request types
export interface CreateScheduledReportRequest {
  name: string;
  nameAr?: string;
  reportType: ReportType;
  frequency: ReportFrequency;
  recipients: string[];
  filters?: Record<string, unknown>;
  format?: ReportFormat;
}

export interface UpdateScheduledReportRequest {
  name?: string;
  nameAr?: string;
  frequency?: ReportFrequency;
  recipients?: string[];
  filters?: Record<string, unknown>;
  format?: ReportFormat;
  enabled?: boolean;
}

export interface GenerateChurnReportRequest {
  startDate: string;
  endDate: string;
  planIds?: UUID[];
  locationIds?: UUID[];
  format?: ReportFormat;
}

export interface GenerateLtvReportRequest {
  startDate: string;
  endDate: string;
  segmentBy?: LtvSegment;
  format?: ReportFormat;
}

export interface ScheduledReportQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface ReportHistoryQueryParams {
  page?: number;
  size?: number;
}
