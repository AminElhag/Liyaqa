package com.liyaqa.platform.config.repository

import com.liyaqa.platform.config.model.MaintenanceWindow
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface MaintenanceWindowRepository {
    fun save(window: MaintenanceWindow): MaintenanceWindow
    fun findById(id: UUID): Optional<MaintenanceWindow>
    fun findAll(): List<MaintenanceWindow>
    fun findByIsActiveTrueAndStartAtBeforeAndEndAtAfter(startBefore: Instant, endAfter: Instant): List<MaintenanceWindow>
    fun findByIsActiveTrue(): List<MaintenanceWindow>
}
