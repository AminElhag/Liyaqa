package com.liyaqa.platform.communication.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "notification_logs")
class NotificationLog(
    id: UUID = UUID.randomUUID(),

    @Column(name = "announcement_id")
    var announcementId: UUID? = null,

    @Column(name = "template_code", length = 100)
    var templateCode: String? = null,

    @Column(name = "tenant_id", nullable = false)
    var tenantId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false)
    var channel: CommunicationChannel,

    @Column(name = "recipient_email")
    var recipientEmail: String? = null,

    @Column(name = "subject")
    var subject: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: NotificationLogStatus = NotificationLogStatus.PENDING,

    @Column(name = "sent_at")
    var sentAt: Instant? = null,

    @Column(name = "delivered_at")
    var deliveredAt: Instant? = null,

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    var failureReason: String? = null

) : OrganizationLevelEntity(id) {

    fun markSent() {
        status = NotificationLogStatus.SENT
        sentAt = Instant.now()
    }

    fun markDelivered() {
        status = NotificationLogStatus.DELIVERED
        deliveredAt = Instant.now()
    }

    fun markFailed(reason: String) {
        status = NotificationLogStatus.FAILED
        failureReason = reason
    }
}
