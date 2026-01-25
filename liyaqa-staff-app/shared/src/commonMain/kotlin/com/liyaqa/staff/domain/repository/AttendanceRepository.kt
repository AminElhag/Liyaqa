package com.liyaqa.staff.domain.repository

import com.liyaqa.staff.domain.model.CheckInSource
import com.liyaqa.staff.domain.model.RecentCheckIn
import com.liyaqa.staff.util.Result

interface AttendanceRepository {
    suspend fun checkInMember(memberId: String, source: CheckInSource): Result<RecentCheckIn>
    suspend fun checkInByQrCode(qrCode: String): Result<RecentCheckIn>
    suspend fun getRecentCheckIns(limit: Int = 10): Result<List<RecentCheckIn>>
}
