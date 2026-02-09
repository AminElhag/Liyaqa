package com.liyaqa.platform.analytics.repository

import com.liyaqa.platform.analytics.model.ChurnByPlanRow
import com.liyaqa.platform.analytics.model.ChurnRateData
import com.liyaqa.platform.analytics.model.ChurnReasonRow
import com.liyaqa.platform.analytics.model.FeatureAdoptionRow
import com.liyaqa.platform.analytics.model.GeoDistributionRow
import com.liyaqa.platform.analytics.model.RevenueByPlanRow
import com.liyaqa.platform.analytics.model.TenantGrowthRow
import com.liyaqa.platform.analytics.model.TopTenantRow
import jakarta.persistence.EntityManager
import org.springframework.stereotype.Repository
import java.math.BigDecimal
import java.math.RoundingMode
import java.sql.Date
import java.time.Instant
import java.util.UUID

@Repository
class JpaAnalyticsQueryRepository(
    private val em: EntityManager
) : AnalyticsQueryRepository {

    override fun getTenantGrowthMonthly(): List<TenantGrowthRow> {
        val rows = em.createNativeQuery("SELECT month, new_tenants, churned_tenants, net_growth FROM v_tenant_growth_monthly ORDER BY month")
            .resultList

        @Suppress("UNCHECKED_CAST")
        return (rows as List<Array<Any>>).map { row ->
            TenantGrowthRow(
                month = (row[0] as Date).toLocalDate(),
                newTenants = (row[1] as Number).toLong(),
                churnedTenants = (row[2] as Number).toLong(),
                netGrowth = (row[3] as Number).toLong()
            )
        }
    }

    override fun getRevenueByPlan(): List<RevenueByPlanRow> {
        val rows = em.createNativeQuery("SELECT plan_name, tenant_count, monthly_revenue_sar FROM v_revenue_by_plan")
            .resultList

        @Suppress("UNCHECKED_CAST")
        return (rows as List<Array<Any>>).map { row ->
            RevenueByPlanRow(
                planName = row[0] as String,
                tenantCount = (row[1] as Number).toLong(),
                revenueSAR = (row[2] as Number).let { BigDecimal(it.toString()) }
            )
        }
    }

    override fun getGeographicDistribution(): List<GeoDistributionRow> {
        val rows = em.createNativeQuery("SELECT city, tenant_count FROM v_tenant_geographic_distribution")
            .resultList

        @Suppress("UNCHECKED_CAST")
        return (rows as List<Array<Any>>).map { row ->
            GeoDistributionRow(
                city = row[0] as String,
                tenantCount = (row[1] as Number).toLong()
            )
        }
    }

    override fun getTopTenantsByRevenue(limit: Int): List<TopTenantRow> {
        val rows = em.createNativeQuery(
            """
            SELECT t.id, t.facility_name, COALESCE(cu.current_members, 0),
                   COALESCE(
                       (SELECT sum(si.total_amount) FROM subscription_invoices si
                        WHERE si.tenant_id = t.id AND si.status = 'PAID'), 0
                   ) AS total_revenue
            FROM tenants t
            LEFT JOIN client_usage cu ON cu.organization_id = t.id
            WHERE t.status = 'ACTIVE'
            ORDER BY total_revenue DESC
            LIMIT :limit
            """.trimIndent()
        ).setParameter("limit", limit).resultList

        @Suppress("UNCHECKED_CAST")
        return (rows as List<Array<Any>>).map { row ->
            TopTenantRow(
                tenantId = row[0] as UUID,
                name = row[1] as String,
                memberCount = (row[2] as Number).toInt(),
                revenueSAR = (row[3] as Number).let { BigDecimal(it.toString()) }
            )
        }
    }

    override fun getChurnRateForPeriod(start: Instant, end: Instant): ChurnRateData {
        // Active at period start + new during period
        val activeAtStart = em.createNativeQuery(
            """
            SELECT count(*) FROM tenants
            WHERE created_at < :start AND (deactivated_at IS NULL OR deactivated_at >= :start)
            """.trimIndent()
        ).setParameter("start", start).singleResult as Number

        val newInPeriod = em.createNativeQuery(
            """
            SELECT count(*) FROM tenants
            WHERE created_at >= :start AND created_at < :end
            """.trimIndent()
        ).setParameter("start", start).setParameter("end", end).singleResult as Number

        val churnedInPeriod = em.createNativeQuery(
            """
            SELECT count(*) FROM tenants
            WHERE deactivated_at >= :start AND deactivated_at < :end
            """.trimIndent()
        ).setParameter("start", start).setParameter("end", end).singleResult as Number

        val totalBase = activeAtStart.toLong() + newInPeriod.toLong()
        val churned = churnedInPeriod.toLong()
        val rate = if (totalBase > 0) {
            BigDecimal(churned).multiply(BigDecimal(100)).divide(BigDecimal(totalBase), 2, RoundingMode.HALF_UP)
        } else {
            BigDecimal.ZERO
        }

        return ChurnRateData(totalStart = activeAtStart.toLong(), churned = churned, rate = rate)
    }

    override fun getChurnByPlan(): List<ChurnByPlanRow> {
        val rows = em.createNativeQuery(
            """
            SELECT sp.name AS plan_name,
                   CASE WHEN count(ts.id) = 0 THEN 0
                        ELSE (count(CASE WHEN ts.status = 'CANCELLED' THEN 1 END) * 100.0 / count(ts.id))
                   END AS churn_rate
            FROM subscription_plans sp
            LEFT JOIN tenant_subscriptions ts ON ts.plan_id = sp.id
            GROUP BY sp.name
            ORDER BY churn_rate DESC
            """.trimIndent()
        ).resultList

        @Suppress("UNCHECKED_CAST")
        return (rows as List<Array<Any>>).map { row ->
            ChurnByPlanRow(
                planName = row[0] as String,
                churnRate = (row[1] as Number).let { BigDecimal(it.toString()).setScale(2, RoundingMode.HALF_UP) }
            )
        }
    }

    override fun getChurnReasonBreakdown(): List<ChurnReasonRow> {
        val rows = em.createNativeQuery(
            """
            SELECT reason, count(*) AS cnt,
                   ROUND(count(*) * 100.0 / NULLIF((SELECT count(*) FROM tenant_deactivation_logs), 0), 2) AS pct
            FROM tenant_deactivation_logs
            GROUP BY reason
            ORDER BY cnt DESC
            """.trimIndent()
        ).resultList

        @Suppress("UNCHECKED_CAST")
        return (rows as List<Array<Any>>).map { row ->
            ChurnReasonRow(
                reason = row[0] as String,
                count = (row[1] as Number).toLong(),
                percentage = row[2]?.let { BigDecimal(it.toString()) } ?: BigDecimal.ZERO
            )
        }
    }

    override fun getAverageMembersPerTenant(): Double {
        val result = em.createNativeQuery(
            "SELECT COALESCE(AVG(current_members), 0) FROM client_usage"
        ).singleResult as Number
        return result.toDouble()
    }

    override fun getMedianMembersPerTenant(): Double {
        val result = em.createNativeQuery(
            """
            SELECT COALESCE(
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY current_members), 0
            ) FROM client_usage
            """.trimIndent()
        ).singleResult as Number
        return result.toDouble()
    }

    override fun getAverageStaffPerTenant(): Double {
        val result = em.createNativeQuery(
            "SELECT COALESCE(AVG(current_staff), 0) FROM client_usage"
        ).singleResult as Number
        return result.toDouble()
    }

    override fun getAverageLoginFrequency(): Double {
        val result = em.createNativeQuery(
            "SELECT COALESCE(AVG(admin_logins_30d), 0) FROM client_health_scores"
        ).singleResult as Number
        return result.toDouble()
    }

    override fun calculateMrr(): BigDecimal {
        val result = em.createNativeQuery(
            """
            SELECT COALESCE(sum(
                CASE ts.billing_cycle
                    WHEN 'MONTHLY' THEN sp.monthly_price_amount
                    WHEN 'ANNUAL'  THEN sp.annual_price_amount / 12
                    ELSE sp.monthly_price_amount
                END
            ), 0)
            FROM tenant_subscriptions ts
            JOIN subscription_plans sp ON sp.id = ts.plan_id
            WHERE ts.status = 'ACTIVE'
            """.trimIndent()
        ).singleResult as Number
        return BigDecimal(result.toString())
    }

    override fun getFeatureAdoptionStats(): List<FeatureAdoptionRow> {
        val rows = em.createNativeQuery(
            """
            SELECT ff.key AS feature_key,
                   ff.name,
                   (SELECT count(*) FROM tenants WHERE status = 'ACTIVE') AS total_available,
                   (SELECT count(DISTINCT tfo.tenant_id) FROM tenant_feature_overrides tfo
                    WHERE tfo.feature_key = ff.key AND tfo.enabled = true) AS active_using,
                   CASE WHEN (SELECT count(*) FROM tenants WHERE status = 'ACTIVE') = 0 THEN 0
                        ELSE ROUND(
                            (SELECT count(DISTINCT tfo.tenant_id) FROM tenant_feature_overrides tfo
                             WHERE tfo.feature_key = ff.key AND tfo.enabled = true) * 100.0
                            / (SELECT count(*) FROM tenants WHERE status = 'ACTIVE'), 2
                        )
                   END AS adoption_rate
            FROM feature_flags ff
            WHERE ff.is_active = true
            ORDER BY adoption_rate DESC
            """.trimIndent()
        ).resultList

        @Suppress("UNCHECKED_CAST")
        return (rows as List<Array<Any>>).map { row ->
            FeatureAdoptionRow(
                featureKey = row[0] as String,
                name = row[1] as String,
                totalAvailable = (row[2] as Number).toLong(),
                activeTenantsUsing = (row[3] as Number).toLong(),
                adoptionRate = (row[4] as Number).let { BigDecimal(it.toString()) }
            )
        }
    }
}
