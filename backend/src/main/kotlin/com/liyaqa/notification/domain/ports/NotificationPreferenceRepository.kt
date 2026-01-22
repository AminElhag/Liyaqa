package com.liyaqa.notification.domain.ports

import com.liyaqa.notification.domain.model.NotificationPreference
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for NotificationPreference entities.
 */
interface NotificationPreferenceRepository {
    fun save(preference: NotificationPreference): NotificationPreference
    fun findById(id: UUID): Optional<NotificationPreference>
    fun findByMemberId(memberId: UUID): Optional<NotificationPreference>
    fun existsByMemberId(memberId: UUID): Boolean
    fun deleteById(id: UUID)
    fun deleteByMemberId(memberId: UUID)
}
