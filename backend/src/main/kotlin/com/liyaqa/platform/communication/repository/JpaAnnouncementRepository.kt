package com.liyaqa.platform.communication.repository

import com.liyaqa.platform.communication.model.Announcement
import com.liyaqa.platform.communication.model.AnnouncementStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataAnnouncementRepository : JpaRepository<Announcement, UUID> {
    fun findByStatus(status: AnnouncementStatus, pageable: Pageable): Page<Announcement>
    fun findByStatusAndScheduledAtBefore(status: AnnouncementStatus, instant: Instant): List<Announcement>
}

@Repository
class JpaAnnouncementRepository(
    private val springDataRepository: SpringDataAnnouncementRepository
) : AnnouncementRepository {

    override fun save(announcement: Announcement): Announcement =
        springDataRepository.save(announcement)

    override fun findById(id: UUID): Optional<Announcement> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<Announcement> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: AnnouncementStatus, pageable: Pageable): Page<Announcement> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByStatusAndScheduledAtBefore(status: AnnouncementStatus, instant: Instant): List<Announcement> =
        springDataRepository.findByStatusAndScheduledAtBefore(status, instant)
}
