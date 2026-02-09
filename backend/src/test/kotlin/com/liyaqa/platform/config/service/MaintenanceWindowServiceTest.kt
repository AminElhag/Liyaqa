package com.liyaqa.platform.config.service

import com.liyaqa.platform.config.dto.CreateMaintenanceWindowRequest
import com.liyaqa.platform.config.exception.MaintenanceWindowNotFoundException
import com.liyaqa.platform.config.model.MaintenanceWindow
import com.liyaqa.platform.config.repository.MaintenanceWindowRepository
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
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
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MaintenanceWindowServiceTest {

    @Mock
    private lateinit var maintenanceWindowRepository: MaintenanceWindowRepository

    @Mock
    private lateinit var securityService: SecurityService

    private lateinit var service: MaintenanceWindowService

    private val userId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        service = MaintenanceWindowService(maintenanceWindowRepository, securityService)
        whenever(securityService.getCurrentUserId()).thenReturn(userId)
    }

    @Test
    fun `getActiveMaintenanceStatus returns true when active window exists`() {
        val now = Instant.now()
        val window = MaintenanceWindow.create(
            title = "Scheduled Maintenance",
            startAt = now.minus(1, ChronoUnit.HOURS),
            endAt = now.plus(1, ChronoUnit.HOURS),
            createdBy = userId
        )
        whenever(maintenanceWindowRepository.findByIsActiveTrueAndStartAtBeforeAndEndAtAfter(any(), any()))
            .thenReturn(listOf(window))

        val result = service.getActiveMaintenanceStatus()

        assertTrue(result.isMaintenanceActive)
        assertEquals(1, result.activeWindows.size)
    }

    @Test
    fun `getActiveMaintenanceStatus returns false when no active windows`() {
        whenever(maintenanceWindowRepository.findByIsActiveTrueAndStartAtBeforeAndEndAtAfter(any(), any()))
            .thenReturn(emptyList())

        val result = service.getActiveMaintenanceStatus()

        assertFalse(result.isMaintenanceActive)
        assertTrue(result.activeWindows.isEmpty())
    }

    @Test
    fun `cancelMaintenanceWindow sets isActive to false`() {
        val window = MaintenanceWindow.create(
            title = "Maintenance",
            startAt = Instant.now().plus(1, ChronoUnit.HOURS),
            endAt = Instant.now().plus(2, ChronoUnit.HOURS),
            createdBy = userId
        )
        assertTrue(window.isActive)

        whenever(maintenanceWindowRepository.findById(window.id)).thenReturn(Optional.of(window))
        whenever(maintenanceWindowRepository.save(any())).thenAnswer { it.arguments[0] }

        val result = service.cancelMaintenanceWindow(window.id)

        assertFalse(window.isActive)
        assertFalse(result.isActive)
    }

    @Test
    fun `cancelMaintenanceWindow throws when not found`() {
        val id = UUID.randomUUID()
        whenever(maintenanceWindowRepository.findById(id)).thenReturn(Optional.empty())

        assertThrows(MaintenanceWindowNotFoundException::class.java) {
            service.cancelMaintenanceWindow(id)
        }
    }

    @Test
    fun `createMaintenanceWindow creates and returns window`() {
        val request = CreateMaintenanceWindowRequest(
            title = "DB Migration",
            titleAr = "ترحيل قاعدة البيانات",
            description = "Database schema migration",
            startAt = Instant.now().plus(1, ChronoUnit.DAYS),
            endAt = Instant.now().plus(1, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS)
        )

        whenever(maintenanceWindowRepository.save(any())).thenAnswer { it.arguments[0] }

        val result = service.createMaintenanceWindow(request)

        assertNotNull(result)
        assertEquals("DB Migration", result.title)
        assertEquals("ترحيل قاعدة البيانات", result.titleAr)
        assertTrue(result.isActive)
        assertEquals(userId, result.createdBy)
    }
}
