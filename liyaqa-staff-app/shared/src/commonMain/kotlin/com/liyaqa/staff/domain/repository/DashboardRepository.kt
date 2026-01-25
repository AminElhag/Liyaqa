package com.liyaqa.staff.domain.repository

import com.liyaqa.staff.domain.model.StaffDashboard
import com.liyaqa.staff.util.Result

interface DashboardRepository {
    suspend fun getDashboard(): Result<StaffDashboard>
}
