package com.liyaqa.webhook.application.listeners

import com.liyaqa.shared.domain.DomainEvent
import com.liyaqa.webhook.application.commands.WebhookEventData
import com.liyaqa.webhook.application.services.WebhookDeliveryService
import com.liyaqa.webhook.domain.model.WebhookEventType
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import java.util.UUID

/**
 * Marker interface for events that should trigger webhook deliveries.
 */
interface WebhookTriggerEvent : DomainEvent {
    val webhookEventType: WebhookEventType
    fun toWebhookPayload(): Map<String, Any?>
}

/**
 * Listens for domain events and queues webhook deliveries.
 * Uses TransactionalEventListener to ensure webhooks are only queued after
 * the originating transaction commits successfully.
 */
@Component
class DomainEventWebhookListener(
    private val deliveryService: WebhookDeliveryService
) {
    private val logger = LoggerFactory.getLogger(DomainEventWebhookListener::class.java)

    /**
     * Handle webhook trigger events after transaction commits.
     * Uses AFTER_COMMIT to ensure data is persisted before webhook is sent.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleWebhookTriggerEvent(event: WebhookTriggerEvent) {
        try {
            val eventData = WebhookEventData(
                eventType = event.webhookEventType.value,
                eventId = event.eventId,
                payload = event.toWebhookPayload(),
                tenantId = event.tenantId.value
            )

            deliveryService.queueEvent(eventData)
            logger.debug("Queued webhook for event: ${event.webhookEventType.value}")
        } catch (e: Exception) {
            // Don't let webhook failures affect the main flow
            logger.error("Failed to queue webhook for event ${event.webhookEventType}: ${e.message}", e)
        }
    }
}

// ============ Domain Event Definitions ============

/**
 * Event fired when a member is created.
 */
data class MemberCreatedEvent(
    val memberId: UUID,
    val memberEmail: String,
    val memberName: String,
    override val tenantId: com.liyaqa.shared.domain.TenantId
) : com.liyaqa.shared.domain.BaseDomainEvent(tenantId), WebhookTriggerEvent {
    override val webhookEventType = WebhookEventType.MEMBER_CREATED

    override fun toWebhookPayload(): Map<String, Any?> = mapOf(
        "member_id" to memberId.toString(),
        "email" to memberEmail,
        "name" to memberName
    )
}

/**
 * Event fired when a member is updated.
 */
data class MemberUpdatedEvent(
    val memberId: UUID,
    val memberEmail: String,
    val memberName: String,
    val changedFields: List<String>,
    override val tenantId: com.liyaqa.shared.domain.TenantId
) : com.liyaqa.shared.domain.BaseDomainEvent(tenantId), WebhookTriggerEvent {
    override val webhookEventType = WebhookEventType.MEMBER_UPDATED

    override fun toWebhookPayload(): Map<String, Any?> = mapOf(
        "member_id" to memberId.toString(),
        "email" to memberEmail,
        "name" to memberName,
        "changed_fields" to changedFields
    )
}

/**
 * Event fired when a subscription is created.
 */
data class SubscriptionCreatedEvent(
    val subscriptionId: UUID,
    val memberId: UUID,
    val planId: UUID,
    val planName: String,
    val startDate: String,
    val endDate: String,
    override val tenantId: com.liyaqa.shared.domain.TenantId
) : com.liyaqa.shared.domain.BaseDomainEvent(tenantId), WebhookTriggerEvent {
    override val webhookEventType = WebhookEventType.SUBSCRIPTION_CREATED

    override fun toWebhookPayload(): Map<String, Any?> = mapOf(
        "subscription_id" to subscriptionId.toString(),
        "member_id" to memberId.toString(),
        "plan_id" to planId.toString(),
        "plan_name" to planName,
        "start_date" to startDate,
        "end_date" to endDate
    )
}

/**
 * Event fired when an invoice is created.
 */
data class InvoiceCreatedEvent(
    val invoiceId: UUID,
    val invoiceNumber: String,
    val memberId: UUID,
    val totalAmount: String,
    val currency: String,
    override val tenantId: com.liyaqa.shared.domain.TenantId
) : com.liyaqa.shared.domain.BaseDomainEvent(tenantId), WebhookTriggerEvent {
    override val webhookEventType = WebhookEventType.INVOICE_CREATED

    override fun toWebhookPayload(): Map<String, Any?> = mapOf(
        "invoice_id" to invoiceId.toString(),
        "invoice_number" to invoiceNumber,
        "member_id" to memberId.toString(),
        "total_amount" to totalAmount,
        "currency" to currency
    )
}

/**
 * Event fired when an invoice is paid.
 */
data class InvoicePaidEvent(
    val invoiceId: UUID,
    val invoiceNumber: String,
    val memberId: UUID,
    val totalAmount: String,
    val currency: String,
    val paidAt: String,
    override val tenantId: com.liyaqa.shared.domain.TenantId
) : com.liyaqa.shared.domain.BaseDomainEvent(tenantId), WebhookTriggerEvent {
    override val webhookEventType = WebhookEventType.INVOICE_PAID

    override fun toWebhookPayload(): Map<String, Any?> = mapOf(
        "invoice_id" to invoiceId.toString(),
        "invoice_number" to invoiceNumber,
        "member_id" to memberId.toString(),
        "total_amount" to totalAmount,
        "currency" to currency,
        "paid_at" to paidAt
    )
}

/**
 * Event fired when a member checks in.
 */
data class AttendanceCheckinEvent(
    val attendanceId: UUID,
    val memberId: UUID,
    val locationId: UUID?,
    val checkinTime: String,
    override val tenantId: com.liyaqa.shared.domain.TenantId
) : com.liyaqa.shared.domain.BaseDomainEvent(tenantId), WebhookTriggerEvent {
    override val webhookEventType = WebhookEventType.ATTENDANCE_CHECKIN

    override fun toWebhookPayload(): Map<String, Any?> = mapOf(
        "attendance_id" to attendanceId.toString(),
        "member_id" to memberId.toString(),
        "location_id" to locationId?.toString(),
        "checkin_time" to checkinTime
    )
}

/**
 * Event fired when a member checks out.
 */
data class AttendanceCheckoutEvent(
    val attendanceId: UUID,
    val memberId: UUID,
    val locationId: UUID?,
    val checkoutTime: String,
    val duration: Long?,
    override val tenantId: com.liyaqa.shared.domain.TenantId
) : com.liyaqa.shared.domain.BaseDomainEvent(tenantId), WebhookTriggerEvent {
    override val webhookEventType = WebhookEventType.ATTENDANCE_CHECKOUT

    override fun toWebhookPayload(): Map<String, Any?> = mapOf(
        "attendance_id" to attendanceId.toString(),
        "member_id" to memberId.toString(),
        "location_id" to locationId?.toString(),
        "checkout_time" to checkoutTime,
        "duration_minutes" to duration
    )
}

/**
 * Event fired when a booking is created.
 */
data class BookingCreatedEvent(
    val bookingId: UUID,
    val memberId: UUID,
    val sessionId: UUID,
    val className: String,
    val sessionDate: String,
    val sessionTime: String,
    override val tenantId: com.liyaqa.shared.domain.TenantId
) : com.liyaqa.shared.domain.BaseDomainEvent(tenantId), WebhookTriggerEvent {
    override val webhookEventType = WebhookEventType.BOOKING_CREATED

    override fun toWebhookPayload(): Map<String, Any?> = mapOf(
        "booking_id" to bookingId.toString(),
        "member_id" to memberId.toString(),
        "session_id" to sessionId.toString(),
        "class_name" to className,
        "session_date" to sessionDate,
        "session_time" to sessionTime
    )
}

/**
 * Event fired when a booking is cancelled.
 */
data class BookingCancelledEvent(
    val bookingId: UUID,
    val memberId: UUID,
    val sessionId: UUID,
    val reason: String?,
    override val tenantId: com.liyaqa.shared.domain.TenantId
) : com.liyaqa.shared.domain.BaseDomainEvent(tenantId), WebhookTriggerEvent {
    override val webhookEventType = WebhookEventType.BOOKING_CANCELLED

    override fun toWebhookPayload(): Map<String, Any?> = mapOf(
        "booking_id" to bookingId.toString(),
        "member_id" to memberId.toString(),
        "session_id" to sessionId.toString(),
        "reason" to reason
    )
}
