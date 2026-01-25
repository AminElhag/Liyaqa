package com.liyaqa.marketing.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Log of marketing messages sent.
 */
@Entity
@Table(name = "marketing_message_logs")
class MessageLog(
    @Column(name = "campaign_id", nullable = false)
    val campaignId: UUID,

    @Column(name = "step_id", nullable = false)
    val stepId: UUID,

    @Column(name = "enrollment_id", nullable = false)
    val enrollmentId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false)
    val channel: MarketingChannel,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: MessageStatus = MessageStatus.PENDING,

    @Column(name = "sent_at")
    var sentAt: Instant? = null,

    @Column(name = "delivered_at")
    var deliveredAt: Instant? = null,

    @Column(name = "opened_at")
    var openedAt: Instant? = null,

    @Column(name = "clicked_at")
    var clickedAt: Instant? = null,

    @Column(name = "failed_at")
    var failedAt: Instant? = null,

    @Column(name = "error_message", columnDefinition = "text")
    var errorMessage: String? = null,

    @Column(name = "external_message_id")
    var externalMessageId: String? = null,

    @Column(name = "notification_id")
    var notificationId: UUID? = null,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Mark as sent.
     */
    fun markSent(externalId: String? = null, notificationId: UUID? = null) {
        this.status = MessageStatus.SENT
        this.sentAt = Instant.now()
        this.externalMessageId = externalId
        this.notificationId = notificationId
    }

    /**
     * Mark as delivered.
     */
    fun markDelivered() {
        this.status = MessageStatus.DELIVERED
        this.deliveredAt = Instant.now()
    }

    /**
     * Mark as failed.
     */
    fun markFailed(errorMessage: String) {
        this.status = MessageStatus.FAILED
        this.failedAt = Instant.now()
        this.errorMessage = errorMessage
    }

    /**
     * Mark as bounced.
     */
    fun markBounced(errorMessage: String? = null) {
        this.status = MessageStatus.BOUNCED
        this.failedAt = Instant.now()
        this.errorMessage = errorMessage
    }

    /**
     * Record email open.
     */
    fun recordOpen() {
        if (this.openedAt == null) {
            this.openedAt = Instant.now()
        }
    }

    /**
     * Record link click.
     */
    fun recordClick() {
        if (this.clickedAt == null) {
            this.clickedAt = Instant.now()
        }
    }

    /**
     * Check if message was opened.
     */
    fun wasOpened(): Boolean = openedAt != null

    /**
     * Check if link was clicked.
     */
    fun wasClicked(): Boolean = clickedAt != null

    companion object {
        fun create(
            campaignId: UUID,
            stepId: UUID,
            enrollmentId: UUID,
            memberId: UUID,
            channel: MarketingChannel
        ): MessageLog {
            return MessageLog(
                campaignId = campaignId,
                stepId = stepId,
                enrollmentId = enrollmentId,
                memberId = memberId,
                channel = channel
            )
        }
    }
}
