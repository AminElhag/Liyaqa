package com.liyaqa.platform.monitoring.repository

import com.liyaqa.platform.domain.model.HealthTrend
import com.liyaqa.platform.domain.model.RiskLevel
import jakarta.persistence.EntityManager
import jakarta.persistence.Query
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FacilityMetricsRepositoryTest {

    @Mock
    private lateinit var entityManager: EntityManager

    @Mock
    private lateinit var nativeQuery: Query

    private lateinit var repository: FacilityMetricsRepository

    @BeforeEach
    fun setUp() {
        repository = FacilityMetricsRepository(entityManager)
        whenever(entityManager.createNativeQuery(any<String>())).thenReturn(nativeQuery)
    }

    @Test
    fun `getActiveMemberCountsByTenant returns grouped counts`() {
        val tenantId1 = UUID.randomUUID()
        val tenantId2 = UUID.randomUUID()

        whenever(nativeQuery.resultList).thenReturn(listOf(
            arrayOf<Any>(tenantId1, 50L),
            arrayOf<Any>(tenantId2, 30L)
        ))

        val result = repository.getActiveMemberCountsByTenant()

        assertEquals(2, result.size)
        assertEquals(50L, result[tenantId1])
        assertEquals(30L, result[tenantId2])
    }

    @Test
    fun `getOverdueInvoiceCountsByOrganization returns grouped counts`() {
        val orgId1 = UUID.randomUUID()

        whenever(nativeQuery.resultList).thenReturn(listOf(
            arrayOf<Any>(orgId1, 3L)
        ))

        val result = repository.getOverdueInvoiceCountsByOrganization()

        assertEquals(1, result.size)
        assertEquals(3L, result[orgId1])
    }

    @Test
    fun `getLatestHealthScoresByOrganization returns latest per org`() {
        val orgId1 = UUID.randomUUID()
        val orgId2 = UUID.randomUUID()

        whenever(nativeQuery.resultList).thenReturn(listOf(
            arrayOf<Any>(orgId1, 85, "LOW", "STABLE"),
            arrayOf<Any>(orgId2, 45, "HIGH", "DECLINING")
        ))

        val result = repository.getLatestHealthScoresByOrganization()

        assertEquals(2, result.size)
        val score1 = result[orgId1]!!
        assertEquals(85, score1.overallScore)
        assertEquals(RiskLevel.LOW, score1.riskLevel)
        assertEquals(HealthTrend.STABLE, score1.trend)

        val score2 = result[orgId2]!!
        assertEquals(45, score2.overallScore)
        assertEquals(RiskLevel.HIGH, score2.riskLevel)
        assertEquals(HealthTrend.DECLINING, score2.trend)
    }
}
