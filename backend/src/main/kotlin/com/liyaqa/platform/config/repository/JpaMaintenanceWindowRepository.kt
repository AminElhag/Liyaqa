package com.liyaqa.platform.config.repository

import com.liyaqa.platform.config.model.MaintenanceWindow
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataMaintenanceWindowRepository : JpaRepository<MaintenanceWindow, UUID> {
    fun findByIsActiveTrueAndStartAtBeforeAndEndAtAfter(startBefore: Instant, endAfter: Instant): List<MaintenanceWindow>
    fun findByIsActiveTrue(): List<MaintenanceWindow>
}

@Repository
class JpaMaintenanceWindowRepository(
    private val springDataRepository: SpringDataMaintenanceWindowRepository
) : MaintenanceWindowRepository {

    override fun save(window: MaintenanceWindow): MaintenanceWindow =
        springDataRepository.save(window)

    override fun findById(id: UUID): Optional<MaintenanceWindow> =
        springDataRepository.findById(id)

    override fun findByIsActiveTrueAndStartAtBeforeAndEndAtAfter(startBefore: Instant, endAfter: Instant): List<MaintenanceWindow> =
        springDataRepository.findByIsActiveTrueAndStartAtBeforeAndEndAtAfter(startBefore, endAfter)

    override fun findByIsActiveTrue(): List<MaintenanceWindow> =
        springDataRepository.findByIsActiveTrue()
}
