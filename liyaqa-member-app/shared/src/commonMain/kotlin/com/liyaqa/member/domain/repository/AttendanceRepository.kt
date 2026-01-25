package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.Attendance
import com.liyaqa.member.domain.model.CheckInStatus
import com.liyaqa.member.domain.model.PagedResponse
import com.liyaqa.member.domain.model.QrCheckInResult
import com.liyaqa.member.domain.model.QrCode
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow

/**
 * Repository for attendance and QR check-in operations
 */
interface AttendanceRepository {
    /**
     * Get attendance history (offline-first)
     */
    fun getAttendanceHistory(page: Int = 0, size: Int = 20): Flow<Result<PagedResponse<Attendance>>>

    /**
     * Get attendance by date range
     */
    suspend fun getAttendanceByRange(
        startDate: String,
        endDate: String,
        page: Int = 0,
        size: Int = 20
    ): Result<PagedResponse<Attendance>>

    /**
     * Get personal QR code for check-in
     */
    suspend fun getQrCode(): Result<QrCode>

    /**
     * Self check-in using location QR
     */
    suspend fun selfCheckIn(locationId: String): Result<QrCheckInResult>

    /**
     * Get check-in status (e.g., blocked during prayer)
     */
    suspend fun getCheckInStatus(): Result<CheckInStatus>

    /**
     * Force refresh attendance from server
     */
    suspend fun refreshAttendance(): Result<List<Attendance>>
}
