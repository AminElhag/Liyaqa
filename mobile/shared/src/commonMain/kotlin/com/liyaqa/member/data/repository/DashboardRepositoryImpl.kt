package com.liyaqa.member.data.repository

import com.liyaqa.member.data.api.MemberApiService
import com.liyaqa.member.data.api.toResult
import com.liyaqa.member.data.mapper.toDomain
import com.liyaqa.member.domain.model.DashboardData
import com.liyaqa.member.domain.model.QuickStats
import com.liyaqa.member.domain.repository.DashboardRepository

/**
 * Implementation of DashboardRepository using MemberApiService.
 */
class DashboardRepositoryImpl(
    private val api: MemberApiService
) : DashboardRepository {

    override suspend fun getDashboard(): Result<DashboardData> {
        return api.getDashboard().toResult { it.toDomain() }
    }

    override suspend fun getQuickStats(): Result<QuickStats> {
        return api.getQuickStats().toResult { it.toDomain() }
    }
}
