package com.liyaqa.platform.monitoring.service

import com.liyaqa.platform.application.services.HealthScoreService
import com.liyaqa.platform.domain.model.ClientHealthScore
import com.liyaqa.platform.domain.model.HealthTrend
import com.liyaqa.platform.domain.model.RiskLevel
import com.liyaqa.platform.monitoring.repository.ClientHealthScoreProjection
import com.liyaqa.platform.monitoring.repository.FacilityMetricsRepository
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.repository.TenantRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.domain.AuditLog
import com.liyaqa.shared.infrastructure.audit.AuditLogRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
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
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FacilityMonitoringServiceTest {

    @Mock
    private lateinit var tenantRepository: TenantRepository

    @Mock
    private lateinit var facilityMetricsRepository: FacilityMetricsRepository

    @Mock
    private lateinit var auditLogRepository: AuditLogRepository

    @Mock
    private lateinit var healthScoreService: HealthScoreService

    private lateinit var service: FacilityMonitoringService

    private val tenantId1 = UUID.randomUUID()
    private val tenantId2 = UUID.randomUUID()
    private val orgId1 = UUID.randomUUID()
    private val orgId2 = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        service = FacilityMonitoringService(
            tenantRepository, facilityMetricsRepository, auditLogRepository, healthScoreService
        )
    }

    @Test
    fun `getAllFacilitiesHealth returns assembled facility data with correct field mapping`() {
        val tenant = createTenant(tenantId1, orgId1, "Gym Alpha")
        val pageable = PageRequest.of(0, 20)
        whenever(tenantRepository.findAll(pageable)).thenReturn(PageImpl(listOf(tenant), pageable, 1))
        setupMetricsMocks()

        val result = service.getAllFacilitiesHealth(pageable)

        assertEquals(1, result.totalElements)
        val facility = result.content[0]
        assertEquals(tenantId1, facility.tenantId)
        assertEquals("Gym Alpha", facility.facilityName)
        assertEquals(TenantStatus.ACTIVE, facility.status)
        assertEquals(50L, facility.activeMembersCount)
        assertEquals(5L, facility.staffCount)
        assertEquals(85, facility.healthScore)
        assertEquals(RiskLevel.LOW, facility.riskLevel)
    }

    @Test
    fun `getAllFacilitiesHealth maps tenant_id counts and organization_id counts correctly`() {
        val tenant = createTenant(tenantId1, orgId1, "Gym Beta")
        val pageable = PageRequest.of(0, 20)
        whenever(tenantRepository.findAll(pageable)).thenReturn(PageImpl(listOf(tenant), pageable, 1))

        whenever(facilityMetricsRepository.getActiveMemberCountsByTenant()).thenReturn(mapOf(tenantId1 to 100L))
        whenever(facilityMetricsRepository.getStaffCountsByTenant()).thenReturn(mapOf(tenantId1 to 10L))
        whenever(facilityMetricsRepository.getOpenTicketCountsByOrganization()).thenReturn(mapOf(orgId1 to 3L))
        whenever(facilityMetricsRepository.getOverdueInvoiceCountsByOrganization()).thenReturn(mapOf(orgId1 to 2L))
        whenever(facilityMetricsRepository.getLastLoginByTenant()).thenReturn(emptyMap())
        whenever(facilityMetricsRepository.getLastActivityByTenant()).thenReturn(emptyMap())
        whenever(facilityMetricsRepository.getLatestHealthScoresByOrganization()).thenReturn(emptyMap())

        val result = service.getAllFacilitiesHealth(pageable)
        val facility = result.content[0]

        assertEquals(100L, facility.activeMembersCount)
        assertEquals(10L, facility.staffCount)
        assertEquals(3L, facility.openTickets)
        assertEquals(2L, facility.overdueInvoices)
    }

    @Test
    fun `getAllFacilitiesHealth returns 0 counts for tenants with no data`() {
        val tenant = createTenant(tenantId2, orgId2, "Gym Empty")
        val pageable = PageRequest.of(0, 20)
        whenever(tenantRepository.findAll(pageable)).thenReturn(PageImpl(listOf(tenant), pageable, 1))

        whenever(facilityMetricsRepository.getActiveMemberCountsByTenant()).thenReturn(emptyMap())
        whenever(facilityMetricsRepository.getStaffCountsByTenant()).thenReturn(emptyMap())
        whenever(facilityMetricsRepository.getOpenTicketCountsByOrganization()).thenReturn(emptyMap())
        whenever(facilityMetricsRepository.getOverdueInvoiceCountsByOrganization()).thenReturn(emptyMap())
        whenever(facilityMetricsRepository.getLastLoginByTenant()).thenReturn(emptyMap())
        whenever(facilityMetricsRepository.getLastActivityByTenant()).thenReturn(emptyMap())
        whenever(facilityMetricsRepository.getLatestHealthScoresByOrganization()).thenReturn(emptyMap())

        val result = service.getAllFacilitiesHealth(pageable)
        val facility = result.content[0]

        assertEquals(0L, facility.activeMembersCount)
        assertEquals(0L, facility.staffCount)
        assertEquals(0L, facility.openTickets)
        assertEquals(0L, facility.overdueInvoices)
        assertEquals(0, facility.healthScore)
        assertEquals(RiskLevel.LOW, facility.riskLevel)
        assertEquals(HealthTrend.STABLE, facility.healthTrend)
    }

    @Test
    fun `getFacilityActivity returns paginated audit logs for tenant`() {
        val tenant = createTenant(tenantId1, orgId1, "Gym Alpha")
        val pageable = PageRequest.of(0, 20)
        whenever(tenantRepository.findById(tenantId1)).thenReturn(Optional.of(tenant))

        val auditLog = AuditLog.create(
            action = AuditAction.LOGIN,
            entityType = "User",
            entityId = UUID.randomUUID(),
            userId = UUID.randomUUID(),
            userEmail = "admin@gym.com",
            description = "Admin logged in",
            organizationId = orgId1
        )
        whenever(auditLogRepository.findByOrganizationId(orgId1, pageable))
            .thenReturn(PageImpl(listOf(auditLog), pageable, 1))

        val result = service.getFacilityActivity(tenantId1, pageable)

        assertEquals(1, result.totalElements)
        assertEquals("LOGIN", result.content[0].action)
        assertEquals("User", result.content[0].entityType)
        assertEquals("admin@gym.com", result.content[0].userEmail)
    }

    @Test
    fun `getAtRiskFacilities returns declining and high-risk facilities sorted by score`() {
        val atRiskScore = createHealthScore(orgId1, 35, RiskLevel.CRITICAL, HealthTrend.DECLINING)
        val decliningScore = createHealthScore(orgId2, 55, RiskLevel.HIGH, HealthTrend.DECLINING)

        whenever(healthScoreService.getAtRiskClients(any()))
            .thenReturn(PageImpl(listOf(atRiskScore)))
        whenever(healthScoreService.getDecliningClients(any()))
            .thenReturn(PageImpl(listOf(decliningScore)))

        val tenant1 = createTenant(tenantId1, orgId1, "Gym Critical")
        val tenant2 = createTenant(tenantId2, orgId2, "Gym Declining")
        whenever(tenantRepository.findAll(Pageable.unpaged()))
            .thenReturn(PageImpl(listOf(tenant1, tenant2)))

        whenever(facilityMetricsRepository.getOpenTicketCountsByOrganization()).thenReturn(mapOf(orgId1 to 5L))
        whenever(facilityMetricsRepository.getOverdueInvoiceCountsByOrganization()).thenReturn(mapOf(orgId1 to 3L))
        whenever(facilityMetricsRepository.getLastLoginByTenant()).thenReturn(emptyMap())

        val result = service.getAtRiskFacilities(PageRequest.of(0, 20))

        assertEquals(2, result.totalElements)
        assertEquals(35, result.content[0].healthScore)
        assertEquals(55, result.content[1].healthScore)
    }

    @Test
    fun `getAtRiskFacilities includes recommendations from weakest area`() {
        val score = createHealthScore(orgId1, 40, RiskLevel.HIGH, HealthTrend.DECLINING)
        score.usageScore = 20
        score.engagementScore = 60
        score.paymentScore = 30
        score.supportScore = 70

        whenever(healthScoreService.getAtRiskClients(any()))
            .thenReturn(PageImpl(listOf(score)))
        whenever(healthScoreService.getDecliningClients(any()))
            .thenReturn(PageImpl(emptyList()))

        val tenant = createTenant(tenantId1, orgId1, "Gym Weak Usage")
        whenever(tenantRepository.findAll(Pageable.unpaged()))
            .thenReturn(PageImpl(listOf(tenant)))

        whenever(facilityMetricsRepository.getOpenTicketCountsByOrganization()).thenReturn(emptyMap())
        whenever(facilityMetricsRepository.getOverdueInvoiceCountsByOrganization()).thenReturn(emptyMap())
        val loginTime = Instant.now().minus(20, ChronoUnit.DAYS)
        whenever(facilityMetricsRepository.getLastLoginByTenant()).thenReturn(mapOf(tenantId1 to loginTime))

        val result = service.getAtRiskFacilities(PageRequest.of(0, 20))

        assertEquals(1, result.totalElements)
        val facility = result.content[0]
        assertNotNull(facility.recommendations)
        assertTrue(facility.recommendations.any { it.contains("admin activity") })
        assertTrue(facility.recommendations.any { it.contains("Payment issues") })
        assertTrue(facility.recommendations.any { it.contains("No admin login") })
    }

    private fun createTenant(id: UUID, orgId: UUID, name: String): Tenant {
        val tenant = Tenant(
            id = id,
            facilityName = name,
            contactEmail = "contact@$name.com",
            status = TenantStatus.ACTIVE,
            organizationId = orgId
        )
        return tenant
    }

    private fun createHealthScore(orgId: UUID, score: Int, risk: RiskLevel, trend: HealthTrend): ClientHealthScore {
        return ClientHealthScore(
            organizationId = orgId,
            overallScore = score,
            riskLevel = risk,
            trend = trend,
            usageScore = 50,
            engagementScore = 50,
            paymentScore = 50,
            supportScore = 50
        )
    }

    private fun setupMetricsMocks() {
        whenever(facilityMetricsRepository.getActiveMemberCountsByTenant()).thenReturn(mapOf(tenantId1 to 50L))
        whenever(facilityMetricsRepository.getStaffCountsByTenant()).thenReturn(mapOf(tenantId1 to 5L))
        whenever(facilityMetricsRepository.getOpenTicketCountsByOrganization()).thenReturn(mapOf(orgId1 to 1L))
        whenever(facilityMetricsRepository.getOverdueInvoiceCountsByOrganization()).thenReturn(mapOf(orgId1 to 0L))
        whenever(facilityMetricsRepository.getLastLoginByTenant()).thenReturn(mapOf(tenantId1 to Instant.now()))
        whenever(facilityMetricsRepository.getLastActivityByTenant()).thenReturn(mapOf(tenantId1 to Instant.now()))
        whenever(facilityMetricsRepository.getLatestHealthScoresByOrganization()).thenReturn(
            mapOf(orgId1 to ClientHealthScoreProjection(85, RiskLevel.LOW, HealthTrend.STABLE))
        )
    }
}
