package com.liyaqa.scheduling.application.services

import com.liyaqa.scheduling.domain.model.GxSettings
import com.liyaqa.scheduling.domain.ports.GxSettingsRepository
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TenantContext
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID

@Service
@Transactional
class GxSettingsService(
    private val gxSettingsRepository: GxSettingsRepository
) {

    fun getSettings(): GxSettings {
        val tenantId = TenantContext.getCurrentTenant().value
        return gxSettingsRepository.findByTenantId(tenantId)
            .orElseGet { createDefaultSettings() }
    }

    fun getSettingsForTenant(tenantId: UUID): GxSettings {
        return gxSettingsRepository.findByTenantId(tenantId)
            .orElseGet {
                GxSettings() // Return defaults without persisting
            }
    }

    fun updateSettings(command: UpdateGxSettingsCommand): GxSettings {
        val settings = getSettings()

        command.defaultBookingWindowDays?.let { settings.defaultBookingWindowDays = it }
        command.defaultCancellationDeadlineHours?.let { settings.defaultCancellationDeadlineHours = it }
        command.defaultLateCancellationFee?.let { settings.defaultLateCancellationFee = it }
        command.defaultNoShowFee?.let { settings.defaultNoShowFee = it }
        command.walkinReserveSpots?.let { settings.walkinReserveSpots = it }
        command.autoMarkNoShows?.let { settings.autoMarkNoShows = it }
        command.preClassReminderMinutes?.let { settings.preClassReminderMinutes = it }
        command.waitlistAutoPromote?.let { settings.waitlistAutoPromote = it }
        command.waitlistNotificationChannel?.let { settings.waitlistNotificationChannel = it }
        command.prayerTimeBlockingEnabled?.let { settings.prayerTimeBlockingEnabled = it }

        return gxSettingsRepository.save(settings)
    }

    private fun createDefaultSettings(): GxSettings {
        val settings = GxSettings()
        return gxSettingsRepository.save(settings)
    }
}

data class UpdateGxSettingsCommand(
    val defaultBookingWindowDays: Int? = null,
    val defaultCancellationDeadlineHours: Int? = null,
    val defaultLateCancellationFee: Money? = null,
    val defaultNoShowFee: Money? = null,
    val walkinReserveSpots: Int? = null,
    val autoMarkNoShows: Boolean? = null,
    val preClassReminderMinutes: Int? = null,
    val waitlistAutoPromote: Boolean? = null,
    val waitlistNotificationChannel: String? = null,
    val prayerTimeBlockingEnabled: Boolean? = null
)
