package com.liyaqa.platform.communication.service

import com.liyaqa.platform.communication.dto.CreateAnnouncementCommand
import com.liyaqa.platform.communication.dto.UpdateAnnouncementCommand
import com.liyaqa.platform.communication.exception.AnnouncementNotFoundException
import com.liyaqa.platform.communication.exception.InvalidAnnouncementStateException
import com.liyaqa.platform.communication.model.Announcement
import com.liyaqa.platform.communication.model.AnnouncementPublishedEvent
import com.liyaqa.platform.communication.model.AnnouncementStatus
import com.liyaqa.platform.communication.model.CommunicationChannel
import com.liyaqa.platform.communication.model.TargetAudience
import com.liyaqa.platform.communication.repository.AnnouncementRepository
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
@Transactional
class AnnouncementService(
    private val announcementRepository: AnnouncementRepository,
    private val tenantRepository: TenantRepository,
    private val tenantSubscriptionRepository: TenantSubscriptionRepository,
    private val subscriptionPlanRepository: SubscriptionPlanRepository,
    private val eventPublisher: ApplicationEventPublisher
) {
    private val log = LoggerFactory.getLogger(AnnouncementService::class.java)

    fun createAnnouncement(command: CreateAnnouncementCommand, createdBy: UUID): Announcement {
        val announcement = Announcement.create(
            title = command.title,
            content = command.content,
            type = command.type,
            targetAudience = command.targetAudience,
            targetTenantIds = command.targetTenantIds.toMutableList(),
            targetPlanTier = command.targetPlanTier,
            targetStatus = command.targetStatus,
            createdBy = createdBy,
            priority = command.priority
        )
        return announcementRepository.save(announcement)
    }

    fun updateAnnouncement(id: UUID, command: UpdateAnnouncementCommand): Announcement {
        val announcement = findOrThrow(id)
        if (announcement.status != AnnouncementStatus.DRAFT) {
            throw InvalidAnnouncementStateException("Can only update announcements in DRAFT status, current: ${announcement.status}")
        }
        command.title?.let { announcement.title = it }
        command.content?.let { announcement.content = it }
        command.type?.let { announcement.type = it }
        command.targetAudience?.let { announcement.targetAudience = it }
        command.targetTenantIds?.let { announcement.targetTenantIds = it.toMutableList() }
        command.targetPlanTier?.let { announcement.targetPlanTier = it }
        command.targetStatus?.let { announcement.targetStatus = it }
        command.priority?.let { announcement.priority = it }
        return announcementRepository.save(announcement)
    }

    fun publishAnnouncement(id: UUID): Announcement {
        val announcement = findOrThrow(id)
        announcement.publish()
        val saved = announcementRepository.save(announcement)

        val targetIds = resolveTargetTenantIds(saved)
        eventPublisher.publishEvent(
            AnnouncementPublishedEvent(
                announcementId = saved.id,
                title = saved.title,
                content = saved.content,
                targetTenantIds = targetIds,
                channels = listOf(CommunicationChannel.EMAIL)
            )
        )
        log.info("Published announcement {} to {} tenants", saved.id, targetIds.size)
        return saved
    }

    fun scheduleAnnouncement(id: UUID, scheduledAt: Instant): Announcement {
        val announcement = findOrThrow(id)
        announcement.schedule(scheduledAt)
        return announcementRepository.save(announcement)
    }

    fun archiveAnnouncement(id: UUID): Announcement {
        val announcement = findOrThrow(id)
        announcement.archive()
        return announcementRepository.save(announcement)
    }

    @Transactional(readOnly = true)
    fun getAnnouncement(id: UUID): Announcement = findOrThrow(id)

    @Transactional(readOnly = true)
    fun listAnnouncements(pageable: Pageable): Page<Announcement> =
        announcementRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun getActiveAnnouncements(pageable: Pageable): Page<Announcement> =
        announcementRepository.findByStatus(AnnouncementStatus.PUBLISHED, pageable)

    fun resolveTargetTenantIds(announcement: Announcement): List<UUID> {
        return when (announcement.targetAudience) {
            TargetAudience.ALL -> {
                tenantRepository.findByStatus(TenantStatus.ACTIVE, Pageable.unpaged())
                    .content.map { it.id }
            }
            TargetAudience.SPECIFIC_TENANTS -> {
                announcement.targetTenantIds.toList()
            }
            TargetAudience.BY_PLAN_TIER -> {
                val tier = announcement.targetPlanTier ?: return emptyList()
                val plan = subscriptionPlanRepository.findByTier(tier).orElse(null)
                    ?: return emptyList()
                tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)
                    .filter { it.planId == plan.id }
                    .map { it.tenantId }
            }
            TargetAudience.BY_STATUS -> {
                val status = announcement.targetStatus ?: TenantStatus.ACTIVE
                tenantRepository.findByStatus(status, Pageable.unpaged())
                    .content.map { it.id }
            }
        }
    }

    private fun findOrThrow(id: UUID): Announcement =
        announcementRepository.findById(id).orElseThrow { AnnouncementNotFoundException(id) }
}
