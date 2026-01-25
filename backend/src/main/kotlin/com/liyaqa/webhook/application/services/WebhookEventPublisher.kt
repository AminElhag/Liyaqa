package com.liyaqa.webhook.application.services

import com.liyaqa.attendance.domain.model.AttendanceRecord
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.scheduling.domain.model.ClassBooking
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.webhook.application.commands.WebhookEventData
import com.liyaqa.webhook.domain.model.WebhookEventType
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Service for publishing webhook events from domain actions.
 * Events are queued asynchronously to avoid blocking the main transaction.
 */
@Service
class WebhookEventPublisher(
    private val deliveryService: WebhookDeliveryService
) {
    private val logger = LoggerFactory.getLogger(WebhookEventPublisher::class.java)

    // ==================== MEMBER EVENTS ====================

    @Async
    fun publishMemberCreated(member: Member) {
        publishEvent(
            eventType = WebhookEventType.MEMBER_CREATED,
            tenantId = member.tenantId,
            payload = mapOf(
                "id" to member.id.toString(),
                "email" to member.email,
                "firstName" to member.firstName.en,
                "lastName" to member.lastName.en,
                "phone" to member.phone,
                "status" to member.status.name,
                "createdAt" to member.createdAt.toString()
            )
        )
    }

    @Async
    fun publishMemberUpdated(member: Member) {
        publishEvent(
            eventType = WebhookEventType.MEMBER_UPDATED,
            tenantId = member.tenantId,
            payload = mapOf(
                "id" to member.id.toString(),
                "email" to member.email,
                "firstName" to member.firstName.en,
                "lastName" to member.lastName.en,
                "phone" to member.phone,
                "status" to member.status.name,
                "updatedAt" to member.updatedAt.toString()
            )
        )
    }

    @Async
    fun publishMemberDeleted(memberId: UUID, tenantId: UUID) {
        publishEvent(
            eventType = WebhookEventType.MEMBER_DELETED,
            tenantId = tenantId,
            payload = mapOf(
                "id" to memberId.toString()
            )
        )
    }

    // ==================== SUBSCRIPTION EVENTS ====================

    @Async
    fun publishSubscriptionCreated(subscription: Subscription) {
        publishEvent(
            eventType = WebhookEventType.SUBSCRIPTION_CREATED,
            tenantId = subscription.tenantId,
            payload = buildSubscriptionPayload(subscription)
        )
    }

    @Async
    fun publishSubscriptionActivated(subscription: Subscription) {
        publishEvent(
            eventType = WebhookEventType.SUBSCRIPTION_ACTIVATED,
            tenantId = subscription.tenantId,
            payload = buildSubscriptionPayload(subscription)
        )
    }

    @Async
    fun publishSubscriptionRenewed(subscription: Subscription) {
        publishEvent(
            eventType = WebhookEventType.SUBSCRIPTION_RENEWED,
            tenantId = subscription.tenantId,
            payload = buildSubscriptionPayload(subscription)
        )
    }

    @Async
    fun publishSubscriptionExpired(subscription: Subscription) {
        publishEvent(
            eventType = WebhookEventType.SUBSCRIPTION_EXPIRED,
            tenantId = subscription.tenantId,
            payload = buildSubscriptionPayload(subscription)
        )
    }

    @Async
    fun publishSubscriptionCancelled(subscription: Subscription) {
        publishEvent(
            eventType = WebhookEventType.SUBSCRIPTION_CANCELLED,
            tenantId = subscription.tenantId,
            payload = buildSubscriptionPayload(subscription)
        )
    }

    @Async
    fun publishSubscriptionFrozen(subscription: Subscription) {
        publishEvent(
            eventType = WebhookEventType.SUBSCRIPTION_FROZEN,
            tenantId = subscription.tenantId,
            payload = buildSubscriptionPayload(subscription)
        )
    }

    @Async
    fun publishSubscriptionUnfrozen(subscription: Subscription) {
        publishEvent(
            eventType = WebhookEventType.SUBSCRIPTION_UNFROZEN,
            tenantId = subscription.tenantId,
            payload = buildSubscriptionPayload(subscription)
        )
    }

    private fun buildSubscriptionPayload(subscription: Subscription): Map<String, Any?> = mapOf(
        "id" to subscription.id.toString(),
        "memberId" to subscription.memberId.toString(),
        "planId" to subscription.planId.toString(),
        "status" to subscription.status.name,
        "startDate" to subscription.startDate.toString(),
        "endDate" to subscription.endDate.toString(),
        "autoRenew" to subscription.autoRenew,
        "classesRemaining" to subscription.classesRemaining,
        "freezeDaysRemaining" to subscription.freezeDaysRemaining
    )

    // ==================== INVOICE EVENTS ====================

    @Async
    fun publishInvoiceCreated(invoice: Invoice) {
        publishEvent(
            eventType = WebhookEventType.INVOICE_CREATED,
            tenantId = invoice.tenantId,
            payload = buildInvoicePayload(invoice)
        )
    }

    @Async
    fun publishInvoiceIssued(invoice: Invoice) {
        publishEvent(
            eventType = WebhookEventType.INVOICE_ISSUED,
            tenantId = invoice.tenantId,
            payload = buildInvoicePayload(invoice)
        )
    }

    @Async
    fun publishInvoicePaid(invoice: Invoice) {
        publishEvent(
            eventType = WebhookEventType.INVOICE_PAID,
            tenantId = invoice.tenantId,
            payload = buildInvoicePayload(invoice)
        )
    }

    @Async
    fun publishInvoiceVoided(invoice: Invoice) {
        publishEvent(
            eventType = WebhookEventType.INVOICE_VOIDED,
            tenantId = invoice.tenantId,
            payload = buildInvoicePayload(invoice)
        )
    }

    @Async
    fun publishInvoiceOverdue(invoice: Invoice) {
        publishEvent(
            eventType = WebhookEventType.INVOICE_OVERDUE,
            tenantId = invoice.tenantId,
            payload = buildInvoicePayload(invoice)
        )
    }

    private fun buildInvoicePayload(invoice: Invoice): Map<String, Any?> = mapOf(
        "id" to invoice.id.toString(),
        "invoiceNumber" to invoice.invoiceNumber,
        "memberId" to invoice.memberId.toString(),
        "subscriptionId" to invoice.subscriptionId?.toString(),
        "status" to invoice.status.name,
        "totalAmount" to mapOf(
            "amount" to invoice.totalAmount.amount.toString(),
            "currency" to invoice.totalAmount.currency
        ),
        "dueDate" to invoice.dueDate?.toString(),
        "paidDate" to invoice.paidDate?.toString()
    )

    // ==================== ATTENDANCE EVENTS ====================

    @Async
    fun publishAttendanceCheckIn(attendance: AttendanceRecord) {
        publishEvent(
            eventType = WebhookEventType.ATTENDANCE_CHECKIN,
            tenantId = attendance.tenantId,
            payload = mapOf(
                "id" to attendance.id.toString(),
                "memberId" to attendance.memberId.toString(),
                "locationId" to attendance.locationId.toString(),
                "checkInTime" to attendance.checkInTime.toString(),
                "checkInMethod" to attendance.checkInMethod.name
            )
        )
    }

    @Async
    fun publishAttendanceCheckOut(attendance: AttendanceRecord) {
        publishEvent(
            eventType = WebhookEventType.ATTENDANCE_CHECKOUT,
            tenantId = attendance.tenantId,
            payload = mapOf(
                "id" to attendance.id.toString(),
                "memberId" to attendance.memberId.toString(),
                "locationId" to attendance.locationId.toString(),
                "checkInTime" to attendance.checkInTime.toString(),
                "checkOutTime" to attendance.checkOutTime?.toString(),
                "durationMinutes" to attendance.visitDurationMinutes()
            )
        )
    }

    // ==================== BOOKING EVENTS ====================

    @Async
    fun publishBookingCreated(booking: ClassBooking, tenantId: UUID) {
        publishEvent(
            eventType = WebhookEventType.BOOKING_CREATED,
            tenantId = tenantId,
            payload = buildBookingPayload(booking)
        )
    }

    @Async
    fun publishBookingConfirmed(booking: ClassBooking, tenantId: UUID) {
        publishEvent(
            eventType = WebhookEventType.BOOKING_CONFIRMED,
            tenantId = tenantId,
            payload = buildBookingPayload(booking)
        )
    }

    @Async
    fun publishBookingCancelled(booking: ClassBooking, tenantId: UUID) {
        publishEvent(
            eventType = WebhookEventType.BOOKING_CANCELLED,
            tenantId = tenantId,
            payload = buildBookingPayload(booking)
        )
    }

    @Async
    fun publishBookingCompleted(booking: ClassBooking, tenantId: UUID) {
        publishEvent(
            eventType = WebhookEventType.BOOKING_COMPLETED,
            tenantId = tenantId,
            payload = buildBookingPayload(booking)
        )
    }

    @Async
    fun publishBookingNoShow(booking: ClassBooking, tenantId: UUID) {
        publishEvent(
            eventType = WebhookEventType.BOOKING_NO_SHOW,
            tenantId = tenantId,
            payload = buildBookingPayload(booking)
        )
    }

    private fun buildBookingPayload(booking: ClassBooking): Map<String, Any?> = mapOf(
        "id" to booking.id.toString(),
        "sessionId" to booking.sessionId.toString(),
        "memberId" to booking.memberId.toString(),
        "status" to booking.status.name,
        "checkedInAt" to booking.checkedInAt?.toString(),
        "waitlistPosition" to booking.waitlistPosition
    )

    // ==================== LEAD EVENTS ====================

    @Async
    fun publishLeadCreated(leadId: UUID, tenantId: UUID, payload: Map<String, Any?>) {
        publishEvent(
            eventType = WebhookEventType.LEAD_CREATED,
            tenantId = tenantId,
            payload = payload
        )
    }

    @Async
    fun publishLeadUpdated(leadId: UUID, tenantId: UUID, payload: Map<String, Any?>) {
        publishEvent(
            eventType = WebhookEventType.LEAD_UPDATED,
            tenantId = tenantId,
            payload = payload
        )
    }

    @Async
    fun publishLeadStatusChanged(leadId: UUID, tenantId: UUID, payload: Map<String, Any?>) {
        publishEvent(
            eventType = WebhookEventType.LEAD_STATUS_CHANGED,
            tenantId = tenantId,
            payload = payload
        )
    }

    @Async
    fun publishLeadConverted(leadId: UUID, tenantId: UUID, payload: Map<String, Any?>) {
        publishEvent(
            eventType = WebhookEventType.LEAD_CONVERTED,
            tenantId = tenantId,
            payload = payload
        )
    }

    @Async
    fun publishLeadAssigned(leadId: UUID, tenantId: UUID, payload: Map<String, Any?>) {
        publishEvent(
            eventType = WebhookEventType.LEAD_ASSIGNED,
            tenantId = tenantId,
            payload = payload
        )
    }

    // ==================== HELPER ====================

    private fun publishEvent(eventType: WebhookEventType, tenantId: UUID, payload: Map<String, Any?>) {
        try {
            val eventData = WebhookEventData(
                eventType = eventType.value,
                eventId = UUID.randomUUID(),
                payload = payload,
                tenantId = tenantId
            )
            deliveryService.queueEvent(eventData)
            logger.debug("Published webhook event: ${eventType.value}")
        } catch (e: Exception) {
            logger.error("Failed to publish webhook event ${eventType.value}: ${e.message}", e)
        }
    }
}
