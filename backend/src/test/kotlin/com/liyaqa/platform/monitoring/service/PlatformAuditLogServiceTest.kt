package com.liyaqa.platform.monitoring.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.liyaqa.platform.monitoring.model.PlatformAuditAction
import com.liyaqa.platform.monitoring.model.PlatformAuditActorType
import com.liyaqa.platform.monitoring.model.PlatformAuditLog
import com.liyaqa.platform.monitoring.model.PlatformAuditResourceType
import com.liyaqa.platform.monitoring.repository.PlatformAuditLogRepository
import com.liyaqa.shared.infrastructure.export.CsvExportWriter
import org.junit.jupiter.api.AfterEach
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
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.argThat
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PlatformAuditLogServiceTest {

    @Mock
    private lateinit var repository: PlatformAuditLogRepository

    @Mock
    private lateinit var csvExportWriter: CsvExportWriter

    private val objectMapper: ObjectMapper = jacksonObjectMapper()

    private lateinit var service: PlatformAuditLogService

    @BeforeEach
    fun setUp() {
        service = PlatformAuditLogService(repository, csvExportWriter, objectMapper)
    }

    @AfterEach
    fun tearDown() {
        AuditContext.clear()
    }

    @Test
    fun `log creates audit entry with correct actor info from AuditContext`() {
        val actorId = UUID.randomUUID()
        AuditContext.set(
            AuditContext.AuditContextData(
                actorId = actorId,
                actorType = PlatformAuditActorType.PLATFORM_USER,
                actorName = "admin@liyaqa.com",
                correlationId = "corr-123",
                ipAddress = "192.168.1.1"
            )
        )

        whenever(repository.save(any())).thenAnswer { it.arguments[0] }

        service.log(
            action = PlatformAuditAction.USER_LOGIN,
            resourceType = PlatformAuditResourceType.PLATFORM_USER,
            resourceId = actorId
        )

        verify(repository).save(argThat {
            action == PlatformAuditAction.USER_LOGIN &&
                actorType == PlatformAuditActorType.PLATFORM_USER &&
                this.actorId == actorId &&
                actorName == "admin@liyaqa.com" &&
                correlationId == "corr-123" &&
                ipAddress == "192.168.1.1"
        })
    }

    @Test
    fun `log falls back to SYSTEM when no context`() {
        AuditContext.clear()

        whenever(repository.save(any())).thenAnswer { it.arguments[0] }

        service.log(
            action = PlatformAuditAction.SYSTEM_EVENT,
            resourceType = PlatformAuditResourceType.SYSTEM
        )

        verify(repository).save(argThat {
            action == PlatformAuditAction.SYSTEM_EVENT &&
                actorType == PlatformAuditActorType.SYSTEM &&
                actorId == null &&
                actorName == null
        })
    }

    @Test
    fun `logSync creates and returns audit entry`() {
        val resourceId = UUID.randomUUID()
        AuditContext.clear()

        whenever(repository.save(any())).thenAnswer { it.arguments[0] }

        val result = service.logSync(
            action = PlatformAuditAction.DEAL_CREATED,
            resourceType = PlatformAuditResourceType.DEAL,
            resourceId = resourceId,
            details = mapOf("dealName" to "Enterprise Plan")
        )

        assertNotNull(result)
        assertEquals(PlatformAuditAction.DEAL_CREATED, result.action)
        assertEquals(PlatformAuditResourceType.DEAL, result.resourceType)
        assertEquals(resourceId, result.resourceId)
    }

    @Test
    fun `search with no filters returns all logs`() {
        val logs = listOf(
            createAuditLog(PlatformAuditAction.USER_LOGIN),
            createAuditLog(PlatformAuditAction.DEAL_CREATED)
        )
        val page = PageImpl(logs, PageRequest.of(0, 20), 2)

        whenever(repository.findByFilters(
            anyOrNull(), anyOrNull(), anyOrNull(), anyOrNull(),
            anyOrNull(), anyOrNull(), anyOrNull(), any()
        )).thenReturn(page)

        val result = service.search(null, null, null, null, null, null, null, PageRequest.of(0, 20))

        assertEquals(2, result.totalElements)
    }

    @Test
    fun `search with action filter returns matching only`() {
        val logs = listOf(createAuditLog(PlatformAuditAction.USER_LOGIN))
        val page = PageImpl(logs, PageRequest.of(0, 20), 1)

        whenever(repository.findByFilters(
            anyOrNull(), anyOrNull(), anyOrNull(), anyOrNull(),
            anyOrNull(), anyOrNull(), anyOrNull(), any()
        )).thenReturn(page)

        val result = service.search(
            PlatformAuditAction.USER_LOGIN, null, null, null, null, null, null,
            PageRequest.of(0, 20)
        )

        assertEquals(1, result.totalElements)
        assertEquals(PlatformAuditAction.USER_LOGIN, result.content[0].action)
    }

    @Test
    fun `search with date range returns matching only`() {
        val dateFrom = Instant.parse("2026-01-01T00:00:00Z")
        val dateTo = Instant.parse("2026-01-31T23:59:59Z")
        val logs = listOf(createAuditLog(PlatformAuditAction.DEAL_WON))
        val page = PageImpl(logs, PageRequest.of(0, 20), 1)

        whenever(repository.findByFilters(
            anyOrNull(), anyOrNull(), anyOrNull(), anyOrNull(),
            anyOrNull(), anyOrNull(), anyOrNull(), any()
        )).thenReturn(page)

        val result = service.search(null, null, null, null, dateFrom, dateTo, null, PageRequest.of(0, 20))

        assertEquals(1, result.totalElements)
    }

    @Test
    fun `exportCsv generates valid CSV bytes`() {
        val logs = listOf(
            createAuditLog(PlatformAuditAction.USER_LOGIN),
            createAuditLog(PlatformAuditAction.DEAL_CREATED)
        )
        val page = PageImpl(logs, Pageable.unpaged(), 2)

        whenever(repository.findByFilters(
            anyOrNull(), anyOrNull(), anyOrNull(), anyOrNull(),
            anyOrNull(), anyOrNull(), anyOrNull(), any()
        )).thenReturn(page)

        val expectedCsv = "csv-content".toByteArray()
        whenever(csvExportWriter.write(any(), any())).thenReturn(expectedCsv)

        val result = service.exportCsv(null, null, null, null, null, null, null)

        assertEquals(expectedCsv, result)
        verify(csvExportWriter).write(
            argThat { size == 9 && first() == "Timestamp" },
            argThat { size == 2 }
        )
    }

    @Test
    fun `getAvailableActions returns all actions with display names`() {
        val actions = service.getAvailableActions()

        assertEquals(PlatformAuditAction.entries.size, actions.size)
        val loginAction = actions.find { it.name == "USER_LOGIN" }
        assertNotNull(loginAction)
        assertEquals("User login", loginAction!!.displayName)
    }

    @Test
    fun `getAvailableResourceTypes returns all resource types`() {
        val types = service.getAvailableResourceTypes()

        assertEquals(PlatformAuditResourceType.entries.size, types.size)
        assertTrue(types.any { it.name == "PLATFORM_USER" })
    }

    private fun createAuditLog(action: PlatformAuditAction): PlatformAuditLog {
        return PlatformAuditLog(
            action = action,
            resourceType = PlatformAuditResourceType.PLATFORM_USER,
            actorType = PlatformAuditActorType.PLATFORM_USER,
            actorName = "test@liyaqa.com"
        )
    }
}
