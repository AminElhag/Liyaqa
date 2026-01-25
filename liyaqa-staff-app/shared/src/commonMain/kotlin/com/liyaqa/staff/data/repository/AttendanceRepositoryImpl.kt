package com.liyaqa.staff.data.repository

import com.liyaqa.staff.data.remote.api.StaffApi
import com.liyaqa.staff.domain.model.CheckInSource
import com.liyaqa.staff.domain.model.RecentCheckIn
import com.liyaqa.staff.domain.repository.AttendanceRepository
import com.liyaqa.staff.util.Result

class AttendanceRepositoryImpl(
    private val api: StaffApi
) : AttendanceRepository {

    override suspend fun checkInMember(memberId: String, source: CheckInSource): Result<RecentCheckIn> {
        return try {
            Result.Success(api.checkInMember(memberId, source))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun checkInByQrCode(qrCode: String): Result<RecentCheckIn> {
        return try {
            // First get member by QR code, then check them in
            val member = api.getMemberByQrCode(qrCode)
            Result.Success(api.checkInMember(member.id, CheckInSource.QR_SCAN))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun getRecentCheckIns(limit: Int): Result<List<RecentCheckIn>> {
        return try {
            Result.Success(api.getRecentCheckIns(limit))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}
