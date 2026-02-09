package com.liyaqa.platform.communication.service

import com.liyaqa.platform.communication.dto.CreateAnnouncementCommand
import com.liyaqa.platform.communication.model.AnnouncementPublishedEvent
import com.liyaqa.platform.communication.exception.AnnouncementNotFoundException
import com.liyaqa.platform.communication.model.Announcement
import com.liyaqa.platform.communication.model.AnnouncementStatus
import com.liyaqa.platform.communication.model.AnnouncementType
import com.liyaqa.platform.communication.model.TargetAudience
import com.liyaqa.platform.communication.repository.AnnouncementRepository
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AnnouncementServiceTest {

    @Mock
    private lateinit var announcementRepository: AnnouncementRepository

    @Mock
    private lateinit var tenantRepository: TenantRepository

    @Mock
    private lateinit var tenantSubscriptionRepository: TenantSubscriptionRepository

    @Mock
    private lateinit var subscriptionPlanRepository: SubscriptionPlanRepository

    @Mock
    private lateinit var eventPublisher: ApplicationEventPublisher

    private lateinit var service: AnnouncementService
    private val userId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        service = AnnouncementService(
            announcementRepository,
            tenantRepository,
            tenantSubscriptionRepository,
            subscriptionPlanRepository,
            eventPublisher
        )
    }

    @Test
    fun `createAnnouncement should create announcement in DRAFT status`() {
        val command = CreateAnnouncementCommand(
            title = "Test",
            content = "Content",
            type = AnnouncementType.GENERAL
        )
        whenever(announcementRepository.save(any<Announcement>())) doReturn Announcement.create(
            title = "Test",
            content = "Content",
            type = AnnouncementType.GENERAL,
            createdBy = userId
        )

        val result = service.createAnnouncement(command, userId)

        assertEquals(AnnouncementStatus.DRAFT, result.status)
        verify(announcementRepository).save(any<Announcement>())
    }

    @Test
    fun `publishAnnouncement should transition to PUBLISHED and fire event`() {
        val announcement = Announcement.create(
            title = "Test",
            content = "Content",
            type = AnnouncementType.GENERAL,
            createdBy = userId
        )
        whenever(announcementRepository.findById(announcement.id)) doReturn Optional.of(announcement)
        whenever(announcementRepository.save(any<Announcement>())) doReturn announcement
        whenever(tenantRepository.findByStatus(any<TenantStatus>(), any<Pageable>())) doReturn PageImpl(emptyList())

        val result = service.publishAnnouncement(announcement.id)

        assertEquals(AnnouncementStatus.PUBLISHED, result.status)
        assertNotNull(result.publishedAt)
        verify(eventPublisher).publishEvent(any<AnnouncementPublishedEvent>())
    }

    @Test
    fun `publishAnnouncement should reject non-DRAFT announcement`() {
        val announcement = Announcement.create(
            title = "Test",
            content = "Content",
            type = AnnouncementType.GENERAL,
            createdBy = userId
        )
        announcement.publish()
        announcement.archive()
        whenever(announcementRepository.findById(announcement.id)) doReturn Optional.of(announcement)

        assertThrows(IllegalArgumentException::class.java) {
            service.publishAnnouncement(announcement.id)
        }
    }

    @Test
    fun `scheduleAnnouncement should set SCHEDULED status`() {
        val announcement = Announcement.create(
            title = "Test",
            content = "Content",
            type = AnnouncementType.GENERAL,
            createdBy = userId
        )
        val scheduledAt = Instant.now().plusSeconds(3600)
        whenever(announcementRepository.findById(announcement.id)) doReturn Optional.of(announcement)
        whenever(announcementRepository.save(any<Announcement>())) doReturn announcement

        val result = service.scheduleAnnouncement(announcement.id, scheduledAt)

        assertEquals(AnnouncementStatus.SCHEDULED, result.status)
        assertEquals(scheduledAt, result.scheduledAt)
    }

    @Test
    fun `archiveAnnouncement should transition to ARCHIVED`() {
        val announcement = Announcement.create(
            title = "Test",
            content = "Content",
            type = AnnouncementType.GENERAL,
            createdBy = userId
        )
        whenever(announcementRepository.findById(announcement.id)) doReturn Optional.of(announcement)
        whenever(announcementRepository.save(any<Announcement>())) doReturn announcement

        val result = service.archiveAnnouncement(announcement.id)

        assertEquals(AnnouncementStatus.ARCHIVED, result.status)
    }

    @Test
    fun `resolveTargetTenantIds should resolve ALL to active tenants`() {
        val tenant1 = Tenant.create(facilityName = "Gym 1", contactEmail = "gym1@test.com")
        val tenant2 = Tenant.create(facilityName = "Gym 2", contactEmail = "gym2@test.com")

        whenever(tenantRepository.findByStatus(any<TenantStatus>(), any<Pageable>())) doReturn
            PageImpl(listOf(tenant1, tenant2))

        val announcement = Announcement.create(
            title = "Test",
            content = "Content",
            type = AnnouncementType.GENERAL,
            targetAudience = TargetAudience.ALL,
            createdBy = userId
        )

        val result = service.resolveTargetTenantIds(announcement)

        assertEquals(2, result.size)
    }
}
