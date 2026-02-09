package com.liyaqa.platform.communication.repository

import com.liyaqa.platform.communication.model.Announcement
import com.liyaqa.platform.communication.model.AnnouncementStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface AnnouncementRepository {
    fun save(announcement: Announcement): Announcement
    fun findById(id: UUID): Optional<Announcement>
    fun findAll(pageable: Pageable): Page<Announcement>
    fun findByStatus(status: AnnouncementStatus, pageable: Pageable): Page<Announcement>
    fun findByStatusAndScheduledAtBefore(status: AnnouncementStatus, instant: Instant): List<Announcement>
}
