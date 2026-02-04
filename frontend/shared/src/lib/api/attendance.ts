import { api } from "./client";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  AttendanceRecord,
  AttendanceQueryParams,
  CheckInRequest,
  CheckOutRequest,
  BulkCheckInRequest,
  BulkCheckOutRequest,
  BulkOperationResult,
} from "../types/attendance";

/**
 * Get paginated attendance records
 */
export async function getAttendance(
  params: AttendanceQueryParams = {}
): Promise<PaginatedResponse<AttendanceRecord>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.memberId) searchParams.set("memberId", params.memberId);
  if (params.date) searchParams.set("date", params.date);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.checkedIn !== undefined)
    searchParams.set("checkedIn", String(params.checkedIn));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.direction) searchParams.set("direction", params.direction);

  const queryString = searchParams.toString();
  const url = queryString ? `api/attendance?${queryString}` : "api/attendance";

  return api.get(url).json();
}

/**
 * Get a single attendance record by ID
 */
export async function getAttendanceRecord(
  id: UUID
): Promise<AttendanceRecord> {
  return api.get(`api/attendance/${id}`).json();
}

/**
 * Check in a member
 */
export async function checkInMember(
  memberId: UUID,
  data: CheckInRequest = {}
): Promise<AttendanceRecord> {
  return api.post(`api/members/${memberId}/check-in`, { json: data }).json();
}

/**
 * Check out a member
 */
export async function checkOutMember(
  memberId: UUID,
  data: CheckOutRequest = {}
): Promise<AttendanceRecord> {
  return api.post(`api/members/${memberId}/check-out`, { json: data }).json();
}

/**
 * Get today's attendance records for the current tenant (full details)
 */
export async function getTodayAttendanceRecords(): Promise<AttendanceRecord[]> {
  const today = new Date().toISOString().split("T")[0];
  const response = await api
    .get(`api/attendance?date=${today}&size=100`)
    .json<PaginatedResponse<AttendanceRecord>>();
  return response.content;
}

/**
 * Get currently checked-in members
 */
export async function getCurrentlyCheckedIn(): Promise<AttendanceRecord[]> {
  const response = await api
    .get("api/attendance?checkedIn=true&size=100")
    .json<PaginatedResponse<AttendanceRecord>>();
  return response.content;
}

/**
 * Bulk check-in multiple members
 */
export async function bulkCheckIn(
  data: BulkCheckInRequest
): Promise<BulkOperationResult> {
  return api.post("api/attendance/bulk/check-in", { json: data }).json();
}

/**
 * Bulk check-out multiple members
 */
export async function bulkCheckOut(
  data: BulkCheckOutRequest
): Promise<BulkOperationResult> {
  return api.post("api/attendance/bulk/check-out", { json: data }).json();
}

/**
 * Get member's attendance history
 */
export async function getMemberAttendance(
  memberId: UUID,
  params: Omit<AttendanceQueryParams, "memberId"> = {}
): Promise<PaginatedResponse<AttendanceRecord>> {
  return getAttendance({ ...params, memberId });
}
