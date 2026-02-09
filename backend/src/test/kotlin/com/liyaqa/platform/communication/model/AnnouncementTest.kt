package com.liyaqa.platform.communication.model

import com.liyaqa.platform.subscription.model.PlanTier
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

class AnnouncementTest {

    private fun createDraftAnnouncement(): Announcement {
        return Announcement.create(
            title = "Test Announcement",
            content = "Test content",
            type = AnnouncementType.GENERAL,
            createdBy = UUID.randomUUID()
        )
    }

    @Test
    fun `publish should transition DRAFT to PUBLISHED`() {
        val announcement = createDraftAnnouncement()
        assertEquals(AnnouncementStatus.DRAFT, announcement.status)

        announcement.publish()

        assertEquals(AnnouncementStatus.PUBLISHED, announcement.status)
        assertNotNull(announcement.publishedAt)
    }

    @Test
    fun `publish should reject ARCHIVED announcement`() {
        val announcement = createDraftAnnouncement()
        announcement.publish()
        announcement.archive()

        assertThrows(IllegalArgumentException::class.java) {
            announcement.publish()
        }
    }

    @Test
    fun `schedule should set SCHEDULED status and scheduledAt`() {
        val announcement = createDraftAnnouncement()
        val scheduledTime = Instant.now().plusSeconds(3600)

        announcement.schedule(scheduledTime)

        assertEquals(AnnouncementStatus.SCHEDULED, announcement.status)
        assertEquals(scheduledTime, announcement.scheduledAt)
    }

    @Test
    fun `archive should transition any non-archived status to ARCHIVED`() {
        val announcement = createDraftAnnouncement()
        announcement.publish()

        announcement.archive()

        assertEquals(AnnouncementStatus.ARCHIVED, announcement.status)
    }

    @Test
    fun `create factory should set correct defaults`() {
        val createdBy = UUID.randomUUID()
        val announcement = Announcement.create(
            title = "New Feature",
            content = "We have a new feature!",
            type = AnnouncementType.FEATURE_UPDATE,
            targetAudience = TargetAudience.BY_PLAN_TIER,
            targetPlanTier = PlanTier.ENTERPRISE,
            createdBy = createdBy,
            priority = 5
        )

        assertEquals("New Feature", announcement.title)
        assertEquals(AnnouncementStatus.DRAFT, announcement.status)
        assertEquals(TargetAudience.BY_PLAN_TIER, announcement.targetAudience)
        assertEquals(PlanTier.ENTERPRISE, announcement.targetPlanTier)
        assertEquals(createdBy, announcement.createdBy)
        assertEquals(5, announcement.priority)
    }

    @Test
    fun `create should reject invalid priority`() {
        assertThrows(IllegalArgumentException::class.java) {
            Announcement.create(
                title = "Test",
                content = "Test",
                type = AnnouncementType.GENERAL,
                createdBy = UUID.randomUUID(),
                priority = 6
            )
        }
    }
}
