package com.liyaqa.platform.analytics.repository

import com.liyaqa.platform.analytics.model.ChurnByPlanRow
import com.liyaqa.platform.analytics.model.ChurnRateData
import com.liyaqa.platform.analytics.model.ChurnReasonRow
import com.liyaqa.platform.analytics.model.FeatureAdoptionRow
import com.liyaqa.platform.analytics.model.GeoDistributionRow
import com.liyaqa.platform.analytics.model.RevenueByPlanRow
import com.liyaqa.platform.analytics.model.TenantGrowthRow
import com.liyaqa.platform.analytics.model.TopTenantRow
import java.math.BigDecimal
import java.time.Instant

interface AnalyticsQueryRepository {
    fun getTenantGrowthMonthly(): List<TenantGrowthRow>
    fun getRevenueByPlan(): List<RevenueByPlanRow>
    fun getGeographicDistribution(): List<GeoDistributionRow>
    fun getTopTenantsByRevenue(limit: Int): List<TopTenantRow>
    fun getChurnRateForPeriod(start: Instant, end: Instant): ChurnRateData
    fun getChurnByPlan(): List<ChurnByPlanRow>
    fun getChurnReasonBreakdown(): List<ChurnReasonRow>
    fun getAverageMembersPerTenant(): Double
    fun getMedianMembersPerTenant(): Double
    fun getAverageStaffPerTenant(): Double
    fun getAverageLoginFrequency(): Double
    fun calculateMrr(): BigDecimal
    fun getFeatureAdoptionStats(): List<FeatureAdoptionRow>
}
