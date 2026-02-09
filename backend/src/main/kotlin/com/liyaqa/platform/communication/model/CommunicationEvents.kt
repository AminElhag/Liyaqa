package com.liyaqa.platform.communication.model

import java.time.Instant
import java.util.UUID

data class AnnouncementPublishedEvent(
    val announcementId: UUID,
    val title: String,
    val content: String,
    val targetTenantIds: List<UUID>,
    val channels: List<CommunicationChannel>,
    val occurredAt: Instant = Instant.now()
)

data class NotificationDispatchEvent(
    val templateCode: String,
    val tenantId: UUID,
    val channel: CommunicationChannel,
    val recipientEmail: String?,
    val variables: Map<String, String>,
    val occurredAt: Instant = Instant.now()
)
