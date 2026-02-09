package com.liyaqa.platform.monitoring.service

import com.zaxxer.hikari.HikariDataSource
import io.micrometer.core.instrument.Gauge
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.search.Search
import jakarta.persistence.EntityManager
import jakarta.persistence.Query
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
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
import org.springframework.boot.actuate.health.CompositeHealth
import org.springframework.boot.actuate.health.Health
import org.springframework.boot.actuate.health.HealthComponent
import org.springframework.boot.actuate.health.HealthEndpoint
import org.springframework.boot.actuate.health.Status
import org.springframework.core.env.Environment
import java.sql.Timestamp
import java.time.Instant
import java.time.temporal.ChronoUnit

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SystemMonitoringServiceTest {

    @Mock
    private lateinit var healthEndpoint: HealthEndpoint

    @Mock
    private lateinit var meterRegistry: MeterRegistry

    @Mock
    private lateinit var dataSource: HikariDataSource

    @Mock
    private lateinit var entityManager: EntityManager

    @Mock
    private lateinit var errorTrackingService: ErrorTrackingService

    @Mock
    private lateinit var environment: Environment

    @Mock
    private lateinit var search: Search

    @Mock
    private lateinit var gauge: Gauge

    @Mock
    private lateinit var nativeQuery: Query

    @Mock
    private lateinit var hikariPoolMXBean: com.zaxxer.hikari.HikariPoolMXBean

    private lateinit var service: SystemMonitoringService

    @BeforeEach
    fun setUp() {
        service = SystemMonitoringService(
            healthEndpoint, meterRegistry, dataSource, entityManager, errorTrackingService, environment
        )
    }

    @Test
    fun `getSystemHealth returns UP status with JVM metrics`() {
        setupHealthMocks(Status.UP)
        setupMeterMocks()
        setupDataSourceMocks()
        whenever(environment.activeProfiles).thenReturn(arrayOf("local"))
        whenever(environment.getProperty("liyaqa.version", "1.0.0")).thenReturn("2.0.0")

        val result = service.getSystemHealth()

        assertEquals("UP", result.status)
        assertNotNull(result.jvm)
        assertTrue(result.jvm.availableProcessors > 0)
        assertEquals("2.0.0", result.version)
        assertEquals("local", result.environment)
    }

    @Test
    fun `getSystemHealth returns database connection pool stats`() {
        setupHealthMocks(Status.UP)
        setupMeterMocks()
        setupDataSourceMocks()
        whenever(environment.activeProfiles).thenReturn(arrayOf("dev"))
        whenever(environment.getProperty("liyaqa.version", "1.0.0")).thenReturn("1.0.0")

        val result = service.getSystemHealth()

        assertEquals("UP", result.database.status)
        assertEquals(3, result.database.activeConnections)
        assertEquals(7, result.database.idleConnections)
        assertEquals(20, result.database.maxConnections)
        assertEquals(15.0, result.database.utilizationPercent)
    }

    @Test
    fun `getScheduledJobs returns job list with running status`() {
        val lockedAt = Timestamp.from(Instant.now().minus(1, ChronoUnit.HOURS))
        val lockUntilPast = Timestamp.from(Instant.now().minus(30, ChronoUnit.MINUTES))

        whenever(entityManager.createNativeQuery(any<String>())).thenReturn(nativeQuery)
        whenever(nativeQuery.resultList).thenReturn(listOf(
            arrayOf<Any?>("expireSubscriptions", lockUntilPast, lockedAt, "node-1"),
            arrayOf<Any?>("markOverdueInvoices", lockUntilPast, lockedAt, "node-1")
        ))

        val result = service.getScheduledJobs()

        assertTrue(result.isNotEmpty())
        val expireJob = result.find { it.name == "expireSubscriptions" }
        assertNotNull(expireJob)
        assertEquals("Expire subscriptions past end date", expireJob!!.description)
        assertEquals("Daily 1:00 AM", expireJob.schedule)
        assertFalse(expireJob.isRunning)
    }

    @Test
    fun `getScheduledJobs detects currently running jobs`() {
        val lockedAt = Timestamp.from(Instant.now().minus(5, ChronoUnit.MINUTES))
        val lockUntilFuture = Timestamp.from(Instant.now().plus(5, ChronoUnit.MINUTES))

        whenever(entityManager.createNativeQuery(any<String>())).thenReturn(nativeQuery)
        whenever(nativeQuery.resultList).thenReturn(listOf(
            arrayOf<Any?>("markOverdueInvoices", lockUntilFuture, lockedAt, "node-2")
        ))

        val result = service.getScheduledJobs()

        val overdueJob = result.find { it.name == "markOverdueInvoices" }
        assertNotNull(overdueJob)
        assertTrue(overdueJob!!.isRunning)
        assertEquals("node-2", overdueJob.lockedBy)
    }

    @Mock
    private lateinit var compositeHealth: CompositeHealth

    private fun setupHealthMocks(status: Status) {
        val dbHealth = Health.Builder().status(status).build()
        val redisHealth = Health.Builder().status(status).build()

        val components = mapOf<String, HealthComponent>(
            "db" to dbHealth,
            "redis" to redisHealth
        )

        whenever(compositeHealth.status).thenReturn(status)
        whenever(compositeHealth.components).thenReturn(components)
        whenever(healthEndpoint.health()).thenReturn(compositeHealth)
    }

    private fun setupMeterMocks() {
        whenever(meterRegistry.find("process.uptime")).thenReturn(search)
        whenever(search.gauge()).thenReturn(gauge)
        whenever(gauge.value()).thenReturn(12345.0)

        val memSearch = org.mockito.Mockito.mock(Search::class.java)
        val memGauge = org.mockito.Mockito.mock(Gauge::class.java)
        whenever(meterRegistry.find("jvm.memory.used")).thenReturn(memSearch)
        whenever(memSearch.gauge()).thenReturn(memGauge)
        whenever(memGauge.value()).thenReturn(256.0 * 1024 * 1024)

        val memMaxSearch = org.mockito.Mockito.mock(Search::class.java)
        val memMaxGauge = org.mockito.Mockito.mock(Gauge::class.java)
        whenever(meterRegistry.find("jvm.memory.max")).thenReturn(memMaxSearch)
        whenever(memMaxSearch.gauge()).thenReturn(memMaxGauge)
        whenever(memMaxGauge.value()).thenReturn(512.0 * 1024 * 1024)
    }

    private fun setupDataSourceMocks() {
        whenever(dataSource.hikariPoolMXBean).thenReturn(hikariPoolMXBean)
        whenever(hikariPoolMXBean.activeConnections).thenReturn(3)
        whenever(hikariPoolMXBean.idleConnections).thenReturn(7)
        whenever(dataSource.maximumPoolSize).thenReturn(20)
    }
}
