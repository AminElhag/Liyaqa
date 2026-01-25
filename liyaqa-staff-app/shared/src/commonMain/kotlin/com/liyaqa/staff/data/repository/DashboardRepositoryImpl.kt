package com.liyaqa.staff.data.repository

import com.liyaqa.staff.data.remote.api.StaffApi
import com.liyaqa.staff.domain.model.StaffDashboard
import com.liyaqa.staff.domain.repository.DashboardRepository
import com.liyaqa.staff.util.Result

class DashboardRepositoryImpl(
    private val api: StaffApi
) : DashboardRepository {

    override suspend fun getDashboard(): Result<StaffDashboard> {
        return try {
            Result.Success(api.getDashboard())
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}
