import type { UUID, LocalizedText, ListQueryParams } from "./api";

/**
 * Check-in method
 */
export type CheckInMethod = "MANUAL" | "QR_CODE" | "CARD" | "BIOMETRIC";

/**
 * Attendance record
 */
export interface AttendanceRecord {
  id: UUID;
  memberId: UUID;
  memberName: LocalizedText;
  memberEmail: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInMethod: CheckInMethod;
  locationId?: UUID;
  locationName?: LocalizedText;
  notes?: string;
  tenantId: UUID;
  createdAt: string;
  updatedAt: string;
}

/**
 * Check-in request
 */
export interface CheckInRequest {
  method?: CheckInMethod;
  locationId?: UUID;
  notes?: string;
}

/**
 * Check-out request
 */
export interface CheckOutRequest {
  notes?: string;
}

/**
 * Bulk check-in request
 */
export interface BulkCheckInRequest {
  memberIds: UUID[];
  method?: CheckInMethod;
  locationId?: UUID;
}

/**
 * Bulk check-out request
 */
export interface BulkCheckOutRequest {
  memberIds: UUID[];
}

/**
 * Attendance query params
 */
export interface AttendanceQueryParams extends ListQueryParams {
  memberId?: UUID;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  checkedIn?: boolean;
}

/**
 * Today's attendance summary
 */
export interface TodayAttendance {
  totalCheckIns: number;
  currentlyCheckedIn: number;
  checkedOut: number;
  recentCheckIns: AttendanceRecord[];
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  failures: Array<{
    id: UUID;
    reason: string;
  }>;
}
