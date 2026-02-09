package com.liyaqa.platform.communication.service

import com.liyaqa.platform.communication.model.AnnouncementStatus
import com.liyaqa.platform.communication.repository.AnnouncementRepository
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Component
class AnnouncementScheduler(
    private val announcementRepository: AnnouncementRepository,
    private val announcementService: AnnouncementService
) {
    private val log = LoggerFactory.getLogger(AnnouncementScheduler::class.java)

    @Scheduled(fixedRate = 60000)
    @SchedulerLock(name = "publishScheduledAnnouncements", lockAtMostFor = "PT5M", lockAtLeastFor = "PT30S")
    @Transactional
    fun publishScheduledAnnouncements() {
        val now = Instant.now()
        val scheduled = announcementRepository.findByStatusAndScheduledAtBefore(
            AnnouncementStatus.SCHEDULED, now
        )
        for (announcement in scheduled) {
            try {
                announcementService.publishAnnouncement(announcement.id)
                log.info("Auto-published scheduled announcement: {}", announcement.id)
            } catch (e: Exception) {
                log.error("Failed to auto-publish announcement {}: {}", announcement.id, e.message)
            }
        }
    }
}
