package com.liyaqa.notification.infrastructure.persistence

import com.liyaqa.notification.domain.model.NotificationPreference
import com.liyaqa.notification.domain.ports.NotificationPreferenceRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataNotificationPreferenceRepository : JpaRepository<NotificationPreference, UUID> {
    fun findByMemberId(memberId: UUID): Optional<NotificationPreference>
    fun existsByMemberId(memberId: UUID): Boolean
    fun deleteByMemberId(memberId: UUID)
}

@Repository
class JpaNotificationPreferenceRepository(
    private val springDataRepository: SpringDataNotificationPreferenceRepository
) : NotificationPreferenceRepository {

    override fun save(preference: NotificationPreference): NotificationPreference =
        springDataRepository.save(preference)

    override fun findById(id: UUID): Optional<NotificationPreference> =
        springDataRepository.findById(id)

    override fun findByMemberId(memberId: UUID): Optional<NotificationPreference> =
        springDataRepository.findByMemberId(memberId)

    override fun existsByMemberId(memberId: UUID): Boolean =
        springDataRepository.existsByMemberId(memberId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun deleteByMemberId(memberId: UUID) =
        springDataRepository.deleteByMemberId(memberId)
}
