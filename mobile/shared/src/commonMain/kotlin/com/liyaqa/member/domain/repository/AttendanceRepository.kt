package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.AttendanceRecord
import com.liyaqa.member.domain.model.PagedResult

/**
 * Repository for attendance record operations.
 * Handles check-in history and attendance data.
 */
interface AttendanceRepository {

    /**
     * Fetches attendance records for the current member.
     *
     * @param page The page number (0-indexed)
     * @param size The number of items per page
     */
    suspend fun getAttendance(
        page: Int = 0,
        size: Int = 20
    ): Result<PagedResult<AttendanceRecord>>

    /**
     * Fetches attendance records within a date range.
     *
     * @param startDate Start date in ISO format (yyyy-MM-dd)
     * @param endDate End date in ISO format (yyyy-MM-dd)
     * @param page The page number (0-indexed)
     * @param size The number of items per page
     */
    suspend fun getAttendanceRange(
        startDate: String,
        endDate: String,
        page: Int = 0,
        size: Int = 20
    ): Result<PagedResult<AttendanceRecord>>
}
