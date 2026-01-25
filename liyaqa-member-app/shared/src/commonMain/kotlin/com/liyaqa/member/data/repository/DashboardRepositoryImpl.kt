package com.liyaqa.member.data.repository

import com.liyaqa.member.data.remote.api.MobileApi
import com.liyaqa.member.domain.model.AppInit
import com.liyaqa.member.domain.model.HomeDashboard
import com.liyaqa.member.domain.model.QuickStats
import com.liyaqa.member.domain.repository.DashboardRepository
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class DashboardRepositoryImpl(
    private val mobileApi: MobileApi
) : DashboardRepository {

    // Cache for dashboard data
    private var cachedDashboard: HomeDashboard? = null

    override fun getHomeDashboard(): Flow<Result<HomeDashboard>> = flow {
        // Emit cached data if available
        cachedDashboard?.let {
            emit(Result.success(it))
        }

        // Fetch fresh data
        mobileApi.getHomeDashboard().onSuccess { dashboard ->
            cachedDashboard = dashboard
            emit(Result.success(dashboard))
        }.onError { error ->
            if (cachedDashboard == null) {
                emit(Result.error(
                    exception = error.exception,
                    message = error.message,
                    messageAr = error.messageAr
                ))
            }
        }
    }

    override suspend fun getQuickStats(): Result<QuickStats> {
        return mobileApi.getQuickStats()
    }

    override suspend fun getAppInit(): Result<AppInit> {
        return mobileApi.getAppInit()
    }

    override suspend fun refreshDashboard(): Result<HomeDashboard> {
        return mobileApi.getHomeDashboard().onSuccess { dashboard ->
            cachedDashboard = dashboard
        }
    }
}
