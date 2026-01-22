package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.DashboardData
import com.liyaqa.member.domain.model.QuickStats

/**
 * Repository for dashboard-related data operations.
 * Provides aggregated data for the home screen.
 */
interface DashboardRepository {

    /**
     * Fetches the full dashboard data including member info,
     * subscription, upcoming classes, and attendance stats.
     */
    suspend fun getDashboard(): Result<DashboardData>

    /**
     * Fetches quick statistics for the member.
     */
    suspend fun getQuickStats(): Result<QuickStats>
}
