package com.liyaqa.platform.config.service

import com.liyaqa.platform.config.dto.CreateMaintenanceWindowRequest
import com.liyaqa.platform.config.dto.MaintenanceStatusResponse
import com.liyaqa.platform.config.dto.MaintenanceWindowResponse
import com.liyaqa.platform.config.exception.MaintenanceWindowNotFoundException
import com.liyaqa.platform.config.model.MaintenanceWindow
import com.liyaqa.platform.config.repository.MaintenanceWindowRepository
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
@Transactional
class MaintenanceWindowService(
    private val maintenanceWindowRepository: MaintenanceWindowRepository,
    private val securityService: SecurityService
) {

    fun createMaintenanceWindow(request: CreateMaintenanceWindowRequest): MaintenanceWindowResponse {
        val currentUserId = securityService.getCurrentUserId()
            ?: throw IllegalStateException("No authenticated user")

        val window = MaintenanceWindow.create(
            tenantId = request.tenantId,
            title = request.title,
            titleAr = request.titleAr,
            description = request.description,
            descriptionAr = request.descriptionAr,
            startAt = request.startAt,
            endAt = request.endAt,
            createdBy = currentUserId
        )

        val saved = maintenanceWindowRepository.save(window)
        return MaintenanceWindowResponse.from(saved)
    }

    @Transactional(readOnly = true)
    fun getActiveMaintenanceStatus(): MaintenanceStatusResponse {
        val now = Instant.now()
        val activeWindows = maintenanceWindowRepository
            .findByIsActiveTrueAndStartAtBeforeAndEndAtAfter(now, now)

        return MaintenanceStatusResponse(
            isMaintenanceActive = activeWindows.isNotEmpty(),
            activeWindows = activeWindows.map { MaintenanceWindowResponse.from(it) }
        )
    }

    fun cancelMaintenanceWindow(id: UUID): MaintenanceWindowResponse {
        val window = maintenanceWindowRepository.findById(id)
            .orElseThrow { MaintenanceWindowNotFoundException(id) }

        window.cancel()
        val saved = maintenanceWindowRepository.save(window)
        return MaintenanceWindowResponse.from(saved)
    }
}
