package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.AppInit
import com.liyaqa.member.domain.model.HomeDashboard
import com.liyaqa.member.domain.model.QuickStats
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow

/**
 * Repository for mobile dashboard operations
 */
interface DashboardRepository {
    /**
     * Get home dashboard (offline-first)
     */
    fun getHomeDashboard(): Flow<Result<HomeDashboard>>

    /**
     * Get quick stats for widgets
     */
    suspend fun getQuickStats(): Result<QuickStats>

    /**
     * Get app initialization data
     */
    suspend fun getAppInit(): Result<AppInit>

    /**
     * Force refresh dashboard from server
     */
    suspend fun refreshDashboard(): Result<HomeDashboard>
}
