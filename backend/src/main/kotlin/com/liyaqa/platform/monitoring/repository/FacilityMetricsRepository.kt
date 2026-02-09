package com.liyaqa.platform.monitoring.repository

import com.liyaqa.platform.domain.model.HealthTrend
import com.liyaqa.platform.domain.model.RiskLevel
import jakarta.persistence.EntityManager
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

data class ClientHealthScoreProjection(
    val overallScore: Int,
    val riskLevel: RiskLevel,
    val trend: HealthTrend
)

@Repository
class FacilityMetricsRepository(private val entityManager: EntityManager) {

    fun getActiveMemberCountsByTenant(): Map<UUID, Long> {
        @Suppress("UNCHECKED_CAST")
        val results = entityManager.createNativeQuery(
            "SELECT tenant_id, COUNT(*) FROM members WHERE status = 'ACTIVE' GROUP BY tenant_id"
        ).resultList as List<Array<Any>>

        return results.associate { row ->
            (row[0] as UUID) to (row[1] as Number).toLong()
        }
    }

    fun getStaffCountsByTenant(): Map<UUID, Long> {
        @Suppress("UNCHECKED_CAST")
        val results = entityManager.createNativeQuery(
            "SELECT tenant_id, COUNT(*) FROM users WHERE role IN ('CLUB_ADMIN','TRAINER','RECEPTIONIST','STAFF') GROUP BY tenant_id"
        ).resultList as List<Array<Any>>

        return results.associate { row ->
            (row[0] as UUID) to (row[1] as Number).toLong()
        }
    }

    fun getOpenTicketCountsByOrganization(): Map<UUID, Long> {
        @Suppress("UNCHECKED_CAST")
        val results = entityManager.createNativeQuery(
            "SELECT organization_id, COUNT(*) FROM support_tickets WHERE status IN ('OPEN','IN_PROGRESS') GROUP BY organization_id"
        ).resultList as List<Array<Any>>

        return results.associate { row ->
            (row[0] as UUID) to (row[1] as Number).toLong()
        }
    }

    fun getOverdueInvoiceCountsByOrganization(): Map<UUID, Long> {
        @Suppress("UNCHECKED_CAST")
        val results = entityManager.createNativeQuery(
            "SELECT organization_id, COUNT(*) FROM client_invoices WHERE status = 'OVERDUE' GROUP BY organization_id"
        ).resultList as List<Array<Any>>

        return results.associate { row ->
            (row[0] as UUID) to (row[1] as Number).toLong()
        }
    }

    fun getLastLoginByTenant(): Map<UUID, Instant> {
        @Suppress("UNCHECKED_CAST")
        val results = entityManager.createNativeQuery(
            "SELECT tenant_id, MAX(created_at) FROM audit_logs WHERE action = 'LOGIN' AND tenant_id IS NOT NULL GROUP BY tenant_id"
        ).resultList as List<Array<Any>>

        return results.associate { row ->
            (row[0] as UUID) to (row[1] as java.sql.Timestamp).toInstant()
        }
    }

    fun getLastActivityByTenant(): Map<UUID, Instant> {
        @Suppress("UNCHECKED_CAST")
        val results = entityManager.createNativeQuery(
            "SELECT tenant_id, MAX(created_at) FROM audit_logs WHERE tenant_id IS NOT NULL GROUP BY tenant_id"
        ).resultList as List<Array<Any>>

        return results.associate { row ->
            (row[0] as UUID) to (row[1] as java.sql.Timestamp).toInstant()
        }
    }

    fun getLatestHealthScoresByOrganization(): Map<UUID, ClientHealthScoreProjection> {
        @Suppress("UNCHECKED_CAST")
        val results = entityManager.createNativeQuery(
            """
            SELECT DISTINCT ON (organization_id) organization_id, overall_score, risk_level, trend
            FROM client_health_scores
            ORDER BY organization_id, calculated_at DESC
            """.trimIndent()
        ).resultList as List<Array<Any>>

        return results.associate { row ->
            val orgId = row[0] as UUID
            val overallScore = (row[1] as Number).toInt()
            val riskLevel = RiskLevel.valueOf(row[2] as String)
            val trend = HealthTrend.valueOf(row[3] as String)
            orgId to ClientHealthScoreProjection(overallScore, riskLevel, trend)
        }
    }
}
